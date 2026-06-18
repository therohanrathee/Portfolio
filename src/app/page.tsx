import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";

export default async function Home() {
  // Fetch repos from GitHub
  const res = await fetch('https://api.github.com/users/therohanrathee/repos?sort=updated&per_page=6', {
    next: { revalidate: 3600 } // Revalidate every hour
  });
  
  let githubProjects = [];
  if (res.ok) {
    const repos = await res.json();
    githubProjects = repos.map((repo: any) => ({
      title: repo.name.replace(/-/g, ' '),
      description: repo.description || `A ${repo.language || 'software'} project.`,
      tech: repo.language ? [repo.language] : [],
      github: repo.html_url,
      link: repo.homepage || undefined
    }));
  }

  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Projects fetchedProjects={githubProjects} />
      <Contact />
    </>
  );
}

