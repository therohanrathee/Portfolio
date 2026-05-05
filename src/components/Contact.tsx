"use client";

import { motion, Variants } from "framer-motion";
import styles from "./Contact.module.css";
import { ArrowRight } from "lucide-react";
import { FaGithub, FaLinkedin, FaInstagram, FaTwitter } from "react-icons/fa";

export default function Contact() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <section className={styles.contactSection} id="contact">
      <div className={styles.contactBackground} />
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className={styles.title}>
            Let's build<br/>something <span className="text-gradient">great.</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className={styles.subtitle}>
            Have an exciting project in mind? Let's connect and discuss how we can bring your ideas to life.
          </motion.p>

          <motion.div variants={itemVariants}>
            <a href="mailto:rohanrathee@icloud.com" className={styles.emailButton}>
              Say Hello
              <ArrowRight className={styles.emailIcon} size={24} />
            </a>
          </motion.div>

          {/* Footer & Socials combined in minimalist luxury style */}
          <motion.div variants={itemVariants} className={styles.footer}>
            <div className={styles.socials}>
              <a href="https://github.com/therohanrathee" target="_blank" rel="noreferrer" className={styles.socialIcon}>
                <FaGithub size={26} />
              </a>
              <a href="https://www.linkedin.com/in/rohanrathee/" target="_blank" rel="noreferrer" className={styles.socialIcon}>
                <FaLinkedin size={26} />
              </a>
              <a href="https://twitter.com/therohanrathee" target="_blank" rel="noreferrer" className={styles.socialIcon}>
                <FaTwitter size={26} />
              </a>
              <a href="https://instagram.com/therohanrathee" target="_blank" rel="noreferrer" className={styles.socialIcon}>
                <FaInstagram size={26} />
              </a>
            </div>
            
            <div className={styles.copyright}>
              © {new Date().getFullYear()} Rohan Rathee
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

