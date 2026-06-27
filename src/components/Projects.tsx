"use client";

import { useRef } from "react";
import { 
  motion, 
  useScroll, 
  useSpring, 
  useTransform, 
  useVelocity, 
  useAnimationFrame, 
  useMotionValue 
} from "framer-motion";
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

// Modulo wrap helper for infinite looping
const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export default function Projects({ 
  fetchedProjects,
  pinnedRepos
}: { 
  fetchedProjects?: Project[];
  pinnedRepos?: string[];
}) {
  const githubRepos = fetchedProjects && fetchedProjects.length > 0 ? fetchedProjects : [];
  const pinnedList = (pinnedRepos || []).map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const processedProjects = githubRepos.map((repo) => {
    const key = repo.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isPinned = pinnedList.includes(key);
    return {
      ...repo,
      title: repo.title.replace(/-/g, ' '),
      description: repo.description || "",
      tech: repo.tech,
      isPinned
    };
  });

  const sortedProjects = [...processedProjects].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // Framer Motion Velocity Scroll setup
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });
  
  // Transform scroll velocity into horizontal scroll speed factor
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 1.5], {
    clamp: true
  });

  // Constant base speed (negative to scroll leftwards)
  const baseVelocity = -0.05;

  useAnimationFrame((time, delta) => {
    // Limit delta step to prevent jumps on tab refocus
    const maxDelta = 30;
    const adjustedDelta = Math.min(delta, maxDelta);
    
    // Standard slow movement speed
    let moveBy = baseVelocity * (adjustedDelta / 10);
    
    // Add extra movement matching the webpage scroll speed and direction
    const vFactor = velocityFactor.get();
    if (vFactor !== 0) {
      moveBy += vFactor * baseVelocity * 0.5;
    }

    baseX.set(baseX.get() + moveBy);
  });

  // Wrap translation from -25% to 0% because we repeat the cards array 4 times
  // This makes the transition completely seamless
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);

  // We repeat the sorted projects array 4 times to ensure it loops infinitely
  const repeatedProjects = [
    ...sortedProjects,
    ...sortedProjects,
    ...sortedProjects,
    ...sortedProjects
  ];

  return (
    <section className={styles.projectsSection} id="projects">
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Some Things I've <span className="text-gradient">Built</span></h2>
          <p className={styles.subtitle}>My projects scroll automatically. Scroll the page vertically to control the velocity of the track.</p>
        </div>
      </div>

      <div className={styles.scrollWrapper}>
        <motion.div className={styles.scrollContainer} style={{ x }}>
          {repeatedProjects.map((project, index) => (
            <motion.div 
              key={index} 
              whileHover={{ y: -8, scale: 1.02 }}
              className={`glass-panel ${styles.card}`}
            >
              <div className={styles.cardHeader}>
                <Folder size={36} className={styles.folderIcon} />
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
              
              <h3 className={styles.projectTitle}>
                {project.title}
                {project.isPinned && <span className={styles.featuredBadge}>Pinned</span>}
              </h3>
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
    </section>
  );
}
