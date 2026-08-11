import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Film, Tv, Users, Star, LogIn, Loader2 } from 'lucide-react';
import { getTrendingMovies } from './api/tmdb';
import { authAPI } from './api/backend';

import MediaCard from './components/MediaCard';
import Navbar from './components/Navbar';

const Home = () => {
  const [movies, setMovies] = useState([]);
  
  useEffect(() => {
    getTrendingMovies().then(data => setMovies(data.results.slice(0, 10))).catch(e => console.error(e));
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-12 px-6 max-w-7xl mx-auto flex flex-col items-center">
      <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Bienvenue sur CineTech
      </h1>
      <p className="text-xl text-gray-400 max-w-2xl mb-16 text-center leading-relaxed">
        Votre catalogue ultime pour découvrir les derniers films, séries, et suivre vos acteurs préférés.
      </p>
      
      <div className="w-full">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Film className="text-blue-500" /> Films Tendance
        </h2>
        {movies.length === 0 ? (
          <div className="flex justify-center my-20">
            <Loader2 className="animate-spin text-blue-500" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
            {movies.map(movie => <MediaCard key={movie.id} item={movie} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const Auth = () => {
  return (
    <div className="min-h-screen pt-32 flex justify-center px-4">
      <div className="glass p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-center">Connexion</h2>
        <form className="flex flex-col gap-4">
          <input type="text" placeholder="Identifiant" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-colors" />
          <input type="password" placeholder="Mot de passe" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-colors" />
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-2 shadow-lg shadow-blue-500/20">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

import Movies from './pages/Movies';
import Series from './pages/Series';
import Actors from './pages/Actors';
import Search from './pages/Search';
import MediaDetails from './pages/MediaDetails';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Tenter de récupérer la session au démarrage
    authAPI.me()
      .then(res => { if (res.success) setUser(res.user); })
      .catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500 selection:text-white">
        <Navbar user={user} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MediaDetails type="movie" />} />
          <Route path="/series" element={<Series />} />
          <Route path="/series/:id" element={<MediaDetails type="tv" />} />
          <Route path="/actors" element={<Actors />} />
          <Route path="/actors/:id" element={<MediaDetails type="person" />} />
          <Route path="/search" element={<Search />} />
          <Route path="/favorites" element={<div className="pt-32 text-center text-xl text-gray-400">Favoris en construction...</div>} />
          <Route path="/login" element={<Auth />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
