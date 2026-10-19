// Logique du signal : portage de scalper.py (même indicateurs, mêmes seuils).
// Les bougies sont des objets { time: Date, open, high, low, close, volume }.

export const TICKER = 'QQQ';
export const SEUIL = 3;
export const LEVIER = 3;
export const GROSSES_CAPIS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META',
  'AVGO', 'TSLA', 'NFLX', 'COST'];
const MIN_ECHANTILLON = 40;

// ---------- indicateurs ----------

export function ema(valeurs, n) {
  const k = 2 / (n + 1);
  const out = [];
  valeurs.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
}

function rsi(valeurs, n = 14) {
  let gain = null, perte = null;
  for (let i = 1; i < valeurs.length; i++) {
    const d = valeurs[i] - valeurs[i - 1];
    const g = Math.max(d, 0), p = Math.max(-d, 0);
    gain = gain === null ? g : gain + (g - gain) / n;
    perte = perte === null ? p : perte + (p - perte) / n;
  }
  return 100 - 100 / (1 + gain / perte);
}

// Volatilité moyenne (ATR de Wilder). memeJour : ignore le gap de nuit dans le calcul.
function atr(bougies, n = 14, memeJour = false) {
  let moy = null;
  bougies.forEach((b, i) => {
    const prec = bougies[i - 1];
    const pc = prec && (!memeJour || jourNY(prec.time) === jourNY(b.time)) ? prec.close : null;
    const tr = pc == null ? b.high - b.low
      : Math.max(b.high - b.low, Math.abs(b.high - pc), Math.abs(b.low - pc));
    moy = moy === null ? tr : moy + (tr - moy) / n;
  });
  return moy;
}

// Niveaux de sortie : multiples de l'ATR autour du prix actuel
export const HORIZONS = [
  { id: 'scalping', nom: 'Scalping (ATR 5 min)', stop: 1.5, obj1: 1.5, obj2: 3 },
  { id: 'journee', nom: 'Journée (ATR journalier)', stop: 0.5, obj1: 0.5, obj2: 1 },
];

function niveauxSortie(prix, atr5, atrJour) {
  return HORIZONS.map(h => {
    const a = h.id === 'scalping' ? atr5 : atrJour;
    return {
      ...h, atr: a,
      long: { obj1: prix + h.obj1 * a, obj2: prix + h.obj2 * a, stop: prix - h.stop * a },
      short: { obj1: prix - h.obj1 * a, obj2: prix - h.obj2 * a, stop: prix + h.stop * a },
    };
  });
}

export function vwapCumule(bougies) {
  let pv = 0, vol = 0;
  return bougies.map(b => {
    pv += ((b.high + b.low + b.close) / 3) * b.volume;
    vol += b.volume;
    return vol ? pv / vol : b.close;
  });
}

const derniere = t => t[t.length - 1];
// Date de séance (heure de New York) au format AAAA-MM-JJ
export const jourNY = d => d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

// ---------- pourcentages ----------

function perf(clotures, nSeances, levier = 1) {
  const serie = clotures.slice(-(nSeances + 1));
  if (serie.length < 2) return null;
  let total = 1;
  for (let i = 1; i < serie.length; i++) total *= 1 + (serie[i] / serie[i - 1] - 1) * levier;
  return (total - 1) * 100;
}

// ---------- nuit ----------

function regime(close, e20, e50) {
  if (close > e50 && e20 > e50) return 'haussier';
  if (close < e50 && e20 < e50) return 'baissier';
  return 'mixte';
}

function resumeGaps(gaps) {
  const part = f => (gaps.filter(f).length / gaps.length) * 100;
  return {
    n: gaps.length,
    hausse: part(g => g > 0),
    moyenne: gaps.reduce((a, b) => a + b, 0) / gaps.length,
    chute1: part(g => g < -1),
    envol1: part(g => g > 1),
    pire: Math.min(...gaps),
    meilleur: Math.max(...gaps),
  };
}

