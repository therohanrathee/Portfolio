"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import styles from "./LeadershipAndActivities.module.css";
import { 
  ShieldAlert, 
  Code2, 
  Crown, 
  Activity, 
  Target, 
  Camera, 
  Compass, 
  Users, 
  MapPin,
  Trophy,
  Cpu,
  Tv,
  Sparkles,
  Zap
} from "lucide-react";
import { profileData } from "@/data/profile";

// Map hobby icons to Lucide components
const hobbyIconMap: Record<string, React.ReactNode> = {
  Code: <Code2 className={styles.hobbyIcon} size={20} />,
  Crown: <Crown className={styles.hobbyIcon} size={20} />,
  Activity: <Activity className={styles.hobbyIcon} size={20} />,
  Target: <Target className={styles.hobbyIcon} size={20} />,
  Camera: <Camera className={styles.hobbyIcon} size={20} />,
  Compass: <Compass className={styles.hobbyIcon} size={20} />
};

// Map activity icons to Lucide components
const getActivityIcon = (title: string, relevance: string[]) => {
  const t = title.toLowerCase();
  if (relevance.includes("computer-vision") || relevance.includes("ai")) {
    return <Cpu size={22} />;
  }
  if (t.includes("cryptic") || relevance.includes("cybersecurity")) {
    return <Zap size={22} />;
  }
  if (t.includes("chess")) {
    return <Crown size={22} />;
  }
  if (t.includes("basketball") || t.includes("handball")) {
    return <Activity size={22} />;
  }
  if (t.includes("pool") || t.includes("billiards")) {
    return <Target size={22} />;
  }
  return <Trophy size={22} />;
};

export default function LeadershipAndActivities() {
  const [activeTab, setActiveTab] = useState<"relevant" | "sports" | "all">("relevant");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  // Filter activities based on selected tab
  const filteredActivities = profileData.extraCurriculars.filter((item) => {
    if (activeTab === "relevant") {
      return item.isHighlighted;
    }
    if (activeTab === "sports") {
      return item.relevance.includes("sports");
    }
    return true; // "all"
  });

  return (
    <section className={styles.section} id="activities">
      <div className={styles.backgroundGlow} />
      <div className={styles.backgroundGlowLeft} />

      <div className="container">
        {/* Main Section Header */}
        <div className={styles.header}>
          <motion.h2 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Leadership & <span className="text-gradient">Activities</span>
          </motion.h2>
          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
          >
            A compilation of leadership responsibilities, extracurricular milestones, and creative interests.
          </motion.p>
        </div>

        {/* 1. Positions of Responsibility */}
        <div className={styles.subSection}>
          <div className={styles.subSectionHeader}>
            <h3 className={styles.subSectionTitle}>
              <Users className={styles.subSectionIcon} size={24} /> Leadership & Responsibility
            </h3>
          </div>

          <motion.div 
            className={styles.responsibilityGrid}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {profileData.positionsOfResponsibility.map((item, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -4, scale: 1.005 }}
                className={`glass-panel ${styles.respCard}`}
              >
                <div className={styles.respCardHeader}>
                  <div className={styles.respTitleGroup}>
                    <h4 className={styles.respRole}>{item.role}</h4>
                    <span className={styles.respOrg}>{item.organization}</span>
                  </div>
                  <span className={styles.respDuration}>{item.duration}</span>
                </div>

                <div className={styles.respMeta}>
                  <MapPin size={14} className={styles.subSectionIcon} />
                  <span>{item.location}</span>
                </div>

                <p className={styles.respDesc}>{item.description}</p>

                <div className={styles.respTags}>
                  {item.relevance.map((tag, tagIndex) => (
                    <span key={tagIndex} className={styles.tag}>{tag}</span>
                  ))}
                </div>

                <div className={styles.cardFooterGlow} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* 2. Extra-Curriculars & Competitions */}
        <div className={styles.subSection}>
          <div className={styles.subSectionHeader}>
            <h3 className={styles.subSectionTitle}>
              <Trophy className={styles.subSectionIcon} size={24} /> Competitions & Extracurriculars
            </h3>

            {/* Filter Tabs */}
            <div className={styles.tabs}>
              {activeTab === "relevant" && (
                <motion.div layoutId="activeTabBg" className={styles.activeBackground} />
              )}
              <button 
                className={`${styles.tab} ${activeTab === "relevant" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("relevant")}
              >
                Featured (Tech & Strategy)
              </button>

              <button 
                className={`${styles.tab} ${activeTab === "sports" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("sports")}
              >
                {activeTab === "sports" && (
                  <motion.div layoutId="activeTabBg" className={styles.activeBackground} />
                )}
                Sports & Athletics
              </button>

              <button 
                className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("all")}
              >
                {activeTab === "all" && (
                  <motion.div layoutId="activeTabBg" className={styles.activeBackground} />
                )}
                Show All
              </button>
            </div>
          </div>

          <motion.div 
            layout
            className={styles.activityGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <AnimatePresence mode="popLayout">
              {filteredActivities.map((item, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  key={item.title}
                  whileHover={{ y: -4 }}
                  className={`glass-panel ${styles.activityCard}`}
                >
                  <div className={styles.activityHeader}>
                    <div className={styles.activityIconContainer}>
                      {getActivityIcon(item.title, item.relevance)}
                    </div>
                    <span className={styles.activityDuration}>{item.duration}</span>
                  </div>

                  <h4 className={styles.activityTitle}>{item.title}</h4>
                  <div className={styles.activityDetail}>{item.detail}</div>
                  <p className={styles.activityDesc}>{item.description}</p>

                  <div className={styles.cardFooterGlow} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* 3. Hobbies & Interests */}
        <div className={styles.subSection}>
          <div className={styles.subSectionHeader} style={{ justifyContent: "center", marginBottom: "2rem" }}>
            <h3 className={styles.subSectionTitle}>
              <Sparkles className={styles.subSectionIcon} size={24} /> Hobbies & Interests
            </h3>
          </div>

          <motion.div 
            className={styles.hobbyFlex}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {profileData.hobbies.map((hobby, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className={`glass-panel ${styles.hobbyCard}`}
              >
                {hobbyIconMap[hobby.icon] || <Code2 size={20} />}
                <span className={styles.hobbyName}>{hobby.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
