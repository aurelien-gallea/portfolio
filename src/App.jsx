import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import PortfolioApp from './PortfolioApp';
import CinetechApp from './cinetech/App';
import PkmnApp from './pkmnfinder/App';
import SurvivalGameApp from './survival-game/App';
import BudgetApp from './budget/App';
import AutoApp from './auto/App';

// Page non référencée : chargée seulement quand on ouvre son adresse
const ScalperApp = lazy(() => import('./scalper/App'));

function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/*" element={<PortfolioApp />} />
        <Route path="/cinetech-react/*" element={<CinetechApp />} />
        <Route path="/pkmnfinder/*" element={<PkmnApp />} />
        <Route path="/survival-game/*" element={<SurvivalGameApp />} />
        <Route path="/budget/*" element={<BudgetApp />} />
        <Route path="/thermique-vs-electrique/*" element={<AutoApp />} />
        <Route path="/sn-8c3f3dd6be/*" element={<Suspense fallback={null}><ScalperApp /></Suspense>} />
      </Routes>
    </HashRouter>
  );
}

export default App;