function statsNuit(jour, cloturesLive, dateSeance, prix, publications, aVenir) {
  const c = jour.map(b => b.close);
  const e20 = ema(c, 20), e50 = ema(c, 50);
  const hist = [];
  for (let i = 50; i < jour.length - 1; i++) {
    const jours = (jour[i + 1].time - jour[i].time) / 86400000;
    hist.push({
      gap: (jour[i + 1].open / c[i] - 1) * 100,
      regime: regime(c[i], e20[i], e50[i]),
      haut: c[i] > c[i - 1],
      longue: jours > 1.5, // week-end / jour férié
    });
  }

  const reg = regime(prix, derniere(ema(cloturesLive, 20)), derniere(ema(cloturesLive, 50)));
  const haut = prix > cloturesLive[cloturesLive.length - 2];
  const longue = new Date(dateSeance + 'T12:00:00Z').getUTCDay() === 5;
  const sens = haut ? 'hausse' : 'baisse';

  // Situations similaires : on relâche les critères si l'échantillon est trop petit
  const criteres = [
    [h => h.regime === reg && h.haut === haut && h.longue === longue,
      `tendance ${reg}, séance en ${sens}${longue ? ', veille de week-end' : ''}`],
    [h => h.regime === reg && h.haut === haut, `tendance ${reg}, séance en ${sens}`],
    [h => h.regime === reg, `tendance ${reg}`],
  ];
  let similaires, situation;
  for (const [filtre, description] of criteres) {
    situation = description;
    similaires = hist.filter(filtre).map(h => h.gap);
    if (similaires.length >= MIN_ECHANTILLON) break;
  }

  const tout = resumeGaps(hist.map(h => h.gap));
  const sim = resumeGaps(similaires);
  const risques = [];
  if (publications.length) risques.push('Résultats cette nuit : ' + publications.join(', '));
  if (aVenir.length) risques.push('Résultats à venir : ' + aVenir.join(', '));
  if (longue) risques.push('Week-end : 2 nuits de risque, gap plus large');

  let verdict, sensVerdict;
  if (publications.length) {
    [verdict, sensVerdict] = ["SORTIR avant la clôture (résultats d'une grosse capi)", 0];
  } else if (sim.moyenne > 0.05 && sim.hausse >= 55 && reg === 'haussier') {
    [verdict, sensVerdict] = ['GARDER 3QQQ possible', 1];
  } else if (sim.moyenne < -0.05 && sim.hausse <= 45 && reg === 'baissier') {
    [verdict, sensVerdict] = ['GARDER 3QSS possible', -1];
  } else {
    [verdict, sensVerdict] = ["SORTIR : pas d'avantage statistique la nuit", 0];
  }
  if (sensVerdict && longue) verdict += ' (taille réduite, week-end)';

  return { verdict, sens: sensVerdict, risques, situation, tout, sim, gapsSim: similaires };
}

// ---------- signal ----------

/**
 * jour : bougies journalières (5 ans), intra : bougies 5 min (plusieurs séances),
 * prixLive : dernier prix (temps réel) ou null, resultats : [{symbol, date, hour}].
 */
