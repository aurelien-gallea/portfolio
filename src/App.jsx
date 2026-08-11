import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PortfolioApp from './PortfolioApp';
import CinetechApp from './cinetech/App';
import PkmnApp from './pkmnfinder/App';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/*" element={<PortfolioApp />} />
        <Route path="/cinetech-react/*" element={<CinetechApp />} />
        <Route path="/pkmnfinder/*" element={<PkmnApp />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
