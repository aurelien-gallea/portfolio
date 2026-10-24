import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RefreshCw, Skull, Trophy, ShieldAlert, Smartphone } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import MobileControls from './components/MobileControls';
import { DIFFICULTIES } from './engine/config';
import { sounds } from './utils/audio';

const isTouchDevice = () =>
  typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);

const INITIAL_HUD = {
  hp: 100,
  maxHp: 100,
  active: 'handgun',
  weapons: [],
  reload: null,
  hasKey: false,
  score: 0,
  kills: 0,
  multiplier: 1.5,
  zombiesLeft: 0,
  hordeActive: false,
  time: 0,
  muted: false,
};

const LEGEND = [
  { icon: '🔑', title: 'Clé', text: 'Cachée dans la pièce la plus lointaine. La ramasser réveille la horde.' },
  { icon: '🚪', title: 'Sortie', text: 'Verrouillée jusqu\'à ce que vous ayez la clé.' },
  { icon: '🕳️', title: 'Trous', text: '-15 PV si vous tombez. Attirez-y les zombies !' },
  { icon: '🧟', title: 'Infectés', text: 'Vert : lent · Pâle : rapide · Violet : colosse.' },
  { icon: '💥', title: 'Bruit', text: 'Chaque tir alerte les zombies proches, même derrière les portes.' },
  { icon: '🔫', title: 'Fusil à pompe', text: 'Caché dans un cul-de-sac. Explorez !' },
];

const formatTime = (sec = 0) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const ScoreCard = ({ stats, victory }) => (
  <div className="bg-black/70 p-3 rounded-xl border border-white/10 font-mono text-xs space-y-1.5 text-left">
    <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-white/10">
      <div><div className="text-white font-black text-base">{stats.kills || 0}</div><div className="text-[10px] text-gray-500">zombies</div></div>
      <div><div className="text-white font-black text-base">{formatTime(stats.time)}</div><div className="text-[10px] text-gray-500">temps</div></div>
      <div><div className="text-white font-black text-base">{stats.accuracy || 0}%</div><div className="text-[10px] text-gray-500">précision</div></div>
    </div>
    <div className="flex justify-between text-gray-400">
      <span>Éliminations :</span>
      <span className="text-yellow-400 font-bold">+{stats.killScore || 0} pts</span>
    </div>
    {victory && (
      <>
        <div className="flex justify-between text-gray-400">
          <span>Bonus évasion :</span>
          <span className="text-green-400 font-bold">+{stats.victoryBonus || 0} pts</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Bonus santé :</span>
          <span className="text-green-400 font-bold">+{stats.hpBonus || 0} pts</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Bonus rapidité :</span>
          <span className="text-green-400 font-bold">+{stats.timeBonus || 0} pts</span>
        </div>
      </>
    )}
    <div className="flex justify-between text-gray-400 border-t border-white/10 pt-1.5">
      <span>Multiplicateur :</span>
      <span className="text-orange-400 font-bold">{stats.multiplier || 1}x</span>
    </div>
    <div className="flex justify-between text-white font-black border-t border-white/20 pt-1.5">
      <span>SCORE FINAL :</span>
      <span className="text-yellow-400">{stats.score || 0} PTS</span>
    </div>
    {stats.isNewRecord ? (
      <div className="text-center text-xs font-bold text-yellow-400 animate-bounce pt-1">🏆 NOUVEAU RECORD !</div>
    ) : (
      <div className="text-center text-[10px] text-gray-500 pt-1">Record : {stats.highScore || 0} pts</div>
    )}
  </div>
);

