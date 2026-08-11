import React from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const MediaCard = ({ item, type }) => {
  const imageUrl = item.poster_path || item.profile_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path || item.profile_path}`
    : 'https://via.placeholder.com/300x450?text=Not+Found';

  // TMDB renvoie 'media_type' dans les recherches multi, sinon on utilise 'type' passé en prop
  const mediaType = item.media_type || type || (item.title ? 'movie' : (item.name && item.known_for ? 'person' : 'tv'));
  const linkPath = `/cinetech-react/${mediaType === 'person' ? 'actors' : mediaType === 'tv' ? 'series' : 'movies'}/${item.id}`;

  return (
    <Link to={linkPath} className="glass rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 relative group cursor-pointer shadow-lg block">
      <img src={imageUrl} alt={item.title || item.name} className="w-full h-[350px] object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
        <h3 className="font-bold text-lg text-white">{item.title || item.name}</h3>
        {item.vote_average ? (
          <p className="text-yellow-400 font-bold flex items-center gap-1 mt-1">
            <Star fill="currentColor" size={16}/> {item.vote_average.toFixed(1)}
          </p>
        ) : null}
      </div>
    </Link>
  );
};

export default MediaCard;
