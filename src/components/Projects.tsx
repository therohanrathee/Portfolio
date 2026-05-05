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
};

export default function Projects({ fetchedProjects }: { fetchedProjects?: Project[] }) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const displayProjects = fetchedProjects && fetchedProjects.length > 0 ? fetchedProjects : [];

  return (
    <section className={styles.projectsSection} id="projects">
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Some Things I've <span className="text-gradient">Built</span></h2>
          <p className={styles.subtitle}>A collection of my recent coding projects, automatically fetched from GitHub.</p>
        </div>

        {displayProjects.length > 0 ? (
          <motion.div 
            className={styles.grid}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {displayProjects.map((project, index) => (
              <motion.div key={index} variants={cardVariants} className={`glass-panel ${styles.card}`}>
                <div className={styles.cardHeader}>
                  <Folder size={40} className={styles.folderIcon} />
                  <div className={styles.links}>
                    <a href={project.github} target="_blank" rel="noreferrer" className={styles.linkIcon}>
                      <FaGithub size={22} />
                    </a>
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noreferrer" className={styles.linkIcon}>
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
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>Loading projects from GitHub...</p>
          </div>
        )}
      </div>
    </section>
  );
}