const SurvivalGameApp = () => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameover', 'victory'
  const [difficulty, setDifficulty] = useState('normal');
  const [stats, setStats] = useState({ kills: 0 });
  const [restartKey, setRestartKey] = useState(0);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [isTouch] = useState(isTouchDevice);
  const [hud, setHud] = useState(INITIAL_HUD);

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

  // Mobile Triggers
  const [mobileMove, setMobileMove] = useState({ x: 0, y: 0 });
  const [mobileFireTrigger, setMobileFireTrigger] = useState(0);
  const [mobileReloadTrigger, setMobileReloadTrigger] = useState(0);
  const [mobileKnifeTrigger, setMobileKnifeTrigger] = useState(0);
  const [mobileSwitchTrigger, setMobileSwitchTrigger] = useState(0);

  const handleStartGame = () => {
    sounds.init();
    setHud({ ...INITIAL_HUD, muted: sounds.muted });
    setRestartKey(prev => prev + 1);
    setGameState('playing');
  };

  const handleGameOver = useCallback((gameStats) => {
    setStats(gameStats);
    setTimeout(() => setGameState('gameover'), 600);
  }, []);

  const handleVictory = useCallback((gameStats) => {
    setStats(gameStats);
    setGameState('victory');
  }, []);

  const togglePause = useCallback(() => {
    setGameState(prev => (prev === 'paused' ? 'playing' : prev === 'playing' ? 'paused' : prev));
  }, []);

  const toggleMute = () => {
    sounds.setMuted(!sounds.muted);
    setHud(prev => ({ ...prev, muted: sounds.muted }));
  };

  // P / Escape toggles pause; leaving the tab pauses automatically
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
    };
    const handleVisibility = () => {
      if (document.hidden) setGameState(prev => (prev === 'playing' ? 'paused' : prev));
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [togglePause]);

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
          <div className="max-w-3xl mx-auto text-center space-y-3 md:space-y-5 my-auto">
            <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 drop-shadow-[0_10px_20px_rgba(220,38,38,0.5)]">
              ZOMBIE RULES
            </h1>
            <p className="text-gray-400 text-xs md:text-base max-w-xl mx-auto leading-relaxed">
              Un manoir différent à chaque partie. Trouvez la clé au fond des pièces, survivez à la horde qu'elle réveille et fuyez par la sortie.
            </p>

            {/* High Score Badge */}
            {highScore > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-xs font-bold shadow-lg shadow-yellow-500/10">
                <Trophy size={16} /> MEILLEUR SCORE : {highScore} PTS
              </div>
            )}

            {/* Difficulty Selector */}
            <div className="flex justify-center gap-2 md:gap-3 py-1 flex-wrap">
              {Object.entries(DIFFICULTIES).map(([id, d]) => (
                <button
                  key={id}
                  onTouchStart={() => setDifficulty(id)}
                  onClick={() => setDifficulty(id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer pointer-events-auto ${
                    difficulty === id
                      ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30 scale-105'
                      : 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/20'
                  }`}
                >
                  {d.label} ({d.multiplier.toFixed(1)}x)
                  <span className="block text-[9px] font-mono font-normal normal-case tracking-normal opacity-70">
                    {d.zombies} zombies · horde de {d.horde}
                  </span>
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

            {/* Rules legend */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-left max-w-2xl mx-auto">
              {LEGEND.map(item => (
                <div key={item.title} className="flex gap-2 items-start bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                  <span className="text-base leading-none mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-[11px] font-bold text-white">{item.title}</p>
                    <p className="text-[10px] text-gray-400 leading-snug">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls Quick Guide */}
          <div className="max-w-2xl mx-auto w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <p><span className="text-white font-bold">🎮 PC :</span> ZQSD · Souris viser/tirer · Clic droit / F couteau · 1-2-3 ou molette armes · R recharger · P pause · M son</p>
            <p><span className="text-white font-bold">📱 Mobile :</span> Joystick pour bouger et viser · Visée assistée · Tirer, Lame, Recharger, Changer d'arme</p>
          </div>
        </div>
      )}

      {/* PLAYING & PAUSED STATE */}
      {gameState !== 'menu' && (
        <div className={`relative w-full h-full ${isTouch ? '' : 'lg:py-14'}`}>
          {/* Game Canvas Engine */}
          <GameCanvas
            key={restartKey}
            difficulty={difficulty}
            isPaused={gameState === 'paused'}
            onGameOver={handleGameOver}
            onVictory={handleVictory}
            onHudUpdate={setHud}
            mobileMove={mobileMove}
            mobileFireTrigger={mobileFireTrigger}
            mobileReloadTrigger={mobileReloadTrigger}
            mobileKnifeTrigger={mobileKnifeTrigger}
            mobileSwitchTrigger={mobileSwitchTrigger}
          />

          {/* HUD Overlay */}
          <HUD hud={hud} onPause={togglePause} onToggleMute={toggleMute} />

          {/* Mobile Touch Overlay */}
          {isTouch && (
            <MobileControls
              onMove={setMobileMove}
              onFire={() => setMobileFireTrigger(prev => prev + 1)}
              onReload={() => setMobileReloadTrigger(prev => prev + 1)}
              onKnife={() => setMobileKnifeTrigger(prev => prev + 1)}
              onSwitch={() => setMobileSwitchTrigger(prev => prev + 1)}
            />
          )}
        </div>
      )}

      {/* PAUSE MODAL */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-sm w-full bg-zinc-900/90 border border-white/20 rounded-3xl p-6 md:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 bg-white/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto border border-white/20">
              <Pause size={30} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-wider">PAUSE</h2>
              <p className="text-gray-400 text-xs mt-1 font-mono">
                {hud.hasKey ? 'Clé en poche — la sortie vous attend' : 'Objectif : trouver la clé'} · {hud.kills} zombies éliminés
              </p>
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
                <RefreshCw size={16} /> Nouveau manoir
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setGameState('menu')}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Menu
                </button>
                <Link
                  to="/"
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={14} /> Portfolio
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameState === 'gameover' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="max-w-sm w-full bg-red-950/40 border-2 border-red-600 rounded-2xl p-5 text-center space-y-4 shadow-2xl shadow-red-900/50 my-auto">
            <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/40 animate-pulse">
              <Skull size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-red-500 tracking-wider">VOUS ÊTES MORT</h2>
              <p className="text-gray-400 text-xs mt-1">La horde a eu raison de vous.</p>
            </div>

            <ScoreCard stats={stats} victory={false} />

            <div className="flex gap-3">
              <button
                onClick={() => setGameState('menu')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl transition-colors border border-white/10 text-sm cursor-pointer"
              >
                Menu
              </button>
              <button
                onClick={handleStartGame}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} /> Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY MODAL */}
      {gameState === 'victory' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="max-w-sm w-full bg-green-950/40 border-2 border-green-500 rounded-2xl p-5 text-center space-y-4 shadow-2xl shadow-green-900/50 my-auto">
            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-400/40 animate-bounce">
              <Trophy size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-green-400 tracking-wider">MISSION ACCOMPLIE !</h2>
              <p className="text-gray-400 text-xs mt-1">Vous avez survécu et trouvé la sortie !</p>
            </div>

            <ScoreCard stats={stats} victory />

            <div className="flex gap-3">
              <button
                onClick={() => setGameState('menu')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl transition-colors border border-white/10 text-sm cursor-pointer"
              >
                Menu
              </button>
              <button
                onClick={handleStartGame}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} /> Rejouer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurvivalGameApp;
