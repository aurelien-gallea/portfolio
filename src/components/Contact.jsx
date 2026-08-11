import React from 'react';
import { motion } from 'framer-motion';
import { Mail, FileText } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <motion.div 
          className="contact-content glass"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Contact</h2>
          <h3>Alors on travaille ensemble ?</h3>
          
          <div className="contact-links">
            <a href="/aurelien-gallea.pdf" target="_blank" className="btn btn-outline">
              <FileText size={20} />
              Voir mon CV
            </a>
            <a href="mailto:aurelien.gallea@gmail.com?subject=prise de contact" className="btn btn-primary">
              <Mail size={20} />
              Envoyer un email
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
export default Contact;
