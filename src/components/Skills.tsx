"use client";

import { motion } from "framer-motion";
import styles from "./Skills.module.css";
import { 
  Code2, Video, MessageSquareHeart, MonitorPlay, Palette, 
  Terminal, Smartphone, Layout, Search, Database, 
  Users, Shield, ShieldCheck, MessageSquare, Brain, Sparkles 
} from "lucide-react";
import { useEffect, useState } from "react";
import { profileData } from "@/data/profile";

const iconMap: Record<string, React.ReactNode> = {
  "Next.js": <Layout size={20} />,
  "React": <Code2 size={20} />,
  "TypeScript": <Terminal size={20} />,
  "Swift (iOS)": <Smartphone size={20} />,
  "PostgreSQL": <Database size={20} />,
  "Python": <Terminal size={20} />,
  "C++": <Code2 size={20} />,
  "Final Cut Pro": <Video size={20} />,
  "Adobe Photoshop": <Palette size={20} />,
  "Canva": <Palette size={20} />,
  "Unreal Engine": <MonitorPlay size={20} />,
  "Video Editing": <Video size={20} />,
  "SEO": <Search size={20} />,
  "Leadership": <MessageSquareHeart size={20} />,
  "Management": <MessageSquareHeart size={20} />,
  "Teamwork": <Users size={20} />,
  "Courage": <Shield size={20} />,
  "Sense of Responsibility": <ShieldCheck size={20} />,
  "Effective Communication": <MessageSquare size={20} />,
  "Critical Thinking": <Brain size={20} />,
  "Self Confidence": <Sparkles size={20} />
};

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
            {profileData.skills.map((skill, index) => {
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
                    <span className={styles.icon}>{iconMap[skill.name] || <Code2 size={20} />}</span>
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
