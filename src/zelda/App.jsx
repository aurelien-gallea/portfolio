import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pause, Play, Volume2, VolumeX, RefreshCw, Hammer } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { DPad, AttackButton } from './components/Controls';
import { sfx } from './engine/audio';

const isTouchDevice = () =>
  typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);

const INITIAL_HUD = { hp: 6, maxHp: 6, rupees: 0, hasKey: false, room: '1,1', zone: 'Plaine du Départ' };

const TIPS = [
  { icon: '🗝️', title: 'Objectif', text: 'Nettoie le cimetière pour faire apparaître un coffre, puis ouvre le donjon de la montagne.' },
  { icon: '⚔️', title: 'Rayon d\'épée', text: 'À pleine vie, chaque coup d\'épée projette un rayon.' },
  { icon: '🛡️', title: 'Bouclier', text: 'Face à une pierre, ne frappe pas : ton bouclier la bloque.' },
  { icon: '🌿', title: 'Buissons', text: 'Tranche-les : certains cachent des rubis… ou un secret.' },
];

const formatTime = (sec = 0) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const Heart = ({ fill }) => (
  <svg viewBox="0 0 7 6" className="w-4 h-4" shapeRendering="crispEdges">
    <path d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z" fill="#3a1418" />
    {fill > 0 && (
      <path
        d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z"
        fill="#e83a4f"
        style={fill === 1 ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
      />
    )}
  </svg>
);

const MiniMap = ({ room }) => (
  <div className="grid grid-cols-3 gap-0.5 p-1 bg-black/60 rounded" title="Carte">
    {[0, 1, 2].flatMap(y => [0, 1, 2].map(x => {
      const here = room === `${x},${y}` || (room === 'cave' && x === 2 && y === 0);
      return <div key={`${x},${y}`} className={`w-2.5 h-1.5 ${here ? 'bg-emerald-400' : 'bg-white/20'}`} />;
    }))}
  </div>
);

const Hud = ({ hud }) => {
  const hearts = [];
  for (let i = 0; i < hud.maxHp / 2; i++) hearts.push(Math.max(0, Math.min(2, hud.hp - i * 2)));
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-black rounded-md font-mono text-xs">
      <div className="flex items-center gap-3">
        <MiniMap room={hud.room} />
        <div className="hidden sm:block text-gray-300 truncate max-w-[12rem]">{hud.zone}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-emerald-400 font-bold">◆ {hud.rupees}</span>
        <span className={hud.hasKey ? 'opacity-100' : 'opacity-20'} title="Clé du donjon">🗝️</span>
        <div className="flex gap-0.5 flex-wrap max-w-[9rem]">
          {hearts.map((f, i) => <Heart key={i} fill={f} />)}
        </div>
      </div>
    </div>
  );
};

