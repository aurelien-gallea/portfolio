// Catégorisation automatique des opérations « Autre » par similarité sémantique,
// entièrement dans le navigateur
import { PROTOTYPES } from './prototypes';
import { nettoyer, meilleureCategorie } from './classement';
import { CATEGORIES } from '../donnees';

const ECART_MIN = 0.01; // en dessous, le modèle hésite : on laisse « Autre »
const AUTRES = { depense: 'autre', revenu: 'autre-revenu' };

let worker = null;
let compteur = 0;
const enAttente = new Map();
const cache = new Map(); // texte -> vecteur
let suiviProgression = null;

function obtenirWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./embeddings.worker.js', import.meta.url), { type: 'module' });
  const fichiers = {};
  worker.onmessage = ({ data }) => {
    if (data.type === 'progression') {
      if (data.status === 'progress' && data.total) fichiers[data.file] = [data.loaded, data.total];
      const [charge, total] = Object.values(fichiers).reduce(([a, b], [c, d]) => [a + c, b + d], [0, 0]);
      suiviProgression?.(total ? charge / total : 0, total);
      return;
    }
    const { resolve, reject } = enAttente.get(data.id);
    enAttente.delete(data.id);
    data.type === 'erreur' ? reject(new Error(data.message)) : resolve(data.vecteurs);
  };
  return worker;
}

async function vectoriser(textes) {
  const manquants = [...new Set(textes.filter((t) => !cache.has(t)))];
  if (manquants.length) {
    const id = ++compteur;
    const vecteurs = await new Promise((resolve, reject) => {
      enAttente.set(id, { resolve, reject });
      obtenirWorker().postMessage({ id, textes: manquants });
    });
    manquants.forEach((t, i) => cache.set(t, vecteurs[i]));
  }
  return textes.map((t) => cache.get(t));
}

// Renvoie les propositions [{ transaction, categorie, confiance }] sans rien modifier
export async function proposerCategories(transactions, onProgression) {
  suiviProgression = onProgression;
  const propositions = [];

  for (const type of ['depense', 'revenu']) {
    const permises = new Set(CATEGORIES[type].map((c) => c.id));
    const candidates = transactions.filter((t) => t.type === type && t.categorie === AUTRES[type]);
    if (candidates.length === 0) continue;

    // Exemples : descriptions types + opérations déjà classées par l'utilisateur
    // (un libellé déjà vu ressort naturellement avec une similarité proche de 1)
    const exemples = [];
    for (const [categorie, phrases] of Object.entries(PROTOTYPES)) {
      if (permises.has(categorie)) phrases.forEach((texte) => exemples.push({ categorie, texte }));
    }
    const vus = new Set();
    for (const t of transactions) {
      const texte = nettoyer(t.libelle);
      if (t.type !== type || t.categorie === AUTRES[type] || !texte || vus.has(texte)) continue;
      vus.add(texte);
      exemples.push({ categorie: t.categorie, texte });
    }

    const textes = candidates.map((t) => nettoyer(t.libelle) || t.libelle);
    const vecteurs = await vectoriser([...exemples.map((e) => e.texte), ...textes]);
    exemples.forEach((e, i) => { e.vecteur = vecteurs[i]; });

    candidates.forEach((t, i) => {
      const r = meilleureCategorie(vecteurs[exemples.length + i], exemples);
      if (r && r.ecart >= ECART_MIN) {
        propositions.push({ transaction: t, categorie: r.categorie, confiance: Math.min(r.ecart / 0.05, 1) });
      }
    });
  }
  return propositions.sort((a, b) => b.confiance - a.confiance);
}
