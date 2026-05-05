"use client";

import { motion, Variants } from "framer-motion";
import styles from "./Hero.module.css";
import Link from "next/link";

export default function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className={styles.hero} id="home">
      <div className={styles.backgroundShapes}>
        <motion.div 
          className={styles.shape1}
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className={styles.shape2}
          animate={{ 
            x: [0, -40, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className={`container ${styles.content}`}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className={styles.roles}>
            <span className={styles.roleBadge}>Graphic Designer</span>
            <span className={styles.roleBadge}>Social Media Manager</span>
            <span className={styles.roleBadge}>Engineering Student</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className={styles.title}>
            Hi, I'm Rohan. <br />
            I build <span className="text-gradient">digital experiences</span>.
          </motion.h1>

          <motion.p variants={itemVariants} className={styles.subtitle}>
            A tech-savvy creative blending strong technical foundations with expertise in multimedia production and modern web development.
          </motion.p>

          <motion.div variants={itemVariants} className={styles.ctaContainer}>
            <Link href="#projects">
              <button className={styles.primaryBtn}>View Projects</button>
            </Link>
            <Link href="#contact">
              <button className={styles.secondaryBtn}>Contact Me</button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
