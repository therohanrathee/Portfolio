"use client";

import { useRef, useEffect, useState } from "react";
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

// Modulo wrap helper for infinite looping in pixels
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

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isDown = useRef(false);
  const startX = useRef(0);
  
  // Track one loop width for modulo calculations (measured dynamically)
  const [loopWidth, setLoopWidth] = useState(0);

  const wheelTimeout = useRef<NodeJS.Timeout | null>(null);

  // Dynamic base speed in pixels per millisecond (negative to crawl left, positive to crawl right)
  const currentBaseVelocity = useRef(-0.025);

  useEffect(() => {
    if (containerRef.current) {
      setLoopWidth(containerRef.current.scrollWidth / 4);
    }

    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Trackpad horizontal scroll detection
      if (Math.abs(e.deltaX) > 0) {
        // Prevent default browser swipe-back/forward history gestures
        e.preventDefault();
        
        isDragging.current = true;
        baseX.set(baseX.get() - e.deltaX * 0.85);

        // Update auto-scroll direction based on drag direction
        if (e.deltaX > 0) {
          currentBaseVelocity.current = -0.025; // scroll left
        } else {
          currentBaseVelocity.current = 0.025;  // scroll right
        }

        if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
        wheelTimeout.current = setTimeout(() => {
          isDragging.current = false;
        }, 100);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
    };
  }, [sortedProjects, loopWidth]);

  // Framer Motion Velocity Scroll setup
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });

  // Velocity and momentum tracking refs
  const currentSpeed = useRef(0);
  const lastX = useRef(0);

  useAnimationFrame((time, delta) => {
    // Limit delta step to prevent jumps on tab refocus
    const maxDelta = 30;
    const adjustedDelta = Math.min(delta, maxDelta);
    const currentX = baseX.get();

    if (isDragging.current) {
      // Calculate drag/scroll speed in the current frame
      const deltaX = currentX - lastX.current;
      const maxDragSpeed = 25; // clamp to reasonable max speed
      currentSpeed.current = Math.max(-maxDragSpeed, Math.min(maxDragSpeed, deltaX));
    } else {
      // Auto-scroll speed (uses current base velocity direction)
      let targetSpeed = currentBaseVelocity.current * adjustedDelta;
      
      // Add extra movement matching the webpage scroll speed and direction
      // scrollVelocity is positive when scrolling down (move left), negative when scrolling up (move right)
      const currentVelocity = smoothVelocity.get();
      if (currentVelocity !== 0) {
        const scrollContribution = -currentVelocity * 0.0015;
        
        // Update persistent auto-scroll direction if vertical page scroll is substantial
        if (Math.abs(currentVelocity) > 50) {
          if (scrollContribution > 0) {
            currentBaseVelocity.current = 0.025;  // crawl right
          } else if (scrollContribution < 0) {
            currentBaseVelocity.current = -0.025; // crawl left
          }
        }

        targetSpeed += scrollContribution * (adjustedDelta / 16.67);
      }

      // Smoothly decay/blend currentSpeed towards the targetSpeed (deceleration effect)
      currentSpeed.current = currentSpeed.current * 0.94 + targetSpeed * 0.06;

      // Translate the marquee track
      baseX.set(currentX + currentSpeed.current);
    }

    lastX.current = baseX.get();
  });

  // Wrap translation from -loopWidth to 0px
  const x = useTransform(baseX, (v) => {
    if (loopWidth === 0) return "0px";
    return `${wrap(-loopWidth, 0, v)}px`;
  });

  // Custom Mouse/Touch Drag Handlers
  const dragDistance = useRef(0);

  const handleLinkClick = (e: React.MouseEvent) => {
    // If the user dragged more than 10px, prevent navigating
    if (dragDistance.current > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Allow natural link clicks (dont preventDefault) but block text selection ghosting on other card areas
    if (target.closest("a")) {
      isDown.current = true;
      isDragging.current = true;
      startX.current = e.pageX;
      dragDistance.current = 0;
      return;
    }
    
    e.preventDefault();
    isDown.current = true;
    isDragging.current = true;
    startX.current = e.pageX;
    dragDistance.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current) return;
    e.preventDefault();
    const walk = e.pageX - startX.current;
    startX.current = e.pageX;
    dragDistance.current += Math.abs(walk);

    // Update auto-scroll direction based on mouse drag direction
    if (walk > 0) {
      currentBaseVelocity.current = 0.025;  // scroll right
    } else if (walk < 0) {
      currentBaseVelocity.current = -0.025; // scroll left
    }

    baseX.set(baseX.get() + walk);
  };

  const handleMouseUpOrLeave = () => {
    isDown.current = false;
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDown.current = true;
    isDragging.current = true;
    startX.current = e.touches[0].pageX;
    dragDistance.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDown.current) return;
    const walk = e.touches[0].pageX - startX.current;
    startX.current = e.touches[0].pageX;
    dragDistance.current += Math.abs(walk);

    // Update auto-scroll direction based on touch drag direction
    if (walk > 0) {
      currentBaseVelocity.current = 0.025;  // scroll right
    } else if (walk < 0) {
      currentBaseVelocity.current = -0.025; // scroll left
    }

    baseX.set(baseX.get() + walk);
  };

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
          <p className={styles.subtitle}>Drag horizontally to explore, or scroll the page vertically to shift the marquee velocity and direction.</p>
        </div>
      </div>

      <div className={styles.scrollWrapper}>
        <motion.div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUpOrLeave}
          className={styles.scrollContainer} 
          style={{ x }}
        >
          {repeatedProjects.map((project, index) => (
            <div 
              key={index} 
              className={`glass-panel ${styles.card}`}
            >
              <div className={styles.cardHeader}>
                <Folder size={36} className={styles.folderIcon} />
                <div className={styles.links}>
                  <a 
                    onClick={handleLinkClick}
                    href={project.github} 
                    target="_blank" 
                    rel="noreferrer" 
                    className={styles.linkIcon} 
                    aria-label="GitHub Repository"
                  >
                    <FaGithub size={22} />
                  </a>
                  {project.link && (
                    <a 
                      onClick={handleLinkClick}
                      href={project.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={styles.linkIcon} 
                      aria-label="Live Demo"
                    >
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
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
