import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header glass">
      <div className="container header-content">
        <span className="logo">Aurélien Gallea</span>
        <nav>
          <ul>
            <li><a href="#">Accueil</a></li>
            <li><a href="mailto:aurelien.gallea@gmail.com?subject=demande de renseignements">Contactez-moi</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
export default Header;
