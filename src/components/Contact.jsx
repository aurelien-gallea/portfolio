import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Copy, Check, Github, Linkedin, Send } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const [copied, setCopied] = useState(false);
  const email = 'aurelien.gallea@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <motion.div 
          className="contact-card glass"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Availability Badge */}
          <div className="status-badge">
            <span className="status-dot"></span>
            <span>Disponible pour de nouveaux projets</span>
          </div>

          <h2 className="contact-title">Discutons de votre projet</h2>
          <p className="contact-description">
            Vous avez une idée, une opportunité ou souhaitez simplement échanger ? 
            Mon mail vous est ouvert, je vous répondrai dans les plus brefs délais !
          </p>

          {/* Primary Action Button */}
          <div className="main-action">
            <a 
              href={`mailto:${email}?subject=Prise%20de%20contact`} 
              className="btn-primary-glow"
            >
              <Send size={20} />
              <span>Envoyer un e-mail</span>
            </a>
          </div>

          {/* Quick Info & Social Cards */}
          <div className="contact-grid">
            {/* Direct Email Copy Card */}
            <div className="contact-item">
              <div className="item-icon">
                <Mail size={22} />
              </div>
              <div className="item-info">
                <span className="item-label">E-mail direct</span>
                <span className="item-value">{email}</span>
              </div>
              <button 
                onClick={handleCopyEmail} 
                className={`copy-btn ${copied ? 'copied' : ''}`}
                title="Copier l'adresse e-mail"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            {/* Social Links */}
            <div className="social-links-grid">
              <a 
                href="https://github.com/aurelien-gallea" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-card"
              >
                <Github size={20} />
                <span>GitHub</span>
              </a>
              <a 
                href="https://linkedin.com/in/aurelien-gallea" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-card"
              >
                <Linkedin size={20} />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
