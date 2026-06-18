"use client";

import { motion } from "framer-motion";
import styles from "./Skills.module.css";
import { Code2, Video, MessageSquareHeart, MonitorPlay, Palette, Terminal, Smartphone, Layout, Search } from "lucide-react";
import { useEffect, useState } from "react";

const allSkills = [
  { name: "Next.js", icon: <Layout size={20} /> },
  { name: "React", icon: <Code2 size={20} /> },
  { name: "TypeScript", icon: <Terminal size={20} /> },
  { name: "Swift (iOS)", icon: <Smartphone size={20} /> },
  { name: "Python", icon: <Terminal size={20} /> },
  { name: "C++", icon: <Code2 size={20} /> },
  { name: "Final Cut Pro", icon: <Video size={20} /> },
  { name: "Adobe Photoshop", icon: <Palette size={20} /> },
  { name: "Canva", icon: <Palette size={20} /> },
  { name: "Unreal Engine", icon: <MonitorPlay size={20} /> },
  { name: "Video Editing", icon: <Video size={20} /> },
  { name: "Leadership", icon: <MessageSquareHeart size={20} /> },
  { name: "Management", icon: <MessageSquareHeart size={20} /> },
  { name: "SEO", icon: <Search size={20} /> }
];

export default function Skills() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className={styles.skillsSection} id="skills">
      <div className="container">
        <div className={styles.header}>
          <motion.h2 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            My <span className="text-gradient">Skills</span>
          </motion.h2>
        </div>

        {mounted && (
          <div className={styles.bubbleContainer}>
            {allSkills.map((skill, index) => {
              // Generate random float animation parameters
              const randomDuration = Math.random() * 2 + 3; // 3 to 5 seconds
              const randomDelay = Math.random() * 2;

              return (
                <motion.div
                  key={index}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.1}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    opacity: { duration: 0.5, delay: index * 0.05 },
                    scale: { type: "spring", stiffness: 200, damping: 15, delay: index * 0.05 },
                  }}
                >
                  <div
                    className={styles.bubble}
                    style={{
                      animation: `float ${randomDuration}s ease-in-out ${randomDelay}s infinite`,
                    }}
                  >
                    <span className={styles.icon}>{skill.icon}</span>
                    {skill.name}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </section>
  );
}
