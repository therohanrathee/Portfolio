"use client";

import { motion } from "framer-motion";
import styles from "./Achievements.module.css";
import { Award, Trophy, Sparkles, MapPin } from "lucide-react";
import { profileData } from "@/data/profile";

export default function Achievements() {
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

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("ssb")) {
      return <Award className={styles.icon} size={28} />;
    }
    if (t.includes("co-ordinator") || t.includes("fusion")) {
      return <Trophy className={styles.icon} size={28} />;
    }
    return <Sparkles className={styles.icon} size={28} />;
  };

  return (
    <section className={styles.achievementsSection} id="achievements">
      <div className={styles.backgroundGlow} />
      <div className="container">
        <div className={styles.header}>
          <motion.h2 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Achievements & <span className="text-gradient">Certifications</span>
          </motion.h2>
          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
          >
            Milestones, leadership roles, and recognition received across academic and extracurricular activities.
          </motion.p>
        </div>

        <motion.div 
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {profileData.achievements.map((ach, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              className={`glass-panel ${styles.card}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.iconContainer}>
                  {getIcon(ach.title)}
                </div>
                <div className={styles.badge}>
                  {ach.subtitle}
                </div>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{ach.title}</h3>
                
                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <MapPin size={14} className={styles.metaIcon} />
                    <span>{ach.institution}</span>
                  </div>
                </div>

                <p className={styles.description}>
                  {ach.description}
                </p>
              </div>
              
              <div className={styles.cardFooterGlow} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
