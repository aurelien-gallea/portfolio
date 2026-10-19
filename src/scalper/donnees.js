// Accès aux données de marché, directement depuis le navigateur.
// Twelve Data : bougies 5 min et journalières (temps réel US, offre gratuite 8 req/min).
// Finnhub : dernier prix, statut du marché, calendrier des résultats (offre gratuite).
// Les clés sont saisies sur la page et gardées dans le navigateur (jamais dans le code).

import { TICKER } from './analyse';

const CLE_STOCKAGE = 'sn-cles';

export function lireCles() {
  try {
    return JSON.parse(localStorage.getItem(CLE_STOCKAGE)) || {};
  } catch {
    return {};
  }
}

export function enregistrerCles(cles) {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(cles));
  } catch { /* navigateur privé : les clés resteront le temps de la page */ }
}

async function lireJson(url, source) {
  const rep = await fetch(url);
  const json = await rep.json().catch(() => null);
  if (!rep.ok || !json || json.status === 'error') {
    throw new Error(`${source} : ${json?.message || json?.error || rep.status}`);
  }
  return json;
}

async function bougies(intervalle, taille, cle) {
  const url = `https://api.twelvedata.com/time_series?symbol=${TICKER}&interval=${intervalle}`
    + `&outputsize=${taille}&timezone=UTC&order=asc&apikey=${encodeURIComponent(cle)}`;
  const json = await lireJson(url, 'Twelve Data');
  const journalier = intervalle === '1day';
  return json.values.map(v => ({
    // Bougie journalière : midi UTC pour rester sur la bonne date à New York
    time: new Date(v.datetime.replace(' ', 'T') + (journalier ? 'T12:00:00Z' : 'Z')),
    open: +v.open, high: +v.high, low: +v.low, close: +v.close, volume: +v.volume || 0,
  }));
}

// Le journalier et les résultats ne changent pas dans la journée : un appel par jour
const cache = {};
async function uneFoisParJour(nom, charger) {
  const jour = new Date().toISOString().slice(0, 10);
  if (cache[nom]?.jour !== jour) cache[nom] = { jour, promesse: charger() };
  try {
    return await cache[nom].promesse;
  } catch (e) {
    delete cache[nom];
    throw e;
  }
}

async function finnhub(chemin, cle) {
  return lireJson(`https://finnhub.io/api/v1/${chemin}&token=${encodeURIComponent(cle)}`, 'Finnhub');
}

function dansNJours(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Tout ce dont l'analyse a besoin. Finnhub est facultatif. */
export async function chargerTout({ twelve, finnhub: cleFinnhub }) {
  const [jour, intra, extra] = await Promise.all([
    uneFoisParJour('jour', () => bougies('1day', 1300, twelve)),
    bougies('5min', 500, twelve),
    cleFinnhub ? Promise.all([
      finnhub(`quote?symbol=${TICKER}`, cleFinnhub),
      finnhub('stock/market-status?exchange=US', cleFinnhub),
      uneFoisParJour('resultats', () =>
        finnhub(`calendar/earnings?from=${dansNJours(-1)}&to=${dansNJours(10)}`, cleFinnhub)),
    ]) : null,
  ]);

  if (!extra) return { jour, intra, prixLive: null, marcheOuvert: null, resultats: [] };
  const [quote, statut, cal] = extra;
  return {
    jour, intra,
    prixLive: quote.c || null,
    marcheOuvert: statut.isOpen,
    resultats: cal.earningsCalendar || [],
  };
}
