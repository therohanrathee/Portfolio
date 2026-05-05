"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import styles from "./Navbar.module.css";
import { motion } from "framer-motion";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}
    >
      <div className={`container ${styles.navContainer}`}>
        <Link href="/" className={styles.logo}>
          Rohan<span className="text-gradient">Rathee</span>
        </Link>

        <div className={styles.navLinks}>
          <Link href="#about" className={styles.navLink}>About</Link>
          <Link href="#skills" className={styles.navLink}>Skills</Link>
          <Link href="#projects" className={styles.navLink}>Projects</Link>
          <Link href="#contact" className={styles.navLink}>Contact</Link>
          
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={styles.themeToggle}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
