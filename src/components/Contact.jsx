import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Linkedin } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const email = 'aurelien.gallea@gmail.com';

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <motion.div 
          className="contact-card glass"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >

          <div className="contact-actions">
            <a 
              href={`mailto:${email}?subject=Prise%20de%20contact`} 
              className="btn-primary-glow"
            >
              <Mail size={20} />
              <span>Envoyer un e-mail</span>
            </a>
            
            <a 
              href="https://linkedin.com/in/aurelien-gallea" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-linkedin"
            >
              <Linkedin size={20} />
              <span>LinkedIn</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