export function analyser({ jour, intra, prixLive, resultats }) {
  const prix = prixLive ?? derniere(intra).close;
  const dateSeance = jourNY(derniere(intra).time);
  const intraJour = intra.filter(b => jourNY(b.time) === dateSeance);
  const c = intra.map(b => b.close);
  c[c.length - 1] = prix;

  const jourAvant = jour.filter(b => jourNY(b.time) < dateSeance);
  const cloturesLive = [...jourAvant.map(b => b.close), prix];

  const raisons = [];
  let score = 0;
  const vote = (haut, bas, texteHaut, texteBas) => {
    if (haut) { score++; raisons.push({ sens: 1, texte: texteHaut }); }
    else if (bas) { score--; raisons.push({ sens: -1, texte: texteBas }); }
  };

  // Tendance de fond (journalier)
  const ema50j = derniere(ema(cloturesLive, 50));
  const ema20j = derniere(ema(cloturesLive, 20));
  vote(prix > ema50j, prix < ema50j,
    'Prix au-dessus de la moyenne 50 jours', 'Prix sous la moyenne 50 jours');
  vote(ema20j > ema50j, ema20j < ema50j,
    'Moyenne 20 j > moyenne 50 j (tendance haussière)',
    'Moyenne 20 j < moyenne 50 j (tendance baissière)');

  // Momentum intraday (bougies 5 min)
  const e9 = derniere(ema(c, 9)), e21 = derniere(ema(c, 21));
  vote(e9 > e21, e9 < e21, 'EMA 9 > EMA 21 en 5 min', 'EMA 9 < EMA 21 en 5 min');

  const vw = derniere(vwapCumule(intraJour));
  vote(prix > vw, prix < vw,
    `Prix au-dessus du VWAP du jour (${vw.toFixed(2)})`,
    `Prix sous le VWAP du jour (${vw.toFixed(2)})`);

  const e12 = ema(c, 12), e26 = ema(c, 26);
  const macd = e12.map((v, i) => v - e26[i]);
  const hist = derniere(macd) - derniere(ema(macd, 9));
  vote(hist > 0, hist < 0, 'MACD 5 min positif', 'MACD 5 min négatif');

  const r = rsi(c);
  vote(r > 55 && r < 75, r > 25 && r < 45,
    `RSI 5 min haussier (${r.toFixed(0)})`, `RSI 5 min baissier (${r.toFixed(0)})`);
  // Excès : on pénalise le sens du mouvement (risque de retournement)
  vote(r <= 25, r >= 75,
    `RSI survendu (${r.toFixed(0)}) : rebond possible`,
    `RSI suracheté (${r.toFixed(0)}) : repli possible`);

  let decision;
  if (score >= SEUIL) decision = 'ACHETER 3QQQ (long)';
  else if (score <= -SEUIL) decision = 'VENDRE 3QQQ → ACHETER 3QSS (short)';
  else decision = 'NEUTRE : ne rien faire / rester cash';

  // Pourcentages
  // Séances de l'année + celle en cours : on part de la dernière clôture de l'an passé
  const nYtd = jourAvant.filter(b => b.time.getUTCFullYear() === Number(dateSeance.slice(0, 4))).length + 1;
  const perfs = [['Jour', 1], ['5 jours', 5], ['1 mois', 21], ['3 mois', 63],
    ['Depuis 1er janv.', nYtd]].map(([nom, n]) => ({
    nom,
    qqq: perf(cloturesLive, n),
    long: perf(cloturesLive, n, LEVIER),
    short: perf(cloturesLive, n, -LEVIER),
  }));
  const hautJ = Math.max(...intraJour.map(b => b.high), prix);
  const basJ = Math.min(...intraJour.map(b => b.low), prix);
  const autres = [
    ['Plus haut du jour', hautJ.toFixed(2), null],
    ['Plus bas du jour', basJ.toFixed(2), null],
    ['Amplitude du jour', ((hautJ - basJ) / basJ * 100).toFixed(2) + ' %', null],
    ['Écart au VWAP', null, (prix / vw - 1) * 100],
    ['Écart à la moy. 50 j', null, (prix / ema50j - 1) * 100],
  ];

  // Publications de résultats : ce soir après clôture ou demain avant ouverture
  const demain = prochainJourOuvre(dateSeance);
  const limite = [1, 2, 3, 4, 5].reduce(d => prochainJourOuvre(d), dateSeance);
  const fmt = d => d.slice(8, 10) + '/' + d.slice(5, 7);
  const publications = [], aVenir = [];
  for (const e of resultats) {
    if (!GROSSES_CAPIS.includes(e.symbol)) continue;
    if ((e.date === dateSeance && e.hour === 'amc') || (e.date === demain && e.hour === 'bmo')) {
      publications.push(`${e.symbol} ${e.hour === 'amc' ? 'ce soir' : 'demain matin'}`);
    } else if (e.date >= dateSeance && e.date <= limite) {
      const moment = e.hour === 'amc' ? 'après clôture' : e.hour === 'bmo' ? 'avant ouverture' : '';
      aVenir.push(`${e.symbol} ${fmt(e.date)} ${moment}`.trim());
    }
  }

  const sorties = niveauxSortie(prix, atr(intra, 14, true), atr(jourAvant.slice(-100)));

  return {
    decision, score, prix, raisons, perfs, autres, dateSeance, intraJour, sorties,
    nuit: statsNuit(jour, cloturesLive, dateSeance, prix, publications, aVenir),
  };
}

function prochainJourOuvre(date) {
  const d = new Date(date + 'T12:00:00Z');
  do d.setUTCDate(d.getUTCDate() + 1); while ([0, 6].includes(d.getUTCDay()));
  return d.toISOString().slice(0, 10);
}
