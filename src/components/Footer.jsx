import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '2rem 0',
      borderTop: '1px solid var(--glass-border)',
      color: 'var(--text-secondary)'
    }}>
      <div className="container">
        <span>{new Date().getFullYear()} © Aurelien Gallea</span>
      </div>
    </footer>
  );
};
export default Footer;
