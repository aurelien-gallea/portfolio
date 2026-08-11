const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "d586aa0bc4f382a532db7a1e7707f77e";
const BASE_URL = "https://api.themoviedb.org/3";

export const fetchTMDB = async (endpoint, params = {}) => {
  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'fr-FR',
    ...params
  }).toString();

  const response = await fetch(`${BASE_URL}${endpoint}?${query}`);
  if (!response.ok) throw new Error("Erreur TMDB API");
  return response.json();
};

export const getTrendingMovies = (page = 1) => fetchTMDB('/trending/movie/week', { page });
export const getTrendingSeries = (page = 1) => fetchTMDB('/trending/tv/week', { page });
export const getPopularMovies = (page = 1) => fetchTMDB('/movie/popular', { page });
export const getPopularSeries = (page = 1) => fetchTMDB('/tv/popular', { page });
export const getPopularActors = (page = 1) => fetchTMDB('/person/popular', { page });
export const searchMedia = (query, page = 1) => fetchTMDB('/search/multi', { query, page });
export const getMediaDetails = (type, id) => fetchTMDB(`/${type}/${id}`, { append_to_response: 'videos,combined_credits,credits' });
