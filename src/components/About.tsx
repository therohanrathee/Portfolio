"use client";

import { motion } from "framer-motion";
import styles from "./About.module.css";
import { User, GraduationCap, Languages, MapPin } from "lucide-react";
import { profileData } from "@/data/profile";

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
            {profileData.bio.map((paragraph, index) => (
              <p 
                key={index} 
                className={styles.description}
                dangerouslySetInnerHTML={{ __html: paragraph.replace(/Graphic Designer|Social Media Manager|Computer Science Engineering Student|Next\.js|React|TypeScript|Swift \(iOS\)|Tech Titan 1\.0|Tech Fusion 3\.0|AIR 739|1 AFSB, Dehradun|NDA-154/gi, '<strong>$&</strong>') }}
              />
            ))}
            
            {/* Embedded Stats */}
            <div className={styles.embeddedStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{profileData.stats.yearsExp}</span>
                <span className={styles.statLabel}>Years Exp</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{profileData.stats.projectsCompleted}</span>
                <span className={styles.statLabel}>Projects Completed</span>
              </div>
            </div>
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
            <div className={styles.timeline}>
              {profileData.education.map((edu, index) => (
                <div key={index} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineYear}>{edu.year}</div>
                  <div className={styles.timelineTitle}>{edu.title}</div>
                  <div className={styles.timelineSubtitle}>{edu.school}</div>
                  <div className={styles.timelineDetail}>{edu.detail}</div>
                </div>
              ))}
            </div>
          </motion.div>


          {/* Languages & Details Card */}
          <motion.div 
            variants={cardVariants} 
            whileHover={{ y: -2 }}
            className={`glass-panel ${styles.bentoCard} ${styles.personalCard}`}
          >
            <h3 className={styles.cardTitle}>
              <Languages className={styles.cardIcon} size={24} /> Personal Details
            </h3>
            <div className={styles.personalGrid}>
              <div className={styles.personalItem}>
                <Languages className={styles.personalIcon} size={18} />
                <div className={styles.personalText}>
                  <span className={styles.personalLabel}>Languages</span>
                  <span className={styles.personalValue}>{profileData.personal.languages}</span>
                </div>
              </div>
              <div className={styles.personalItem}>
                <MapPin className={styles.personalIcon} size={18} />
                <div className={styles.personalText}>
                  <span className={styles.personalLabel}>Location</span>
                  <span className={styles.personalValue}>{profileData.personal.location}</span>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
