import React, { useEffect, useRef } from 'react';
import { createGame } from '../engine/game';
import { W, H } from '../engine/world';

const KEY_DIRS = {
  arrowup: 'up', z: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  arrowleft: 'left', q: 'left', a: 'left',
  arrowright: 'right', d: 'right',
};
const ATTACK_KEYS = new Set([' ', 'j', 'k', 'enter']);

// controls : ref partagée avec les commandes tactiles { dir, attack }
const GameCanvas = ({ paused, controls, onHud, onMessage, onGameOver, onVictory }) => {
  const canvasRef = useRef(null);
  const pausedRef = useRef(paused);
  const callbacks = useRef({});
  callbacks.current = { onHud, onMessage, onGameOver, onVictory };

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const game = createGame({
      onHud: v => callbacks.current.onHud?.(v),
      onMessage: v => callbacks.current.onMessage?.(v),
      onGameOver: v => callbacks.current.onGameOver?.(v),
      onVictory: v => callbacks.current.onVictory?.(v),
    });
    game.start();

    // La dernière direction pressée l'emporte, comme sur NES
    let held = [];
    let attackQueued = false;

    const onKeyDown = e => {
      const key = e.key.toLowerCase();
      const dir = KEY_DIRS[key];
      if (dir || ATTACK_KEYS.has(key)) e.preventDefault();
      if (pausedRef.current) return;
      if (dir && !held.includes(dir)) held.push(dir);
      if (ATTACK_KEYS.has(key) && !e.repeat) attackQueued = true;
    };
    const onKeyUp = e => {
      const dir = KEY_DIRS[e.key.toLowerCase()];
      if (dir) held = held.filter(d => d !== dir);
    };
    const onBlur = () => { held = []; };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    let raf;
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) {
        const touch = controls.current;
        const input = {
          dir: held[held.length - 1] || touch.dir,
          attack: attackQueued || touch.attack,
        };
        attackQueued = false;
        touch.attack = false;
        game.update(dt, input);
      } else {
        held = [];
      }
      game.render(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [controls]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="block w-full h-auto rounded-md"
      style={{ imageRendering: 'pixelated', aspectRatio: `${W} / ${H}` }}
    />
  );
};

export default GameCanvas;
