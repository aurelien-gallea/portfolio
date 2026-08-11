import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw, Skull, Trophy, ShieldAlert, Zap, Volume2 } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import MobileControls from './components/MobileControls';

const SurvivalGameApp = () => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameover', 'victory'
  const [difficulty, setDifficulty] = useState('normal');
  const [stats, setStats] = useState({ kills: 0 });

  const [playerData, setPlayerData] = useState({
    hp: 100,
    maxHp: 100,
    activeWeaponIndex: 0,
    weapons: [
      { id: 'handgun', name: 'Pistolet 9mm', magAmmo: 12, reserveAmmo: 24 },
      { id: 'shotgun', name: 'Shotgun', magAmmo: 6, reserveAmmo: 12 },
      { id: 'knife', name: 'Couteau', magAmmo: 0, reserveAmmo: 0 }
    ]
  });

  // Mobile Triggers
  const [mobileMove, setMobileMove] = useState({ x: 0, y: 0 });
  const [mobileFireTrigger, setMobileFireTrigger] = useState(0);
  const [mobileReloadTrigger, setMobileReloadTrigger] = useState(0);
  const [mobileKnifeTrigger, setMobileKnifeTrigger] = useState(0);

  const handleStartGame = () => {
    setGameState('playing');
  };

  const handleGameOver = (gameStats) => {
    setStats(gameStats);
    setGameState('gameover');
  };

  const handleVictory = (gameStats) => {
    setStats(gameStats);
    setGameState('victory');
  };

  return (
    <div className="relative w-full h-screen bg-[#050508] text-white selection:bg-red-600 selection:text-white overflow-hidden font-sans">
      
      {/* MENU SCREEN */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between p-6 md:p-12 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/40 via-black to-black border-4 border-red-900/30">
          
          {/* Header Link */}
          <div className="flex justify-between items-center">
            <Link 
              to="/" 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 text-xs transition-all backdrop-blur-md"
            >
              <ArrowLeft size={16} /> Portfolio
            </Link>
            <div className="flex items-center gap-2 text-red-500 font-mono text-xs animate-pulse">
              <ShieldAlert size={16} /> ALERTE INFECTÉS
            </div>
          </div>

          {/* Hero Main Content */}
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 drop-shadow-[0_10px_20px_rgba(220,38,38,0.5)]">
              ZOMBIE RULES
            </h1>
            <p className="text-gray-400 text-sm md:text-lg max-w-xl mx-auto leading-relaxed">
              Infiltrer le manoir infesté. Gérer vos munitions avec précision, orientez votre lampe torche dans le noir et survivez à la horde.
            </p>

            {/* Difficulty Selector */}
            <div className="flex justify-center gap-3 py-2">
              {['easy', 'normal', 'hard'].map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    difficulty === d 
                      ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30 scale-105' 
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {d === 'easy' ? 'Recrue (Facile)' : d === 'normal' ? 'Survivant (Moyen)' : 'Cauchemar (Difficile)'}
                </button>
              ))}
            </div>

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              className="px-10 py-5 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-xl tracking-wider shadow-2xl shadow-red-600/40 hover:scale-105 transition-all flex items-center gap-3 mx-auto cursor-pointer"
            >
              <Play fill="currentColor" size={24} /> COMMENCER LA MISSION
            </button>
          </div>

          {/* Controls Quick Guide */}
          <div className="max-w-2xl mx-auto w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-white font-bold mb-1">🎮 Contrôles PC :</p>
              <p>• ZQSD / Flèches : Déplacement</p>
              <p>• Souris : Viser & Clic Tirer</p>
              <p>• 1 / 2 / 3 : Changer d'arme (Couteau, Pistolet, Pompe)</p>
              <p>• R : Recharger le chargeur</p>
            </div>
            <div>
              <p className="text-white font-bold mb-1">📱 Contrôles Smartphone :</p>
              <p>• Joystick virtuel gauche : Déplacement 360°</p>
              <p>• Bouton Rouge : Tirer / Attaquer</p>
              <p>• Boutons rapides : Couteau & Rechargement</p>
            </div>
          </div>
        </div>
      )}

      {/* PLAYING STATE */}
      {(gameState === 'playing' || gameState === 'gameover' || gameState === 'victory') && (
        <div className="relative w-full h-full">
          {/* Top Return Link */}
          <Link 
            to="/" 
            className="absolute top-6 left-6 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/10 text-xs transition-all backdrop-blur-md shadow-xl"
          >
            <ArrowLeft size={16} /> Portfolio
          </Link>

          {/* Game Canvas Engine */}
          <GameCanvas
            difficulty={difficulty}
            onGameOver={handleGameOver}
            onVictory={handleVictory}
            onPlayerUpdate={setPlayerData}
            mobileMove={mobileMove}
            mobileFireTrigger={mobileFireTrigger}
            mobileReloadTrigger={mobileReloadTrigger}
            mobileKnifeTrigger={mobileKnifeTrigger}
          />

          {/* HUD Overlay */}
          <HUD
            player={playerData}
            hasKey={playerData.hasKey}
            onReload={() => setMobileReloadTrigger(prev => prev + 1)}
            onWeaponChange={(idx) => setPlayerData(prev => ({ ...prev, activeWeaponIndex: idx }))}
          />

          {/* Mobile Touch Overlay */}
          <MobileControls
            onMove={setMobileMove}
            onFire={() => setMobileFireTrigger(prev => prev + 1)}
            onReload={() => setMobileReloadTrigger(prev => prev + 1)}
            onQuickKnife={() => setMobileKnifeTrigger(prev => prev + 1)}
            onNextWeapon={() => setPlayerData(prev => ({ ...prev, activeWeaponIndex: (prev.activeWeaponIndex + 1) % prev.weapons.length }))}
          />
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameState === 'gameover' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="max-w-md w-full bg-red-950/40 border-2 border-red-600 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-red-900/50">
            <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/40 animate-pulse">
              <Skull size={36} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-red-500 tracking-wider">VOUS ÊTES MORT</h2>
              <p className="text-gray-400 text-sm mt-2">La horde a eu raison de vous dans les ténèbres.</p>
            </div>

            <div className="bg-black/60 p-4 rounded-xl border border-white/10 font-mono text-sm">
              <p className="text-gray-400">Zombies éliminés : <span className="text-yellow-400 font-bold">{stats.kills}</span></p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setGameState('menu')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors border border-white/10 text-sm"
              >
                Menu
              </button>
              <button
                onClick={handleStartGame}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY MODAL */}
      {gameState === 'victory' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="max-w-md w-full bg-green-950/40 border-2 border-green-500 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-green-900/50">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-400/40 animate-bounce">
              <Trophy size={36} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-green-400 tracking-wider">ÉVASION RÉUSSIE !</h2>
              <p className="text-gray-300 text-sm mt-2">Vous avez trouvé la clé et fui le manoir sain et sauf !</p>
            </div>

            <div className="bg-black/60 p-4 rounded-xl border border-white/10 font-mono text-sm">
              <p className="text-gray-400">Zombies éliminés : <span className="text-green-400 font-bold">{stats.kills}</span></p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setGameState('menu')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors border border-white/10 text-sm"
              >
                Menu
              </button>
              <button
                onClick={handleStartGame}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-green-600/30"
              >
                Rejouer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SurvivalGameApp;
