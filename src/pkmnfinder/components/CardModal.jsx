import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Zap, Sparkles, Scale, Ruler } from 'lucide-react';
import PokemonCard from './PokemonCard';

const CardModal = ({ pokemon, onClose }) => {
  if (!pokemon) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="relative max-w-4xl w-full bg-[#121216] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row gap-8 overflow-hidden text-white"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full border border-white/10 transition-colors z-50 text-gray-300 hover:text-white"
          >
            <X size={20} />
          </button>

          {/* Left Column: Big Interactive Card */}
          <div className="w-full md:w-1/2 flex justify-center items-center">
            <PokemonCard pokemon={pokemon} />
          </div>

          {/* Right Column: Detailed Stats */}
          <div className="w-full md:w-1/2 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-yellow-400 font-mono text-sm font-bold bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  N°{pokemon.number.padStart(3, '0')}
                </span>
                <span className="text-gray-400 text-sm font-mono">{pokemon.classification}</span>
              </div>
              <h2 className="text-4xl font-extrabold text-white tracking-wide">{pokemon.name}</h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                <Zap className="text-yellow-400" size={24} />
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Combat Power Max</p>
                  <p className="text-xl font-bold text-yellow-300">{pokemon.maxCP} CP</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                <Shield className="text-red-400" size={24} />
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Points de Vie Max</p>
                  <p className="text-xl font-bold text-red-300">{pokemon.maxHP} PV</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                <Ruler className="text-blue-400" size={24} />
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Taille</p>
                  <p className="text-sm font-bold text-gray-200">{pokemon.taille?.minimum} - {pokemon.taille?.maximum}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                <Scale className="text-green-400" size={24} />
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Poids</p>
                  <p className="text-sm font-bold text-gray-200">{pokemon.poids?.minimum} - {pokemon.poids?.maximum}</p>
                </div>
              </div>
            </div>

            {/* Weaknesses & Resistances Detail */}
            <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div>
                <h4 className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Faiblesses</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(pokemon.Faiblesses) ? (
                    pokemon.Faiblesses.map(f => (
                      <span key={f} className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                        {f}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">{pokemon.Faiblesses}</span>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <h4 className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Résistances</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(pokemon.Résistances) ? (
                    pokemon.Résistances.map(r => (
                      <span key={r} className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">{pokemon.Résistances}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Close action */}
            <button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold py-3.5 rounded-xl transition-all shadow-lg text-center"
            >
              Fermer la carte
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CardModal;
