import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Tv, Users, Star, LogIn, Search, ArrowLeft } from 'lucide-react';

const Navbar = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cinetech-react/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 text-xs transition-all">
            <ArrowLeft size={14} /> Portfolio
          </Link>
          <Link to="/cinetech-react/" className="text-3xl font-bold tracking-tighter text-white">
            Cine<span className="text-blue-500">Tech</span>
          </Link>
        </div>
        
        <form onSubmit={handleSearch} className="flex-1 max-w-md w-full relative">
          <input 
            type="text" 
            placeholder="Rechercher un film, une série..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-full py-2 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </form>

        <div className="hidden md:flex gap-6 items-center text-gray-300 font-medium">
          <Link to="/cinetech-react/" className="hover:text-blue-400 transition-colors">Accueil</Link>
          <Link to="/cinetech-react/movies" className="hover:text-blue-400 transition-colors flex items-center gap-2 whitespace-nowrap"><Film size={18}/> Films</Link>
          <Link to="/cinetech-react/series" className="hover:text-blue-400 transition-colors flex items-center gap-2 whitespace-nowrap"><Tv size={18}/> Séries</Link>
          <Link to="/cinetech-react/actors" className="hover:text-blue-400 transition-colors flex items-center gap-2 whitespace-nowrap"><Users size={18}/> Acteurs</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
