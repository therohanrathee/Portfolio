import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { profileData } from "../src/data/profile";

interface ResumeConfig {
  showSummary: boolean;
  showPositionsOfResponsibility: boolean;
  showExtraCurriculars: boolean;
}

const DEFAULT_CONFIG: ResumeConfig = {
  showSummary: true,
  showPositionsOfResponsibility: true,
  showExtraCurriculars: true,
};

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

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
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
    console.warn(`Gemini 3.5-flash failed for ${repo.name}:`, error);
    return [
      `Developed ${repo.name} using ${repo.language || "modern technologies"} with focus on clean architecture and performance.`,
      `Integrated repository features, setting up code versioning and documenting implementation details on GitHub.`
    ];
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
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    });
    return response.response.text().trim();
  } catch (error) {
    console.error("AI summary generation failed entirely, using fallback.", error);
    return bio;
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
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    return JSON.parse(response.response.text());
  } catch (error) {
    console.error("AI achievements polish failed entirely, using fallback.", error);
    return achievements;
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
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    return JSON.parse(response.response.text());
  } catch (error) {
    console.error("AI skills reorder failed entirely, using fallback.", error);
    return skills;
  }
}

// Function to classify skills into: Languages, Frameworks, Tools and Libraries
function categorizeSkills(skills: { name: string; type: string }[]) {
  // Static configuration lists for categorization (fully case-insensitive)
  const LANGUAGES = ["javascript", "typescript", "swift", "python", "c++", "html", "css", "swift (ios)"];
  const FRAMEWORKS = ["next.js", "react", "swiftui", "uikit", "postgresql", "supabase", "react native", "express", "django", "node.js"];
  
  const languages: string[] = [];
  const frameworks: string[] = [];
  const tools: string[] = [];

  for (const skill of skills) {
    const nameLower = skill.name.toLowerCase();
    
    // Explicitly omit Dlib as requested
    if (nameLower === "dlib") {
      continue;
    }
    
    // Skip soft skills / professional qualities for technical resume layout
    if (skill.type === "professional") {
      continue;
    }

    if (LANGUAGES.includes(nameLower)) {
      languages.push(skill.name);
    } else if (FRAMEWORKS.includes(nameLower)) {
      frameworks.push(skill.name);
    } else {
      // Everything else that is tech or creative goes to Tools and Libraries
      tools.push(skill.name);
    }
  }

  return {
    languages: languages.join(", "),
    frameworks: frameworks.join(", "),
    tools: tools.join(", "),
  };
}

