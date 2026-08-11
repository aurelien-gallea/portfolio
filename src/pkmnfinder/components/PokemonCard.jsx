import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Flame, Droplet, Leaf, Eye, Skull, Crosshair, Feather, Bug, Mountain, Sparkles } from 'lucide-react';

const typeColors = {
  Plante: { bg: 'from-green-600 to-emerald-800', border: 'border-green-400', badge: 'bg-green-600 text-white', icon: Leaf },
  Poison: { bg: 'from-purple-700 to-fuchsia-900', border: 'border-purple-400', badge: 'bg-purple-700 text-white', icon: Skull },
  Feu: { bg: 'from-red-600 to-amber-700', border: 'border-orange-400', badge: 'bg-red-600 text-white', icon: Flame },
  Eau: { bg: 'from-blue-600 to-cyan-800', border: 'border-blue-400', badge: 'bg-blue-600 text-white', icon: Droplet },
  Vol: { bg: 'from-sky-400 to-indigo-600', border: 'border-sky-300', badge: 'bg-sky-500 text-white', icon: Feather },
  Insecte: { bg: 'from-lime-600 to-green-800', border: 'border-lime-400', badge: 'bg-lime-600 text-white', icon: Bug },
  Normal: { bg: 'from-stone-500 to-neutral-700', border: 'border-stone-300', badge: 'bg-stone-500 text-white', icon: Shield },
  Electrique: { bg: 'from-yellow-400 to-amber-600', border: 'border-yellow-300', badge: 'bg-yellow-500 text-black', icon: Zap },
  Sol: { bg: 'from-amber-700 to-yellow-900', border: 'border-amber-500', badge: 'bg-amber-700 text-white', icon: Mountain },
  Fée: { bg: 'from-pink-400 to-rose-600', border: 'border-pink-300', badge: 'bg-pink-500 text-white', icon: Sparkles },
  Combat: { bg: 'from-red-800 to-amber-900', border: 'border-red-600', badge: 'bg-red-800 text-white', icon: Crosshair },
  Psy: { bg: 'from-pink-600 to-purple-800', border: 'border-pink-400', badge: 'bg-pink-600 text-white', icon: Eye },
  Roche: { bg: 'from-yellow-800 to-stone-900', border: 'border-yellow-600', badge: 'bg-amber-800 text-white', icon: Mountain },
  Spectre: { bg: 'from-indigo-900 to-purple-950', border: 'border-indigo-500', badge: 'bg-indigo-900 text-white', icon: Eye },
  Glace: { bg: 'from-cyan-400 to-blue-600', border: 'border-cyan-200', badge: 'bg-cyan-500 text-black', icon: Droplet },
  Dragon: { bg: 'from-indigo-700 to-blue-900', border: 'border-indigo-400', badge: 'bg-indigo-700 text-white', icon: Shield },
};

const PokemonCard = ({ pokemon, onClick }) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const mainType = pokemon.types?.[0] || 'Normal';
  const theme = typeColors[mainType] || typeColors.Normal;
  const TypeIcon = theme.icon || Shield;

  const handleMouseMove = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - card.left;
    const y = e.clientY - card.top;
    const centerX = card.width / 2;
    const centerY = card.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / card.width) * 100,
      y: (y / card.height) * 100,
      opacity: 0.4
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <motion.div
      onClick={() => onClick && onClick(pokemon)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: rotate.x, rotateY: rotate.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformStyle: 'preserve-3d' }}
      className="relative w-full max-w-[300px] aspect-[2.5/3.8] rounded-2xl p-3 bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 shadow-2xl border-2 border-yellow-200/60 cursor-pointer group select-none hover:shadow-amber-500/20"
    >
      {/* Dynamic Holographic Glare Effect */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, rgba(255,215,0,0.3) 25%, transparent 60%)`,
          opacity: glare.opacity,
          mixBlendMode: 'overlay'
        }}
      />

      {/* Inner TCG Card Body */}
      <div className={`w-full h-full rounded-xl p-3 bg-gradient-to-b ${theme.bg} flex flex-col justify-between border-2 ${theme.border} shadow-inner relative overflow-hidden text-white`}>
        
        {/* Card Header (Name & HP) */}
        <div className="flex justify-between items-center bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-yellow-300 tracking-wider">N°{pokemon.number.padStart(3, '0')}</span>
            <h3 className="font-extrabold text-base tracking-wide drop-shadow">{pokemon.name}</h3>
          </div>
          <div className="flex items-center gap-1 text-red-400 font-extrabold text-sm">
            <span className="text-[10px] text-gray-300">PV</span>
            <span>{pokemon.maxHP}</span>
          </div>
        </div>

        {/* Artwork Window */}
        <div className="relative my-2 w-full h-[180px] rounded-lg bg-gradient-to-b from-black/60 to-black/30 border-2 border-yellow-400/50 overflow-hidden flex items-center justify-center shadow-inner group-hover:border-yellow-300 transition-colors">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/40" />
          <img 
            src={pokemon.image} 
            alt={pokemon.name}
            className="w-[85%] h-[85%] object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform duration-300 z-10"
            loading="lazy"
          />
          <div className="absolute bottom-1 right-2 text-[10px] text-gray-400 font-mono italic">
            {pokemon.classification}
          </div>
        </div>

        {/* Types & CP Badges */}
        <div className="flex justify-between items-center my-1">
          <div className="flex gap-1.5">
            {pokemon.types?.map(t => {
              const tStyle = typeColors[t] || typeColors.Normal;
              const Icon = tStyle.icon || Shield;
              return (
                <span key={t} className={`${tStyle.badge} text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20 shadow`}>
                  <Icon size={10} /> {t}
                </span>
              );
            })}
          </div>
          <div className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full">
            CP {pokemon.maxCP}
          </div>
        </div>

        {/* Weakness / Resistance Section */}
        <div className="bg-black/40 rounded-lg p-2 text-[10px] border border-white/10 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-semibold">Faiblesses:</span>
            <span className="text-red-300 font-bold truncate max-w-[150px]">
              {Array.isArray(pokemon.Faiblesses) ? pokemon.Faiblesses.join(', ') : pokemon.Faiblesses || 'Aucune'}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-white/5 pt-1">
            <span className="text-gray-400 font-semibold">Résistances:</span>
            <span className="text-green-300 font-bold truncate max-w-[150px]">
              {Array.isArray(pokemon.Résistances) ? pokemon.Résistances.join(', ') : pokemon.Résistances || 'Aucune'}
            </span>
          </div>
        </div>

        {/* Card Footer Details */}
        <div className="flex justify-between text-[9px] text-gray-300 font-mono pt-1">
          <span>Taille: {pokemon.taille?.maximum || '-'}</span>
          <span>Poids: {pokemon.poids?.maximum || '-'}</span>
        </div>

      </div>
    </motion.div>
  );
};

export default PokemonCard;
