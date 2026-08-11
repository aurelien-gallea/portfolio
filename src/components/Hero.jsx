import React from 'react';
import { motion } from 'framer-motion';
import './Hero.css';

const Hero = () => {
  return (
    <section id="bienvenue" className="hero">
      <div className="container hero-content">
        <motion.div 
          className="hero-text"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>Software Product Engineer</h1>
          <p>
            Spécialisé en <strong>Angular</strong>, <strong>React</strong>, <strong>ASP.NET</strong> et <strong>Développement IA</strong>.<br/>
            À l'aise avec divers modèles (<strong>ChatGPT</strong>, <strong>Claude</strong>, <strong>Gemini</strong>, <strong>Mistral</strong>) et passionné par les <strong>automatisations (Workflows & Agents IA)</strong>.
          </p>
        </motion.div>
        
        <motion.div 
          className="hero-image"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="avatar-wrapper">
            <img src="./image/moi.png" alt="Aurélien Gallea" className="avatar" />
            <div className="avatar-glow"></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
export default Hero;
