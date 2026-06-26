"use client";

import { motion, Variants } from "framer-motion";
import styles from "./Projects.module.css";
import { Folder, ExternalLink } from "lucide-react";
import { FaGithub } from "react-icons/fa";

type Project = {
  title: string;
  description: string;
  tech: string[];
  github: string;
  link?: string;
  isPinned?: boolean;
};

export default function Projects({ 
  fetchedProjects,
  pinnedRepos
}: { 
  fetchedProjects?: Project[];
  pinnedRepos?: string[];
}) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  const githubRepos = fetchedProjects && fetchedProjects.length > 0 ? fetchedProjects : [];

  // Pinned repositories normalized for matching
  const pinnedList = (pinnedRepos || []).map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Map, normalize, and format repositories dynamically
  const processedProjects = githubRepos.map((repo) => {
    const key = repo.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isPinned = pinnedList.includes(key);

    return {
      ...repo,
      title: repo.title.replace(/-/g, ' '), // Replace dashes with spaces for better layout
      description: repo.description || "",
      tech: repo.tech,
      isPinned
    };
  });

  // Sort: pinned first, then others
  const sortedProjects = [...processedProjects].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <section className={styles.projectsSection} id="projects">
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Some Things I've <span className="text-gradient">Built</span></h2>
          <p className={styles.subtitle}>Swipe or scroll horizontally to explore all my highlighted work and open-source GitHub repositories.</p>
        </div>

        <div className={styles.scrollWrapper}>
          <motion.div 
            className={styles.scrollContainer}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {sortedProjects.map((project, index) => (
              <motion.div 
                key={index} 
                variants={cardVariants} 
                whileHover={{ y: -6 }}
                className={`glass-panel ${styles.card}`}
              >
                <div className={styles.cardHeader}>
                  <Folder size={40} className={styles.folderIcon} />
                  <div className={styles.links}>
                    <a href={project.github} target="_blank" rel="noreferrer" className={styles.linkIcon} aria-label="GitHub Repository">
                      <FaGithub size={22} />
                    </a>
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noreferrer" className={styles.linkIcon} aria-label="Live Demo">
                        <ExternalLink size={22} />
                      </a>
                    )}
                  </div>
                </div>
                
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.projectDescription}>{project.description}</p>
                
                <div className={styles.techStack}>
                  {project.tech.map((tech, i) => (
                    <span key={i} className={styles.techItem}>{tech}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
