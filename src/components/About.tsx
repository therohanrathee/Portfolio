"use client";

import { motion } from "framer-motion";
import styles from "./About.module.css";
import { User, GraduationCap, BarChart } from "lucide-react";

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className={styles.aboutSection} id="about">
      <div className={styles.aboutBackground} />
      <div className="container">
        
        <div className={styles.header}>
          <motion.h2 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            About <span className="text-gradient">Me</span>
          </motion.h2>
        </div>

        <motion.div 
          className={styles.bentoGrid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Main Bio Card */}
          <motion.div 
            variants={cardVariants} 
            whileHover={{ y: -2 }}
            className={`glass-panel ${styles.bentoCard} ${styles.mainBio}`}
          >
            <h3 className={styles.cardTitle}>
              <User className={styles.cardIcon} size={24} /> Who I Am
            </h3>
            <p className={styles.description}>
              I am a passionate <strong>Graphic Designer</strong>, <strong>Social Media Manager</strong>, and <strong>Computer Science Engineering Student</strong>. I have over 3 years of expertise working closely with clients to solve problems and achieve accelerating results.
            </p>
            <p className={styles.description}>
              As a tech-savvy creative, I combine strong technical foundations in coding with an expert eye for design and multimedia production. I strongly believe that passion brings possibilities to life, and I am a visual thinker dedicated to delivering innovative projects that look just as good as they perform.
            </p>
          </motion.div>

          {/* Education Card */}
          <motion.div 
            variants={cardVariants} 
            whileHover={{ y: -2 }}
            className={`glass-panel ${styles.bentoCard} ${styles.educationCard}`}
          >
            <h3 className={styles.cardTitle}>
              <GraduationCap className={styles.cardIcon} size={24} /> Education
            </h3>
            <div className={styles.eduDegree}>B.Tech Computer Science</div>
            <div className={styles.eduUni}>K.R. Mangalam University</div>
            <div className={styles.eduYear}>2024 - 2028</div>
          </motion.div>

          {/* Stats Card */}
          <motion.div 
            variants={cardVariants} 
            whileHover={{ y: -2 }}
            className={`glass-panel ${styles.bentoCard} ${styles.statsCard}`}
          >
            <div className={styles.statItem}>
              <span className={styles.statNumber}>3+</span>
              <span className={styles.statLabel}>Years<br/>Exp</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>20+</span>
              <span className={styles.statLabel}>Completed<br/>Projects</span>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
