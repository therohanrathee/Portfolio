"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import styles from "./Contact.module.css";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { FaGithub, FaLinkedin, FaInstagram, FaTwitter } from "react-icons/fa";
import { profileData } from "@/data/profile";

export default function Contact() {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 480);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
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

          <motion.div 
            variants={itemVariants}
            className={styles.splitButtonWrapper}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Say Hello (Placeholder) */}
            <motion.div
              className={styles.sayHelloPlaceholder}
              animate={{
                opacity: isHovered ? 0 : 1,
                scale: isHovered ? 0.8 : 1,
                y: isHovered ? -10 : 0
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              onClick={() => setIsHovered(true)} // Support mobile click
            >
              Say Hello
              <ArrowRight className={styles.emailIcon} size={20} />
            </motion.div>

            {/* Email Button */}
            <motion.a
              href={`mailto:${profileData.contact.email}`}
              className={`${styles.splitButton} ${styles.emailBtn}`}
              animate={{
                x: isHovered ? (isMobile ? -75 : -110) : 0,
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.8
              }}
              style={{ pointerEvents: isHovered ? "auto" : "none" }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <Mail size={18} />
              Email Me
            </motion.a>

            {/* Call Button */}
            <motion.a
              href={`tel:${profileData.contact.phone.replace(/[^+\d]/g, '')}`}
              className={`${styles.splitButton} ${styles.phoneBtn}`}
              animate={{
                x: isHovered ? (isMobile ? 75 : 110) : 0,
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.8
              }}
              style={{ pointerEvents: isHovered ? "auto" : "none" }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <Phone size={18} />
              Call Me
            </motion.a>
          </motion.div>

          {/* Footer & Socials combined in minimalist luxury style */}
          <motion.div variants={itemVariants} className={styles.footer}>
            <div className={styles.socials}>
              <a href={profileData.contact.github} target="_blank" rel="noreferrer" className={styles.socialIcon}>
                <FaGithub size={26} />
              </a>
              <a href={profileData.contact.linkedin} target="_blank" rel="noreferrer" className={styles.socialIcon}>
                <FaLinkedin size={26} />
              </a>
              <a href={profileData.contact.twitter} target="_blank" rel="noreferrer" className={styles.socialIcon}>
                <FaTwitter size={26} />
              </a>
              <a href={profileData.contact.instagram} target="_blank" rel="noreferrer" className={styles.socialIcon}>
                <FaInstagram size={26} />
              </a>
            </div>
            
            <div className={styles.copyright}>
              © {new Date().getFullYear()} {profileData.name}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

