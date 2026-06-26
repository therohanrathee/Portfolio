import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";

export default async function Home() {
  // Fetch pinned repositories dynamically by scraping the public profile overview page
  let pinnedRepos: string[] = [];
  try {
    const profileRes = await fetch('https://github.com/therohanrathee', {
      next: { revalidate: 60 } // Revalidate every minute
    });
    if (profileRes.ok) {
      const html = await profileRes.text();
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

  // Fetch all repositories from GitHub API
  const res = await fetch('https://api.github.com/users/therohanrathee/repos?sort=updated&per_page=100', {
    next: { revalidate: 60 } // Revalidate every minute
  });
  
  let githubProjects = [];
  if (res.ok) {
    const repos = await res.json();
    // Filter out forks if desired, or keep all as in the previous logic
    githubProjects = repos.map((repo: any) => ({
      title: repo.name,
      description: repo.description || "",
      tech: [
        ...(repo.language ? [repo.language] : []),
        ...(repo.topics || [])
      ],
      github: repo.html_url,
      link: repo.homepage || undefined
    }));
  }

  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Projects fetchedProjects={githubProjects} pinnedRepos={pinnedRepos} />
      <Contact />
    </>
  );
}

