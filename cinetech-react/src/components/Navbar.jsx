import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Tv, Users, Star, LogIn, Search } from 'lucide-react';

const Navbar = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <Link to="/" className="text-3xl font-bold tracking-tighter text-white">
          Cine<span className="text-blue-500">Tech</span>
        </Link>
        
        <form onSubmit={handleSearch} className="flex-1 max-w-md w-full relative">
          <input 
            type="text" 
            placeholder="Rechercher un film, une série..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-full py-2 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </form>

        <div className="flex gap-4 items-center text-gray-300 font-medium overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          <Link to="/movies" className="hover:text-blue-400 transition-colors flex items-center gap-2 whitespace-nowrap"><Film size={18}/> Films</Link>
          <Link to="/series" className="hover:text-blue-400 transition-colors flex items-center gap-2 whitespace-nowrap"><Tv size={18}/> Séries</Link>
          <Link to="/actors" className="hover:text-blue-400 transition-colors flex items-center gap-2 whitespace-nowrap"><Users size={18}/> Acteurs</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
