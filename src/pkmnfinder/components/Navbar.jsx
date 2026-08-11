import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Sparkles } from 'lucide-react';

const Navbar = ({ search, setSearch }) => {
  return (
    <nav className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-xl border-b border-yellow-500/20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Back Link & Brand Logo */}
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 text-xs transition-all"
          >
            <ArrowLeft size={14} /> Portfolio
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={24} />
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Pkmn<span className="text-yellow-400">Finder</span>
              <span className="ml-2 text-xs font-normal text-yellow-300/70 border border-yellow-400/30 px-2 py-0.5 rounded-md bg-yellow-400/10">
                TCG Edition
              </span>
            </h1>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Rechercher par nom ou n° Pokédex..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-full py-2 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
