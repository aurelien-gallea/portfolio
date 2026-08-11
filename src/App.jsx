import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PortfolioApp from './PortfolioApp';
import CinetechApp from './cinetech/App';
import PkmnApp from './pkmnfinder/App';
import SurvivalGameApp from './survival-game/App';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/*" element={<PortfolioApp />} />
        <Route path="/cinetech-react/*" element={<CinetechApp />} />
        <Route path="/pkmnfinder/*" element={<PkmnApp />} />
        <Route path="/survival-game/*" element={<SurvivalGameApp />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
