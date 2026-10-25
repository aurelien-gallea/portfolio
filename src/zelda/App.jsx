import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pause, Play, Volume2, VolumeX, RefreshCw, Hammer, Smartphone, Maximize2, Minimize2, Swords } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { Joystick, AttackButton } from './components/Controls';
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
  <div className="grid grid-cols-3 gap-1 p-1.5 bg-black/60 rounded-md border border-white/10 w-fit" title="Carte">
    {[0, 1, 2].flatMap(y => [0, 1, 2].map(x => {
      const here = room === `${x},${y}` || (room === 'cave' && x === 2 && y === 0);
      const dungeon = x === 2 && y === 0;
      return (
        <div
          key={`${x},${y}`}
          className={`w-6 h-4 rounded-sm ${here ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-white/15'} ${dungeon ? 'ring-1 ring-amber-400/60' : ''}`}
        />
      );
    }))}
  </div>
);

// Cœurs posés en haut à droite de l'écran de jeu
const Hearts = ({ hud }) => {
  const hearts = [];
  for (let i = 0; i < hud.maxHp / 2; i++) hearts.push(Math.max(0, Math.min(2, hud.hp - i * 2)));
  return (
    <div className="absolute top-1.5 right-1.5 flex flex-wrap justify-end gap-0.5 max-w-[40%] px-1.5 py-1 rounded bg-black/45 pointer-events-none">
      {hearts.map((f, i) => <Heart key={i} fill={f} />)}
    </div>
  );
};

// Carte, zone, rubis et clé, sur le côté de l'écran de jeu
const SidePanel = ({ hud }) => (
  <div className="flex flex-col gap-2 font-mono text-xs">
    <MiniMap room={hud.room} />
    <div className="text-gray-300 text-[11px] leading-tight">{hud.zone}</div>
    <div className="flex items-center gap-3">
      <span className="text-emerald-400 font-bold">◆ {hud.rupees}</span>
      <span className={hud.hasKey ? 'opacity-100' : 'opacity-20'} title="Clé du donjon">🗝️</span>
    </div>
  </div>
);

// Plus grande taille de l'écran de jeu (bordure comprise) qui tient dans la zone mesurée
const BORDER = 8;
function fitWidth(rect) {
  return Math.max(120, Math.floor(Math.min(rect.width, ((rect.height - BORDER) * 256) / 176 + BORDER)));
}