const ZeldaApp = () => {
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameover, victory
  const [restartKey, setRestartKey] = useState(0);
  const [hud, setHud] = useState(INITIAL_HUD);
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);
  const [muted, setMuted] = useState(sfx.muted);
  const [isTouch] = useState(isTouchDevice);
  const [landscape, setLandscape] = useState(() => window.innerWidth > window.innerHeight);
  const controls = useRef({ dirs: [], attack: false });
  const toastTimer = useRef(null);

  useEffect(() => {
    const onResize = () => setLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKey = e => {
      const key = e.key.toLowerCase();
      if (key === 'escape' || key === 'p') {
        setGameState(g => (g === 'playing' ? 'paused' : g === 'paused' ? 'playing' : g));
      }
      if (key === 'm') toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = text => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const start = () => {
    sfx.init();
    controls.current = { dirs: [], attack: false };
    setHud(INITIAL_HUD);
    setResult(null);
    setRestartKey(k => k + 1);
    setGameState('playing');
    showToast('Il est dangereux de partir seul… mais ton épée est prête !');
  };

  const toggleMute = () => {
    sfx.setMuted(!sfx.muted);
    setMuted(sfx.muted);
  };

  const inGame = gameState !== 'menu';
  const sideControls = isTouch && landscape;

  const canvasWidth = sideControls
    ? 'min(calc(100vw - 360px), calc((100dvh - 70px) * 256 / 176))'
    : isTouch
      ? 'min(100%, calc((100dvh - 330px) * 256 / 176))'
      : 'min(100%, calc((100dvh - 140px) * 256 / 176))';

  const screen = (
    <div className="relative mx-auto" style={{ width: canvasWidth }}>
      <Hud hud={hud} />
      <div className="relative mt-1.5 border-4 border-black rounded-lg shadow-2xl shadow-emerald-900/30">
        <GameCanvas
          key={restartKey}
          paused={gameState !== 'playing'}
          controls={controls}
          onHud={setHud}
          onMessage={showToast}
          onGameOver={stats => { setResult(stats); setGameState('gameover'); }}
          onVictory={stats => { setResult(stats); setGameState('victory'); }}
        />

        {toast && gameState === 'playing' && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-1.5 sm:bottom-3 w-max max-w-[90%] px-2 py-1 sm:px-3 sm:py-2 bg-black/85 border sm:border-2 border-white/80 rounded text-white text-[9px] leading-tight sm:text-sm font-mono text-center pointer-events-none">
            {toast}
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 rounded">
            <p className="font-mono font-black text-2xl tracking-widest">PAUSE</p>
            <button onClick={() => setGameState('playing')} className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-sm flex items-center gap-2">
              <Play size={16} /> Reprendre
            </button>
          </div>
        )}

        {(gameState === 'gameover' || gameState === 'victory') && result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3 bg-black/80 rounded text-center p-4">
            {gameState === 'gameover' ? (
              <p className="font-mono font-black text-2xl sm:text-4xl text-red-500 tracking-widest">GAME OVER</p>
            ) : (
              <>
                <p className="font-mono font-black text-xl sm:text-3xl text-amber-300">Tu as récupéré l'Éclat !</p>
                <p className="text-gray-300 text-xs sm:text-sm max-w-sm">Fin de la démo — la suite de l'aventure est en cours de développement.</p>
              </>
            )}
            <p className="font-mono text-xs text-gray-400">
              ◆ {result.rupees} rubis · ⏱ {formatTime(result.time)}{result.hearts ? ` · ❤ ${result.hearts} cœurs` : ''}
            </p>
            <div className="flex gap-2">
              <button onClick={start} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-sm flex items-center gap-2">
                <RefreshCw size={16} /> Rejouer
              </button>
              <button onClick={() => setGameState('menu')} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-bold text-sm">
                Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0b120c] text-white overflow-y-auto font-sans select-none">
      <header className="flex items-center justify-between px-3 sm:px-6 py-2">
        <Link to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 text-xs transition-all">
          <ArrowLeft size={16} /> Portfolio
        </Link>
        <h1 className="font-mono font-black tracking-widest text-emerald-400 text-sm sm:text-base">ZELDA 2D</h1>
        <div className="flex gap-2">
          {inGame && (gameState === 'playing' || gameState === 'paused') && (
            <button
              onClick={() => setGameState(g => (g === 'playing' ? 'paused' : 'playing'))}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10"
              aria-label="Pause"
            >
              {gameState === 'paused' ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
          <button onClick={toggleMute} className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10" aria-label="Son">
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {gameState === 'menu' ? (
        <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Hammer size={14} /> En cours de développement
          </div>
          <h2 className="font-mono text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500">
            ZELDA 2D
          </h2>
          <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Un hommage aux aventures en vue de dessus des années 80. Explore neuf contrées, affronte leurs créatures,
            trouve la clé du donjon et reprends l'Éclat au Gardien de la montagne.
          </p>
          <button
            onClick={start}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-lg tracking-wider shadow-2xl shadow-emerald-600/30 hover:scale-105 transition-all inline-flex items-center gap-3"
          >
            <Play fill="currentColor" size={20} /> COMMENCER L'AVENTURE
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {TIPS.map(tip => (
              <div key={tip.title} className="flex gap-2 items-start bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <span className="text-lg leading-none mt-0.5">{tip.icon}</span>
                <div>
                  <p className="text-xs font-bold text-white">{tip.title}</p>
                  <p className="text-[11px] text-gray-400 leading-snug">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            <p><span className="text-white font-bold">🎮 Clavier :</span> Flèches / ZQSD bouger · Espace ou J épée · Échap pause · M son</p>
            <p><span className="text-white font-bold">📱 Mobile :</span> Croix pour bouger · Bouton ÉPÉE pour frapper</p>
          </div>
        </main>
      ) : sideControls ? (
        <main className="flex items-center justify-between gap-2 px-3 pb-2">
          <DPad controls={controls} />
          {screen}
          <AttackButton controls={controls} />
        </main>
      ) : (
        <main className="px-3 pb-4">
          {screen}
          {isTouch && (
            <div className="flex items-center justify-between max-w-md mx-auto mt-4 px-2">
              <DPad controls={controls} />
              <AttackButton controls={controls} />
            </div>
          )}
        </main>
      )}
    </div>
  );
};

export default ZeldaApp;
