import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { profileData } from "../src/data/profile";

async function fetchPinnedRepos(): Promise<string[]> {
  const pinnedRepos: string[] = [];
  try {
    const res = await fetch("https://github.com/therohanrathee");
    if (res.ok) {
      const html = await res.text();
      const regex = /href="\/therohanrathee\/([^"/]+)"/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        if (!pinnedRepos.includes(match[1])) {
          pinnedRepos.push(match[1]);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching pinned repos:", error);
  }
  return pinnedRepos;
}

async function fetchAllRepos(): Promise<any[]> {
  try {
    const res = await fetch("https://api.github.com/users/therohanrathee/repos?sort=updated&per_page=100");
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Error fetching all repos:", error);
  }
  return [];
}

async function generateBullets(
  genAI: GoogleGenerativeAI,
  repo: any,
  skills: string
): Promise<string[]> {
  const prompt = `You are an expert technical resume writer. Write 2 concise, highly professional, ATS-optimized bullet points for a project in a developer resume.
Use the STAR method (Situation, Task, Action, Result). 
- Start each bullet point with a strong, diverse action verb (e.g. Architected, Optimized, Developed, Automated, Spearheaded, Implemented).
- Emphasize technical details, language usage, frameworks, and engineering value.
- If the project has a description, draw from it. If not, infer from name, language, and topics.
- Keep each bullet point under 180 characters.

Project Metadata:
- Name: ${repo.name}
- Description: ${repo.description || "No description provided."}
- Primary Language: ${repo.language || "Software Engineering"}
- Topics/Skills: ${(repo.topics || []).join(", ")}

Developer Skills List:
${skills}

Return the response in raw JSON format matching this schema:
{
  "bullets": [
    "bullet point 1",
    "bullet point 2"
  ]
}

Return ONLY the raw JSON output.`;

  // Try 2.0-flash first
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    const data = JSON.parse(response.response.text());
    return data.bullets || [];
  } catch (error) {
    console.warn(`Gemini 2.0-flash failed for ${repo.name}, trying Gemini 1.5-flash...`);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });
      const data = JSON.parse(response.response.text());
      return data.bullets || [];
    } catch (fallbackError) {
      console.error(`Gemini 1.5-flash also failed for ${repo.name}:`, fallbackError);
      return [
        `Developed ${repo.name} using ${repo.language || "modern technologies"} with focus on clean architecture and performance.`,
        `Integrated repository features, setting up code versioning and documenting implementation details on GitHub.`
      ];
    }
  }
}

async function main() {
  console.log("Starting resume generation process...");

  // Validate API Key
  const apiKey = process.env.GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log("Gemini API client initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY env variable not found. Falling back to default bullet points.");
  }

  // Fetch repositories
  const pinnedList = await fetchPinnedRepos();
  const allRepos = await fetchAllRepos();

  const normalizedPinned = pinnedList.map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ""));
  
  // Format and prioritize repositories
  const mappedProjects = allRepos.map((repo) => {
    const key = repo.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const isPinned = normalizedPinned.includes(key);
    return {
      name: repo.name,
      description: repo.description,
      language: repo.language,
      topics: repo.topics || [],
      isPinned,
      url: repo.html_url,
      updatedAt: new Date(repo.updated_at).getTime()
    };
  });

  // Sort: Pinned first, then sorted by last updated
  const sortedProjects = mappedProjects.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  // Take top 4 projects to ensure everything fits cleanly on one page
  const selectedProjects = sortedProjects.slice(0, 4);
  console.log(`Selected top ${selectedProjects.length} projects for resume generation.`);

  const skillsString = profileData.skills.map(s => s.name).join(", ");
  
  // Generate content bullets for each project
  const projectsWithBullets = [];
  for (const project of selectedProjects) {
    console.log(`Generating bullets for: ${project.name}...`);
    let bullets: string[] = [];
    if (genAI) {
      bullets = await generateBullets(genAI, project, skillsString);
    } else {
      bullets = [
        `Designed and implemented the repository using ${project.language || "software tools"}, applying standard styling and responsive design principles.`,
        `Configured git source control, structure, and documentation to align with dynamic portfolio deployment criteria.`
      ];
    }
    projectsWithBullets.push({
      ...project,
      bullets
    });
  }

  // Build the HTML template for A4 PDF compilation
  const techSkills = profileData.skills.filter(s => s.type === "tech").map(s => s.name).join(", ");
  const creativeSkills = profileData.skills.filter(s => s.type === "creative").map(s => s.name).join(", ");
  const professionalSkills = profileData.skills.filter(s => s.type === "professional").map(s => s.name).join(", ");

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Resume - ${profileData.name}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333333;
      background-color: #ffffff;
      line-height: 1.4;
      font-size: 11px;
      padding: 0.4in;
    }
    a {
      color: #0b57d0;
      text-decoration: none;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    .header h1 {
      font-size: 26px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
      color: #111111;
    }
    .header .subtitle {
      font-size: 12px;
      font-weight: 500;
      color: #666;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .contact-info {
      font-size: 10px;
      color: #444;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .contact-info span {
      display: flex;
      align-items: center;
    }
    .container {
      display: flex;
      justify-content: space-between;
    }
    .left-col {
      width: 32%;
      border-right: 1px solid #ddd;
      padding-right: 15px;
    }
    .right-col {
      width: 65%;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #333;
      padding-bottom: 2px;
      margin-bottom: 8px;
      margin-top: 12px;
      color: #111;
    }
    .left-col .section-title:first-of-type,
    .right-col .section-title:first-of-type {
      margin-top: 0;
    }
    .info-block {
      margin-bottom: 10px;
    }
    .info-title {
      font-weight: 700;
      font-size: 11px;
      color: #111;
    }
    .info-sub {
      font-style: italic;
      color: #555;
      font-size: 10px;
      margin-bottom: 2px;
    }
    .info-detail {
      font-size: 9.5px;
      color: #666;
    }
    .skills-group {
      margin-bottom: 8px;
    }
    .skills-group-title {
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
      color: #444;
      margin-bottom: 2px;
    }
    .skills-list {
      font-size: 10px;
      color: #333;
      line-height: 1.3;
    }
    .project-block {
      margin-bottom: 10px;
    }
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3px;
    }
    .project-name {
      font-weight: 700;
      font-size: 11px;
      color: #111;
    }
    .project-link {
      font-size: 9.5px;
    }
    .project-tech {
      font-style: italic;
      font-size: 9.5px;
      color: #666;
      margin-bottom: 3px;
    }
    .bullets {
      list-style-type: square;
      padding-left: 15px;
    }
    .bullets li {
      font-size: 10px;
      color: #333;
      margin-bottom: 3px;
      line-height: 1.35;
    }
    .summary-text {
      font-size: 10px;
      color: #444;
      line-height: 1.4;
      margin-bottom: 10px;
      text-align: justify;
    }
  </style>