const ZeldaApp = () => {
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameover, victory
  const [restartKey, setRestartKey] = useState(0);
  const [hud, setHud] = useState(INITIAL_HUD);
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);
  const [muted, setMuted] = useState(sfx.muted);
  const [isTouch] = useState(isTouchDevice);
  const [landscape, setLandscape] = useState(() => window.innerWidth > window.innerHeight);
  const controls = useRef({ dirs: [], vec: null, attack: false });
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

  // Sur mobile : plein écran puis verrouillage en paysage (Android ; iOS garde l'écran « tourne ton téléphone »)
  const lockLandscape = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
      await screen.orientation?.lock?.('landscape');
    } catch {
      // Refusé ou non supporté
    }
  };

  // Rend l'écran au navigateur : sortie du plein écran et orientation libre
  const releaseScreen = () => {
    try { screen.orientation?.unlock?.(); } catch { /* non supporté */ }
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      releaseScreen();
    };
  }, []);

  // De retour au menu, on ne garde ni le plein écran ni le paysage forcé
  useEffect(() => {
    if (gameState === 'menu') releaseScreen();
  }, [gameState]);

  const toggleFullscreen = () => (document.fullscreenElement ? releaseScreen() : lockLandscape());

  // Point de reprise enregistré à l'entrée du donjon, et celui à restaurer au prochain lancement
  const [checkpoint, setCheckpoint] = useState(null);
  const [resumeFrom, setResumeFrom] = useState(null);

  const launch = (from, intro) => {
    sfx.init();
    if (isTouch) lockLandscape();
    controls.current = { dirs: [], vec: null, attack: false };
    setHud(INITIAL_HUD);
    setResult(null);
    setResumeFrom(from);
    setRestartKey(k => k + 1);
    setGameState('playing');
    showToast(intro);
  };

  const start = () => {
    setCheckpoint(null);
    launch(null, 'Il est dangereux de partir seul… mais ton épée est prête !');
  };

  const retryBoss = () => launch(checkpoint, 'Nouvelle tentative contre le Gardien. Courage !');

  const toggleMute = () => {
    sfx.setMuted(!sfx.muted);
    setMuted(sfx.muted);
  };

  const inGame = gameState !== 'menu';
  const portraitBlock = isTouch && !landscape;
  const sideControls = isTouch && inGame;

  // La taille de l'écran de jeu suit l'espace réellement disponible (barres du navigateur comprises)
  const fitRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  useEffect(() => {
    const el = fitRef.current;
    if (!el) return undefined;
    const update = () => setCanvasWidth(fitWidth(el.getBoundingClientRect()));
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [inGame, sideControls]);

  const pauseButton = (gameState === 'playing' || gameState === 'paused') && (
    <button
      onClick={() => setGameState(g => (g === 'playing' ? 'paused' : 'playing'))}
      className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10"
      aria-label="Pause"
    >
      {gameState === 'paused' ? <Play size={16} /> : <Pause size={16} />}
    </button>
  );
  const fullscreenButton = document.fullscreenEnabled && (
    <button onClick={toggleFullscreen} className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10" aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}>
      {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
  );
  const muteButton = (
    <button onClick={toggleMute} className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10" aria-label="Son">
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );

  const screen = (
    <div ref={fitRef} className="flex-1 min-w-0 min-h-0 flex items-center justify-center">
      <div className="relative border-4 border-black rounded-lg shadow-2xl shadow-emerald-900/30" style={{ width: canvasWidth || undefined }}>
        <GameCanvas
          key={restartKey}
          paused={gameState !== 'playing' || portraitBlock}
          controls={controls}
          resume={resumeFrom}
          onCheckpoint={setCheckpoint}
          onHud={setHud}
          onMessage={showToast}
          onGameOver={stats => { setResult(stats); setGameState('gameover'); }}
          onVictory={stats => { setResult(stats); setGameState('victory'); }}
        />
        <Hearts hud={hud} />

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
            <div className="flex flex-wrap justify-center gap-2">
              {gameState === 'gameover' && checkpoint && (
                <button onClick={retryBoss} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm flex items-center gap-2">
                  <Swords size={16} /> Réessayer avant le boss
                </button>
              )}
              <button
                onClick={start}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${gameState === 'gameover' && checkpoint ? 'bg-white/10 hover:bg-white/20' : 'bg-emerald-600 hover:bg-emerald-500'}`}
              >
                <RefreshCw size={16} /> {checkpoint && gameState === 'gameover' ? 'Tout recommencer' : 'Rejouer'}
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
    <div className={`fixed inset-0 flex flex-col bg-[#0b120c] text-white font-sans select-none ${sideControls ? 'overflow-hidden touch-none' : 'overflow-y-auto'}`}>
      {portraitBlock && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 p-8 bg-[#0b120c] text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
            <Smartphone size={44} style={{ animation: 'zelda-rotate 2.4s ease-in-out infinite' }} />
          </div>
          <style>{'@keyframes zelda-rotate{0%,20%{transform:rotate(0)}50%,80%{transform:rotate(90deg)}100%{transform:rotate(0)}}'}</style>
          <h2 className="font-mono font-black text-xl tracking-wider">TOURNE TON TÉLÉPHONE</h2>
          <p className="text-gray-400 text-sm max-w-xs leading-relaxed">Zelda like 2D se joue à l'horizontale, avec le joystick à gauche et l'épée à droite.</p>
          <Link to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-gray-300 border border-white/10 text-xs">
            <ArrowLeft size={16} /> Portfolio
          </Link>
        </div>
      )}

      {!sideControls && (
        <header className="flex items-center justify-between px-3 sm:px-6 py-2">
          <Link to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 text-xs transition-all">
            <ArrowLeft size={16} /> Portfolio
          </Link>
          <h1 className="font-mono font-black tracking-widest text-emerald-400 text-sm sm:text-base">ZELDA LIKE 2D</h1>
          <div className="flex gap-2">
            {inGame && pauseButton}
            {fullscreenButton}{muteButton}
          </div>
        </header>
      )}

      {gameState === 'menu' ? (
        <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Hammer size={14} /> En cours de développement
          </div>
          <h2 className="font-mono text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500">
            ZELDA LIKE 2D
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
            <p><span className="text-white font-bold">📱 Mobile :</span> En paysage · Pouce gauche n'importe où pour le joystick · Bouton ÉPÉE pour frapper</p>
          </div>
        </main>
      ) : sideControls ? (
        // Paysage tactile : boutons système et joystick à gauche, écran au centre, épée à droite
        <main className="flex flex-1 min-h-0 items-stretch gap-2 px-2 py-2" style={{ paddingLeft: 'max(0.5rem, env(safe-area-inset-left))', paddingRight: 'max(0.5rem, env(safe-area-inset-right))', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <div className="flex flex-col gap-2 w-[136px] shrink-0">
            <div className="flex gap-2">
              <Link to="/" className="p-2 rounded-full bg-white/10 border border-white/10" aria-label="Portfolio"><ArrowLeft size={16} /></Link>
              {pauseButton}
            </div>
            <SidePanel hud={hud} />
            <div className="flex-1 min-h-0">
              <Joystick controls={controls} />
            </div>
          </div>
          {screen}
          <div className="flex flex-col w-[136px] shrink-0 items-end">
            <div className="flex gap-2">{fullscreenButton}{muteButton}</div>
            <div className="flex-1 flex items-end justify-center w-full pb-4">
              <AttackButton controls={controls} />
            </div>
          </div>
        </main>
      ) : (
        <main className="flex flex-1 min-h-0 gap-4 px-3 sm:px-6 pb-4">
          <aside className="w-40 shrink-0 pt-1">
            <SidePanel hud={hud} />
          </aside>
          {screen}
          <div className="hidden lg:block w-40 shrink-0" />
        </main>
      )}
    </div>
  );
};

export default ZeldaApp;
