import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import PokemonCard from './components/PokemonCard';
import CardModal from './components/CardModal';
import pokemonData from './data/pkmn.json';
import { ArrowUpDown, Sparkles, Filter } from 'lucide-react';

const ALL_TYPES = [
  'Tous', 'Plante', 'Poison', 'Feu', 'Eau', 'Vol', 'Insecte', 
  'Normal', 'Electrique', 'Sol', 'Fée', 'Combat', 'Psy', 
  'Roche', 'Spectre', 'Glace', 'Dragon'
];

const PkmnApp = () => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Tous');
  const [sortBy, setSortBy] = useState('number'); // number, name, maxHP, maxCP
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  const filteredPokemon = useMemo(() => {
    return pokemonData.filter(pkmn => {
      // Search Filter
      const matchesSearch = search.trim() === '' || 
        pkmn.name.toLowerCase().includes(search.toLowerCase()) || 
        pkmn.number === search.trim() ||
        pkmn.number.padStart(3, '0').includes(search.trim());

      // Type Filter
      const matchesType = selectedType === 'Tous' || pkmn.types?.includes(selectedType);

      return matchesSearch && matchesType;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'maxHP') return b.maxHP - a.maxHP;
      if (sortBy === 'maxCP') return b.maxCP - a.maxCP;
      return parseInt(a.number) - parseInt(b.number);
    });
  }, [search, selectedType, sortBy]);

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white selection:bg-yellow-400 selection:text-black pt-28 pb-16 px-4 md:px-8">
      {/* Header Navigation */}
      <Navbar search={search} setSearch={setSearch} />

      <div className="max-w-[1500px] mx-auto space-y-8">
        
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-500/20 via-amber-600/10 to-purple-900/30 p-8 border border-yellow-500/20 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-semibold">
              <Sparkles size={14} /> Pokémon TCG Collection Gen 1
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Collectionnez les 151 Pokémon
            </h2>
            <p className="text-gray-400 max-w-xl text-sm md:text-base">
              Survolez les cartes pour observer l'effet holographique 3D. Cliquez sur une carte pour inspecter les caractéristiques complètes du Pokémon.
            </p>
          </div>
          <div className="text-right font-mono text-xs text-yellow-300/80 bg-black/40 px-4 py-3 rounded-2xl border border-white/10 z-10">
            <div>Total Cartes : <span className="font-bold text-yellow-400 text-sm">{filteredPokemon.length}</span> / 151</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          
          {/* Type Filter Pills (wrapping so all 17 types fit on screen) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold mr-1">
              <Filter size={16} /> Types:
            </div>
            {ALL_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedType === t 
                    ? 'bg-yellow-400 text-black border-yellow-300 shadow-md shadow-yellow-500/20' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <ArrowUpDown size={16} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-semibold">Trier par:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/60 border border-white/10 text-xs font-bold text-yellow-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-yellow-400 cursor-pointer"
            >
              <option value="number">N° Pokédex</option>
              <option value="maxCP">CP Max</option>
              <option value="maxHP">PV Max</option>
              <option value="name">Nom (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Cards Grid */}
        {filteredPokemon.length === 0 ? (
          <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-xl text-gray-400 font-semibold">Aucun Pokémon ne correspond à votre recherche.</p>
            <button 
              onClick={() => { setSearch(''); setSelectedType('Tous'); }}
              className="mt-4 px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl text-sm hover:bg-yellow-300 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
            {filteredPokemon.map(pokemon => (
              <PokemonCard 
                key={pokemon.id} 
                pokemon={pokemon} 
                onClick={setSelectedPokemon} 
              />
            ))}
          </div>
        )}

      </div>

      {/* Detail Modal */}
      {selectedPokemon && (
        <CardModal 
          pokemon={selectedPokemon} 
          onClose={() => setSelectedPokemon(null)} 
        />
      )}
    </div>
  );
};

export default PkmnApp;
