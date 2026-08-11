import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMedia } from '../api/tmdb';
import MediaCard from '../components/MediaCard';
import { Loader2 } from 'lucide-react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
    setResults([]);
  }, [query]);

  useEffect(() => {
    if (!query) return;
    
    setLoading(true);
    searchMedia(query, page).then(data => {
      // Filtrer les résultats pour n'afficher que les films, séries, et acteurs (parfois la recherche multi ramène d'autres types)
      const validResults = data.results.filter(r => ['movie', 'tv', 'person'].includes(r.media_type));
      setResults(prev => page === 1 ? validResults : [...prev, ...validResults]);
      setLoading(false);
    });
  }, [query, page]);

  return (
    <div className="min-h-screen pt-32 pb-12 px-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-blue-500">
        Résultats pour : <span className="text-white">"{query}"</span>
      </h1>
      
      {results.length === 0 && !loading ? (
        <p className="text-xl text-gray-400">Aucun résultat trouvé.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {results.map(item => <MediaCard key={item.id} item={item} />)}
        </div>
      )}

      {loading && (
        <div className="flex justify-center my-8">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      )}

      {!loading && results.length > 0 && (
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

export default Search;
