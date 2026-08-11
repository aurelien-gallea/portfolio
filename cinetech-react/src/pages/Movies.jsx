import React, { useEffect, useState } from 'react';
import { getPopularMovies } from '../api/tmdb';
import MediaCard from '../components/MediaCard';
import { Loader2 } from 'lucide-react';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPopularMovies(page).then(data => {
      setMovies(prev => page === 1 ? data.results : [...prev, ...data.results]);
      setLoading(false);
    });
  }, [page]);

  return (
    <div className="min-h-screen pt-32 pb-12 px-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-blue-500">Films Populaires</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {movies.map(movie => <MediaCard key={movie.id} item={movie} type="movie" />)}
      </div>

      {loading && (
        <div className="flex justify-center my-8">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      )}

      {!loading && (
        <div className="flex justify-center mt-12">
          <button 
            onClick={() => setPage(p => p + 1)}
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full transition-colors border border-white/10"
          >
            Voir plus
          </button>
        </div>
      )}
    </div>
  );
};

export default Movies;
