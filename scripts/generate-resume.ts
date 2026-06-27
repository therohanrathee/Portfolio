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
  skills: string,
  jobTitle: string
): Promise<string[]> {
  const prompt = `You are an expert technical resume writer. Write 2 concise, highly professional, ATS-optimized bullet points for a project in a developer resume.
The candidate is applying for the role of "${jobTitle}".
Use the STAR method (Situation, Task, Action, Result). 
- Start each bullet point with a strong, diverse action verb (e.g. Architected, Optimized, Developed, Automated, Spearheaded, Implemented).
- Emphasize technical details, language usage, frameworks, and engineering value most relevant to the role of "${jobTitle}".
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

async function generateSummary(
  genAI: GoogleGenerativeAI,
  jobTitle: string,
  skills: string,
  bio: string
): Promise<string> {
  const prompt = `You are an expert technical resume writer. Write a professional, high-impact resume summary (3 sentences maximum) for a candidate applying to the position of "${jobTitle}".
Use the candidate's background bio and skills list to construct the summary. It must be highly polished, active, and fully optimized for Applicant Tracking Systems (ATS).

Candidate Bio:
${bio}

Candidate Skills:
${skills}

Return ONLY the raw text for the summary. Do not include quotes, markdown wrappers, or intro text.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    });
    return response.response.text().trim();
  } catch (error) {
    console.warn("Gemini 2.0-flash summary failed, trying 1.5-flash...");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      });
      return response.response.text().trim();
    } catch (fallbackError) {
      console.error("AI summary generation failed entirely, using fallback.", fallbackError);
      return bio;
    }
  }
}

async function polishAchievements(
  genAI: GoogleGenerativeAI,
  jobTitle: string,
  achievements: any[]
): Promise<any[]> {
  const prompt = `You are an expert technical resume writer. Polish the following achievements/certifications to make them highly professional and relevant for a candidate applying to the role of "${jobTitle}".
For each achievement:
- Refine the description to highlight leadership, problem-solving, engineering value, or creative execution.
- Keep each description concise and under 160 characters.

Achievements:
${JSON.stringify(achievements, null, 2)}

Return the response in raw JSON format matching this schema:
[
  {
    "title": "Achievement Title",
    "subtitle": "Subtitle",
    "institution": "Institution Name",
    "description": "Polished description here"
  }
]

Return ONLY the raw JSON output.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    return JSON.parse(response.response.text());
  } catch (error) {
    console.warn("Gemini 2.0-flash achievements polish failed, trying 1.5-flash...");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });
      return JSON.parse(response.response.text());
    } catch (fallbackError) {
      console.error("AI achievements polish failed entirely, using fallback.", fallbackError);
      return achievements;
    }
  }
}

async function reorderSkills(
  genAI: GoogleGenerativeAI,
  jobTitle: string,
  skills: any[]
): Promise<any[]> {
  const prompt = `You are an expert technical resume writer. Given a list of skills and their categories, reorder the skills in each category so that the skills most critical and relevant to the role of "${jobTitle}" are sorted at the top of their respective lists.
Do not modify or add new skills; only reorder them.

Skills List:
${JSON.stringify(skills, null, 2)}

Return the response in raw JSON format matching this schema:
[
  { "name": "Skill Name", "type": "tech|creative|professional" }
]

Return ONLY the raw JSON output.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    return JSON.parse(response.response.text());
  } catch (error) {
    console.warn("Gemini 2.0-flash skills reorder failed, trying 1.5-flash...");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });
      return JSON.parse(response.response.text());
    } catch (fallbackError) {
      console.error("AI skills reorder failed entirely, using fallback.", fallbackError);
      return skills;
    }
  }
}

