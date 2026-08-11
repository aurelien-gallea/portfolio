const BASE_URL = '/api';

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  // Si le backend renvoie du texte (erreur PHP), on catch
  try {
    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error("Erreur serveur PHP");
  }
};

export const authAPI = {
  login: (login, pass) => request('/login.php', { method: 'POST', body: JSON.stringify({ action: 'login', login, pass }) }),
  register: (data) => request('/login.php', { method: 'POST', body: JSON.stringify({ action: 'register', ...data }) }),
  me: () => request('/login.php', { method: 'POST', body: JSON.stringify({ action: 'me' }) }),
  logout: () => request('/login.php', { method: 'POST', body: JSON.stringify({ action: 'logout' }) })
};

export const favAPI = {
  list: () => request('/favorites.php', { method: 'POST', body: JSON.stringify({ action: 'list' }) }),
  add: (type, id) => request('/favorites.php', { method: 'POST', body: JSON.stringify({ action: 'add', type, id }) }),
  remove: (type, id) => request('/favorites.php', { method: 'POST', body: JSON.stringify({ action: 'remove', type, id }) }),
  check: (type, id) => request('/favorites.php', { method: 'POST', body: JSON.stringify({ action: 'check', type, id }) })
};