async function main() {
  console.log("Starting resume generation process...");

  // Load target role lock-in logic
  const publicDir = path.join(__dirname, "../public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  const roleLockPath = path.join(publicDir, "target-role.txt");
  const configPath = path.join(publicDir, "resume-config.json");

  let jobTitle = "Full Stack & iOS Developer";
  
  // Parse command line arguments
  // Arguments format: tsx scripts/generate-resume.ts [jobTitle] [--flags...]
  const args = process.argv.slice(2);
  let positionalArgTitle = "";
  let cliFlags: Partial<ResumeConfig> = {};
  let hasCliFlags = false;

  for (const arg of args) {
    if (arg.startsWith("--")) {
      hasCliFlags = true;
      if (arg === "--skip-summary" || arg === "--no-summary") {
        cliFlags.showSummary = false;
      } else if (arg === "--show-summary") {
        cliFlags.showSummary = true;
      } else if (arg === "--skip-responsibility" || arg === "--no-responsibility") {
        cliFlags.showPositionsOfResponsibility = false;
      } else if (arg === "--show-responsibility") {
        cliFlags.showPositionsOfResponsibility = true;
      } else if (arg === "--skip-extracurriculars" || arg === "--no-extracurriculars") {
        cliFlags.showExtraCurriculars = false;
      } else if (arg === "--show-extracurriculars") {
        cliFlags.showExtraCurriculars = true;
      }
    } else {
      positionalArgTitle = arg;
    }
  }

  // Handle Job Title
  if (positionalArgTitle) {
    jobTitle = positionalArgTitle.trim();
    fs.writeFileSync(roleLockPath, jobTitle, "utf8");
    console.log(`Job title locked in as: "${jobTitle}"`);
  } else if (fs.existsSync(roleLockPath)) {
    const lockedRole = fs.readFileSync(roleLockPath, "utf8").trim();
    if (lockedRole) {
      jobTitle = lockedRole;
      console.log(`Loaded locked-in job title from file: "${jobTitle}"`);
    }
  }

  // Handle persistent configuration
  let config = { ...DEFAULT_CONFIG };
  if (fs.existsSync(configPath)) {
    try {
      const savedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      config = { ...config, ...savedConfig };
      console.log("Loaded persistent configuration:", config);
    } catch (e) {
      console.error("Error reading config file:", e);
    }
  }

  // Update persistent configuration if CLI flags are passed
  if (hasCliFlags) {
    config = { ...config, ...cliFlags };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
    console.log("Updated and saved persistent configuration:", config);
  }

  // Validate API Key
  const apiKey = process.env.GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log("Gemini API client initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY env variable not found. Bullet points will use fallback generators.");
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
    console.log(`Running AI optimizations tailored to: "${jobTitle}" using Gemini 3.5 Flash`);
    
    // 1. AI summary
    if (config.showSummary) {
      console.log("Generating AI summary...");
      finalSummary = await generateSummary(genAI, jobTitle, skillsString, profileData.bio.join(" "));
    }

    // 2. AI achievements
    console.log("Polishing achievements with AI...");
    finalAchievements = await polishAchievements(genAI, jobTitle, profileData.achievements);

    // 3. AI skills reordering
    console.log("Reordering skills with AI...");
    const reordered = await reorderSkills(genAI, jobTitle, profileData.skills);
    
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

  // Categorize skills into Languages, Frameworks, and Tools and Libraries
  const categorized = categorizeSkills(finalSkills);

  // Parse Hobbies & Interests
  const hobbiesString = profileData.hobbies.map(h => h.name).join(", ");

  // Build the HTML template for A4 PDF compilation
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
      font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
      color: #222222;
      background-color: #ffffff;
      line-height: 1.4;
      font-size: 9.5px;
      padding: 0.35in;
    }
    a {
      color: #222222;
      text-decoration: none;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      color: #111111;
    }
    .contact-info {
      font-size: 9px;
      color: #555555;
      margin-bottom: 2px;
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
      margin-top: 10px;
      margin-bottom: 5px;
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
      margin-bottom: 6px;
    }
    .skills-block {
      line-height: 1.4;
      margin-bottom: 6px;
    }
    .bullets {
      list-style-type: disc;
      padding-left: 14px;
      margin-top: 2px;
    }
    .bullets li {
      font-size: 9.5px;
      color: #333333;
      margin-bottom: 1px;
      line-height: 1.35;
    }
    .summary-text {
      font-size: 9.5px;
      color: #333333;
      line-height: 1.35;
      margin-bottom: 5px;
      text-align: justify;
    }
  </style>
</head>
<body>

  <!-- Header -->
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

  <!-- 1. Summary (Toggleable) -->
  ${config.showSummary ? `
    <div class="section-title">Professional Summary</div>
    <p class="summary-text">${finalSummary}</p>
  ` : ""}

  <!-- 2. Education -->
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

  <!-- 3 & 4. Experience & Internships (Show only if they exist) -->
  <!-- Currently none in profileData, omitted dynamically -->

  <!-- 5. Projects -->
  <div class="section-title">Key Projects</div>
  ${projectsWithBullets.map(project => `
    <div class="item-block">
      <div class="row">
        <span class="bold-text">${project.name.replace(/-/g, ' ')}</span>
        <span><a href="${project.url}" target="_blank" style="text-decoration: underline; color: #0b57d0;">View Code</a></span>
      </div>
      <div class="italic-text" style="font-size: 9px; margin-bottom: 1px;">Technologies: ${[project.language, ...project.topics].filter(t => t.toLowerCase() !== "dlib").join(", ")}</div>
      <ul class="bullets">
        ${project.bullets.map(b => `<li>${b}</li>`).join("")}
      </ul>
    </div>
  `).join("")}

  <!-- 6. Position of Responsibility (Toggleable) -->
  ${config.showPositionsOfResponsibility ? `
    <div class="section-title">Positions of Responsibility</div>
    ${profileData.positionsOfResponsibility.map(pos => `
      <div class="item-block">
        <div class="row">
          <span class="bold-text">${pos.role}</span>
          <span class="bold-text">${pos.duration}</span>
        </div>
        <div class="row">
          <span class="italic-text">${pos.organization}</span>
          <span class="italic-text">${pos.location}</span>
        </div>
        <p style="margin-top: 1px; font-size: 9.5px; color: #333333; line-height: 1.3;">
          ${pos.description}
        </p>
      </div>
    `).join("")}
  ` : ""}

  <!-- 7. Skills and Expertise (Grouped: Languages, Frameworks, Tools & Libraries) -->
  <div class="section-title">Skills & Expertise</div>
  <div class="skills-block">
    <div><span class="bold-text">Languages:</span> ${categorized.languages}</div>
    <div><span class="bold-text">Frameworks:</span> ${categorized.frameworks}</div>
    <div><span class="bold-text">Tools and Libraries:</span> ${categorized.tools}</div>
  </div>

  <!-- 8. Extra-Curricular Activities (Toggleable) -->
  ${config.showExtraCurriculars ? `
    <div class="section-title">Achievements & Extra-Curriculars</div>
    ${profileData.extraCurriculars.map(ach => `
      <div class="item-block" style="margin-bottom: 4px;">
        <div class="row">
          <span class="bold-text">${ach.title}</span>
          <span class="bold-text">${ach.duration}</span>
        </div>
        <div class="row">
          <span class="italic-text">${ach.detail}</span>
        </div>
        <p style="margin-top: 1px; font-size: 9.5px; color: #333333; line-height: 1.3;">
          ${ach.description}
        </p>
      </div>
    `).join("")}
  ` : ""}

  <!-- 9. Hobbies & Interests -->
  <div class="section-title">Hobbies & Interests</div>
  <p class="summary-text" style="margin-bottom: 0;">${hobbiesString}</p>

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
