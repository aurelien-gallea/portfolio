import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw, Skull, Trophy, ShieldAlert, Smartphone } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import MobileControls from './components/MobileControls';

const SurvivalGameApp = () => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameover', 'victory'
  const [difficulty, setDifficulty] = useState('normal');
  const [stats, setStats] = useState({ kills: 0 });
  const [restartKey, setRestartKey] = useState(0);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 1024;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const [playerData, setPlayerData] = useState({
    hp: 100,
    maxHp: 100,
    activeWeaponIndex: 0,
    weapons: [
      { id: 'handgun', name: 'Pistolet 9mm', magAmmo: 12, reserveAmmo: 36 }
    ]
  });

  // Mobile Triggers
  const [mobileMove, setMobileMove] = useState({ x: 0, y: 0 });
  const [mobileFireTrigger, setMobileFireTrigger] = useState(0);
  const [mobileReloadTrigger, setMobileReloadTrigger] = useState(0);

  const handleStartGame = () => {
    setRestartKey(prev => prev + 1);
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

  const highScore = parseInt(localStorage.getItem('zombie_game_highscore') || '0', 10);

  return (
    <div className="fixed inset-0 w-full h-full bg-[#050508] text-white selection:bg-red-600 selection:text-white overflow-hidden font-sans touch-none">
      
      {/* MOBILE PORTRAIT ORIENTATION PROMPT OVERLAY */}
      {isPortraitMobile && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/95 text-center backdrop-blur-2xl touch-none">
          <div className="w-20 h-20 rounded-3xl bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/40 animate-pulse mb-6">
            <Smartphone size={44} className="rotate-90 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-wider mb-2">MODE PAYSAGE REQUIS</h2>
          <p className="text-gray-400 text-xs max-w-xs leading-relaxed font-mono">
            Pour jouer dans les meilleures conditions, veuillez pivoter votre smartphone à l'horizontale 🔄
          </p>
        </div>
      )}
      
      {/* MENU SCREEN */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 md:p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/40 via-black to-black border-4 border-red-900/30 overflow-y-auto pointer-events-auto">
          
          {/* Header Link */}
          <div className="flex justify-between items-center mb-2">
            <Link 
              to="/" 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 text-xs transition-all backdrop-blur-md"
            >
              <ArrowLeft size={16} /> Portfolio
            </Link>
            <div className="flex items-center gap-2 text-red-500 font-mono text-xs animate-pulse">
              <ShieldAlert size={16} /> ALERTE INFECTÉS
            </div>
          </div>

          {/* Hero Main Content */}
          <div className="max-w-3xl mx-auto text-center space-y-3 md:space-y-6 my-auto">
            <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 drop-shadow-[0_10px_20px_rgba(220,38,38,0.5)]">
              ZOMBIE RULES
            </h1>
            <p className="text-gray-400 text-xs md:text-base max-w-xl mx-auto leading-relaxed">
              Infiltrez le labyrinthe généré aléatoirement. Évitez les pièges, éliminez la horde et trouvez la clé de sortie !
            </p>

            {/* High Score Badge */}
            {highScore > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-xs font-bold shadow-lg shadow-yellow-500/10">
                <Trophy size={16} /> MEILLEUR SCORE : {highScore} PTS
              </div>
            )}

            {/* Difficulty Selector */}
            <div className="flex justify-center gap-2 md:gap-3 py-1 flex-wrap">
              {[
                { id: 'easy', label: 'Recrue (1.0x)' },
                { id: 'normal', label: 'Survivant (1.5x)' },
                { id: 'hard', label: 'Cauchemar (2.5x)' }
              ].map(d => (
                <button
                  key={d.id}
                  onTouchStart={() => setDifficulty(d.id)}
                  onClick={() => setDifficulty(d.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer pointer-events-auto ${
                    difficulty === d.id 
                      ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30 scale-105' 
                      : 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/20'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Start Game Button */}
            <button
              onTouchStart={handleStartGame}
              onClick={handleStartGame}
              className="px-8 py-3.5 md:py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-lg tracking-wider shadow-2xl shadow-red-600/40 hover:scale-105 transition-all flex items-center gap-3 mx-auto cursor-pointer pointer-events-auto"
            >
              <Play fill="currentColor" size={20} /> COMMENCER LA MISSION
            </button>
          </div>

          {/* Controls Quick Guide */}
          <div className="max-w-2xl mx-auto w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-white font-bold mb-0.5">🎮 PC : ZQSD / Souris / R / P (Pause)</p>
            </div>
            <div>
              <p className="text-white font-bold mb-0.5">📱 Mobile : Joystick Gauche + Boutons Tirer/Recharger</p>
            </div>
          </div>
        </div>
      )}

      {/* PLAYING & PAUSED STATE */}
      {(gameState === 'playing' || gameState === 'paused' || gameState === 'gameover' || gameState === 'victory') && (
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
            key={restartKey}
            difficulty={difficulty}
            isPaused={gameState === 'paused'}
            onGameOver={handleGameOver}
            onVictory={handleVictory}
            onPlayerUpdate={setPlayerData}
            mobileMove={mobileMove}
            mobileFireTrigger={mobileFireTrigger}
            mobileReloadTrigger={mobileReloadTrigger}
          />

          {/* HUD Overlay */}
          <HUD
            player={playerData}
            hasKey={playerData.hasKey}
            score={playerData.score || 0}
            kills={playerData.kills || 0}
            multiplier={playerData.multiplier || (difficulty === 'hard' ? 2.5 : difficulty === 'easy' ? 1.0 : 1.5)}
            onReload={() => setMobileReloadTrigger(prev => prev + 1)}
            onPause={() => setGameState(prev => prev === 'paused' ? 'playing' : 'paused')}
          />

          {/* Mobile Touch Overlay */}
          <MobileControls
            onMove={setMobileMove}
            onFire={() => setMobileFireTrigger(prev => prev + 1)}
            onReload={() => setMobileReloadTrigger(prev => prev + 1)}
          />
        </div>
      )}

      {/* PAUSE MODAL */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-sm w-full bg-zinc-900/90 border border-white/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-white/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto border border-white/20">
              <Pause size={36} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-wider">PAUSE</h2>
              <p className="text-gray-400 text-xs mt-1 font-mono">Partie suspendue</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setGameState('playing')}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Play size={18} fill="currentColor" /> Reprendre la partie
              </button>
              <button
                onClick={handleStartGame}
                className="w-full bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white font-bold py-3 rounded-xl transition-colors border border-white/10 text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Recommencer
              </button>
              <button
                onClick={() => setGameState('menu')}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-colors text-sm cursor-pointer"
              >
                Menu Principal
              </button>
            </div>
          </div>
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

            {/* Score Breakdown Card */}
            <div className="bg-black/70 p-5 rounded-2xl border border-white/10 font-mono text-xs space-y-2 text-left">
              <div className="flex justify-between text-gray-400">
                <span>Zombies éliminés ({stats.kills || 0}) :</span>
                <span className="text-yellow-400 font-bold">+{stats.killScore || 0} pts</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Bonus Santé :</span>
                <span className="text-green-400 font-bold">+{stats.hpBonus || 0} pts</span>
              </div>
              <div className="flex justify-between text-gray-400 border-t border-white/10 pt-2">
                <span>Multiplicateur Difficulté :</span>
                <span className="text-orange-400 font-bold">{stats.multiplier || 1}x</span>
              </div>
              <div className="flex justify-between text-white text-base font-black border-t border-white/20 pt-2">
                <span>SCORE FINAL :</span>
                <span className="text-yellow-400">{stats.score || 0} PTS</span>
              </div>
              {stats.isNewRecord && (
                <div className="mt-2 text-center text-xs font-bold text-yellow-400 animate-bounce pt-1">
                  🏆 NOUVEAU RECORD PERSONNEL !
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setGameState('menu')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors border border-white/10 text-sm cursor-pointer"
              >
                Menu
              </button>
              <button
                onClick={handleStartGame}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
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

            {/* Score Breakdown Card */}
            <div className="bg-black/70 p-5 rounded-2xl border border-white/10 font-mono text-xs space-y-2 text-left">
              <div className="flex justify-between text-gray-400">
                <span>Zombies éliminés ({stats.kills || 0}) :</span>
                <span className="text-yellow-400 font-bold">+{stats.killScore || 0} pts</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Bonus Évasion :</span>
                <span className="text-green-400 font-bold">+{stats.victoryBonus || 1000} pts</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Bonus Santé RESTANTE :</span>
                <span className="text-green-400 font-bold">+{stats.hpBonus || 0} pts</span>
              </div>
              <div className="flex justify-between text-gray-400 border-t border-white/10 pt-2">
                <span>Multiplicateur Difficulté :</span>
                <span className="text-orange-400 font-bold">{stats.multiplier || 1}x</span>
              </div>
              <div className="flex justify-between text-white text-base font-black border-t border-white/20 pt-2">
                <span>SCORE FINAL :</span>
                <span className="text-yellow-400">{stats.score || 0} PTS</span>
              </div>
              {stats.isNewRecord && (
                <div className="mt-2 text-center text-xs font-bold text-yellow-400 animate-bounce pt-1">
                  🏆 NOUVEAU RECORD PERSONNEL !
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setGameState('menu')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors border border-white/10 text-sm cursor-pointer"
              >
                Menu
              </button>
              <button
                onClick={handleStartGame}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-green-600/30 cursor-pointer"
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