</head>
<body>

  <div class="header">
    <h1>${profileData.name}</h1>
    <div class="subtitle">${profileData.title}</div>
    <div class="contact-info">
      <span>📍 ${profileData.contact.location}</span>
      <span>✉️ <a href="mailto:${profileData.contact.email}">${profileData.contact.email}</a></span>
      <span>📞 ${profileData.contact.phone}</span>
      <span>🌐 <a href="${profileData.contact.github}">github.com/therohanrathee</a></span>
      <span>🔗 <a href="${profileData.contact.linkedin}">linkedin.com/in/rohanrathee</a></span>
    </div>
  </div>

  <div class="container">
    <div class="left-col">
      <div class="section-title">Skills</div>
      
      <div class="skills-group">
        <div class="skills-group-title">Technical Skills</div>
        <div class="skills-list">${techSkills}</div>
      </div>
      
      <div class="skills-group">
        <div class="skills-group-title">Creative & Multimedia</div>
        <div class="skills-list">${creativeSkills}</div>
      </div>
      
      <div class="skills-group">
        <div class="skills-group-title">Professional Qualities</div>
        <div class="skills-list">${professionalSkills}</div>
      </div>

      <div class="section-title">Education</div>
      ${profileData.education.map(edu => `
        <div class="info-block">
          <div class="info-title">${edu.title}</div>
          <div class="info-sub">${edu.school} (${edu.year})</div>
          <div class="info-detail">${edu.detail}</div>
        </div>
      `).join("")}

      <div class="section-title">Languages</div>
      <div class="info-block">
        <div class="info-list" style="font-size: 10px;">${profileData.personal.languages}</div>
      </div>
    </div>

    <div class="right-col">
      <div class="section-title">Profile Summary</div>
      <p class="summary-text">${profileData.bio.join(" ")}</p>

      <div class="section-title">Achievements & Leadership</div>
      <div class="info-block">
        <div class="info-header" style="display: flex; justify-content: space-between; align-items: baseline;">
          <span class="info-title">${profileData.ssb.title}</span>
          <span style="font-size: 9.5px; font-weight: 700; color: #555;">${profileData.ssb.badge}</span>
        </div>
        <div class="info-detail" style="margin-top: 3px; font-size: 10px; line-height: 1.35; color: #333;">
          ${profileData.ssb.description}
        </div>
      </div>

      <div class="section-title">Featured Projects</div>
      ${projectsWithBullets.map(project => `
        <div class="project-block">
          <div class="project-header">
            <span class="project-name">${project.name.replace(/-/g, ' ')}</span>
            <span class="project-link"><a href="${project.url}" target="_blank">View Code</a></span>
          </div>
          <div class="project-tech">Languages/Topics: ${[project.language, ...project.topics].filter(Boolean).join(", ")}</div>
          <ul class="bullets">
            ${project.bullets.map(b => `<li>${b}</li>`).join("")}
          </ul>
        </div>
      `).join("")}
    </div>
  </div>

</body>
</html>
  `;

  // Compile HTML to PDF using Puppeteer
  console.log("Compiling PDF with Puppeteer...");
  const publicDir = path.join(__dirname, "../public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  const outputPath = path.join(publicDir, "resume.pdf");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" as any });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "0.2in",
      right: "0.2in",
      bottom: "0.2in",
      left: "0.2in"
    }
  });

  await browser.close();
  console.log(`Success! Resume generated and saved to ${outputPath}`);
}

main().catch((err) => {
  console.error("Resume generation failed:", err);
  process.exit(1);
});