async function main() {
  console.log("Starting resume generation process...");

  // Load target role lock-in logic
  const publicDir = path.join(__dirname, "../public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  const roleLockPath = path.join(publicDir, "target-role.txt");

  let jobTitle = "Software Engineer & Graphic Designer";
  const argTitle = process.argv[2];

  if (argTitle) {
    jobTitle = argTitle.trim();
    // Write new job title to lock file
    fs.writeFileSync(roleLockPath, jobTitle, "utf8");
    console.log(`Job title locked in as: "${jobTitle}" (saved to ${roleLockPath})`);
  } else if (fs.existsSync(roleLockPath)) {
    const lockedRole = fs.readFileSync(roleLockPath, "utf8").trim();
    if (lockedRole) {
      jobTitle = lockedRole;
      console.log(`Loaded locked-in job title from file: "${jobTitle}"`);
    }
  } else {
    console.log(`No job title provided and no lock file found. Using default: "${jobTitle}"`);
  }

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
      bullets = await generateBullets(genAI, project, skillsString, jobTitle);
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

  // AI-customized variables
  let finalSummary = profileData.bio.join(" ");
  let finalAchievements = [...profileData.achievements];
  let finalSkills = [...profileData.skills];

  if (genAI) {
    console.log(`Running AI optimizations tailored to: "${jobTitle}"`);
    
    // 1. AI summary
    console.log("Generating AI summary...");
    finalSummary = await generateSummary(genAI, jobTitle, skillsString, profileData.bio.join(" "));

    // 2. AI achievements
    console.log("Polishing achievements with AI...");
    finalAchievements = await polishAchievements(genAI, jobTitle, profileData.achievements);

    // 3. AI skills reordering
    console.log("Reordering skills with AI...");
    const reordered = await reorderSkills(genAI, jobTitle, profileData.skills);
    
    // Map values to make sure we keep categories correctly
    if (Array.isArray(reordered) && reordered.length > 0) {
      finalSkills = reordered.map((item: any) => {
        const original = profileData.skills.find(s => s.name.toLowerCase() === item.name.toLowerCase());
        return {
          name: item.name,
          type: item.type || (original ? original.type : "tech")
        };
      });
    }
  }

  // Build the HTML template for A4 PDF compilation
  const techSkills = finalSkills.filter(s => s.type === "tech").map(s => s.name).join(", ");
  const creativeSkills = finalSkills.filter(s => s.type === "creative").map(s => s.name).join(", ");
  const professionalSkills = finalSkills.filter(s => s.type === "professional").map(s => s.name).join(", ");

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
      font-family: Arial, Helvetica, sans-serif;
      color: #222222;
      background-color: #ffffff;
      line-height: 1.4;
      font-size: 9.5px;
      padding: 0.4in;
    }
    a {
      color: #222222;
      text-decoration: none;
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      color: #111111;
    }
    .contact-info {
      font-size: 9px;
      color: #555555;
      margin-bottom: 4px;
    }
    .contact-info a {
      color: #0b57d0;
      text-decoration: underline;
    }
    .section-title {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #222222;
      padding-bottom: 1px;
      margin-top: 12px;
      margin-bottom: 6px;
      color: #111111;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1px;
    }
    .bold-text {
      font-weight: 700;
      color: #111111;
    }
    .italic-text {
      font-style: italic;
      color: #444444;
    }
    .item-block {
      margin-bottom: 8px;
    }
    .skills-block {
      line-height: 1.5;
      margin-bottom: 8px;
    }
    .bullets {
      list-style-type: disc;
      padding-left: 14px;
      margin-top: 2px;
    }
    .bullets li {
      font-size: 9.5px;
      color: #333333;
      margin-bottom: 2px;
      line-height: 1.35;
    }
    .summary-text {
      font-size: 9.5px;
      color: #333333;
      line-height: 1.4;
      margin-bottom: 6px;
      text-align: justify;
    }
  </style>
</head>
<body>

  <div class="header">
    <h1>${profileData.name}</h1>
    <div class="contact-info">
      ${profileData.contact.location} &nbsp;|&nbsp; 
      ${profileData.contact.phone} &nbsp;|&nbsp; 
      <a href="mailto:${profileData.contact.email}">${profileData.contact.email}</a> &nbsp;|&nbsp; 
      <a href="${profileData.contact.github}">github.com/therohanrathee</a> &nbsp;|&nbsp; 
      <a href="${profileData.contact.linkedin}">linkedin.com/in/rohanrathee</a>
    </div>
  </div>

  <div class="section-title">Summary</div>
  <p class="summary-text">${finalSummary}</p>

  <div class="section-title">Education</div>
  ${profileData.education.map(edu => `
    <div class="item-block">
      <div class="row">
        <span class="bold-text">${edu.title}</span>
        <span class="bold-text">${edu.year}</span>
      </div>
      <div class="row">
        <span class="italic-text">${edu.school}</span>
        <span class="italic-text">${edu.detail}</span>
      </div>
    </div>
  `).join("")}

  <div class="section-title">Skills</div>
  <div class="skills-block">
    <div><span class="bold-text">Technical Skills:</span> ${techSkills}</div>
    <div><span class="bold-text">Creative & Multimedia:</span> ${creativeSkills}</div>
    <div><span class="bold-text">Professional Qualities:</span> ${professionalSkills}</div>
  </div>

  <div class="section-title">Achievements & Leadership</div>
  ${finalAchievements.map(ach => `
    <div class="item-block">
      <div class="row">
        <span class="bold-text">${ach.title}</span>
        <span class="bold-text">${ach.subtitle || ""}</span>
      </div>
      <div class="row">
        <span class="italic-text">${ach.institution || ""}</span>
      </div>
      <p style="margin-top: 2px; font-size: 9.5px; color: #333333; line-height: 1.35;">
        ${ach.description}
      </p>
    </div>
  `).join("")}

  <div class="section-title">Featured Projects</div>
  ${projectsWithBullets.map(project => `
    <div class="item-block">
      <div class="row">
        <span class="bold-text">${project.name.replace(/-/g, ' ')}</span>
        <span><a href="${project.url}" target="_blank" style="text-decoration: underline; color: #0b57d0;">View Code</a></span>
      </div>
      <div class="italic-text" style="font-size: 9px; margin-bottom: 2px;">Technologies: ${[project.language, ...project.topics].filter(Boolean).join(", ")}</div>
      <ul class="bullets">
        ${project.bullets.map(b => `<li>${b}</li>`).join("")}
      </ul>
    </div>
  `).join("")}

</body>
</html>
  `;

  // Compile HTML to PDF using Puppeteer
  console.log("Compiling PDF with Puppeteer...");
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
