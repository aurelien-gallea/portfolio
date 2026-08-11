import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMediaDetails } from '../api/tmdb';
import { Loader2, Star, ArrowLeft } from 'lucide-react';
import MediaCard from '../components/MediaCard';

const MediaDetails = ({ type }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMediaDetails(type, id)
      .then(data => {
        setDetails(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type, id]);

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center">
      <Loader2 className="animate-spin text-blue-500" size={60} />
    </div>
  );

  if (!details) return (
    <div className="min-h-screen flex justify-center items-center">
      <p className="text-xl text-gray-400">Introuvable.</p>
    </div>
  );

  const imageUrl = details.poster_path || details.profile_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path || details.profile_path}`
    : 'https://via.placeholder.com/500x750?text=Not+Found';

  const title = details.title || details.name;

  const trailer = details.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer');
  const filmography = details.combined_credits?.cast?.sort((a, b) => b.popularity - a.popularity) || [];
  const cast = details.credits?.cast || [];

  return (
    <div className="min-h-screen pt-32 pb-12 px-6 max-w-7xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} /> Retour
      </button>

      <div className="flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/3 flex-shrink-0">
          <img src={imageUrl} alt={title} className="w-full rounded-2xl shadow-2xl border border-white/10" />
        </div>
        
        <div className="w-full md:w-2/3">
          <h1 className="text-5xl font-bold mb-4">{title}</h1>
          
          {details.tagline && <p className="text-xl text-blue-400 italic mb-6">"{details.tagline}"</p>}
          
          {details.vote_average ? (
            <div className="flex items-center gap-2 mb-6 bg-white/10 inline-flex px-4 py-2 rounded-full border border-white/10">
              <Star className="text-yellow-400" fill="currentColor" size={24}/>
              <span className="text-2xl font-bold">{details.vote_average.toFixed(1)}</span>
              <span className="text-gray-400">/ 10</span>
            </div>
          ) : null}

          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 border-b border-white/10 pb-2 inline-block">Synopsis</h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              {details.overview || details.biography || "Aucune description disponible pour le moment."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {details.genres && details.genres.map(g => (
              <span key={g.id} className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full border border-blue-500/30">
                {g.name}
              </span>
            ))}
          </div>

          {trailer && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold mb-4 border-b border-white/10 pb-2 inline-block">Bande-annonce</h3>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>

      {type === 'person' && filmography.length > 0 && (
        <div className="mt-16 w-full">
          <h3 className="text-3xl font-bold mb-6 border-b border-white/10 pb-3 inline-block">Filmographie</h3>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x thick-scrollbar">
            {filmography.slice(0, 20).map((item, index) => (
              <div key={`${item.id}-${index}`} className="min-w-[180px] max-w-[180px] snap-start">
                <MediaCard item={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(type === 'movie' || type === 'tv') && cast.length > 0 && (
        <div className="mt-16 w-full">
          <h3 className="text-3xl font-bold mb-6 border-b border-white/10 pb-3 inline-block">Distribution</h3>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x thick-scrollbar">
            {cast.slice(0, 20).map((item, index) => (
              <div key={`${item.id}-${index}`} className="min-w-[180px] max-w-[180px] snap-start">
                <MediaCard item={item} type="person" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaDetails;
