// Scanner d'abonnements : repère les prélèvements qui reviennent à intervalle régulier
// pour un montant proche (même libellé nettoyé), et signale les hausses de prix.
import { aujourdhui, cleMois } from '../donnees';

// Paiements récurrents qu'on ne « résilie » pas : loyer, crédit, et l'eau (fournisseur imposé par la commune)
const EXCLUS = /loyer|pr[eê]t|cr[eé]dit|emprunt|[eé]ch[eé]ance|salaire|virement|veolia|suez|saur\b|\beau\b/i;
const CATEGORIES_EXCLUES = ['courses', 'restaurants', 'credits'];
const PRELEVEMENT = /^(prlv|pr[eé]l[eè]vement)/i;

// Contrats essentiels : on ne les résilie pas, on fait jouer la concurrence
const CONTRATS = [
  { id: 'energie', motif: /\b(edf|engie|totalenergies|total energies|ekwateur|ohm|mint|octopus|vattenfall|eni|gaz|electricite|energie)\b/ },
  { id: 'assurance', motif: /\b(assurance|assur|maif|macif|matmut|maaf|gmf|axa|allianz|groupama|mma|direct assurance|leocare|lovys|luko|mutuelle|harmonie|mgen|alan)\b/ },
];
// Sous-catégories qui désignent à coup sûr un contrat à comparer
const SOUS_CONTRATS = {
  'logement-energie': 'energie',
  'logement-assurance': 'assurance',
  'transport-assurance': 'assurance',
  'sante-mutuelle': 'assurance',
  'animaux-assurance': 'assurance',
};
const typeContrat = (cle, sous) => SOUS_CONTRATS[sous] ?? CONTRATS.find((c) => c.motif.test(cle))?.id ?? null;

const FREQUENCES = [
  { id: 'mensuel', nom: 'mensuel', jours: [20, 40], parMois: 1 },
  { id: 'trimestriel', nom: 'trimestriel', jours: [80, 100], parMois: 1 / 3 },
  { id: 'annuel', nom: 'annuel', jours: [330, 400], parMois: 1 / 12 },
];

// « CB SPOTIFY P1A2B3 05/10 » -> « spotify »
export function cleLibelle(libelle) {
  return libelle
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/\.(com|fr|net|io)\b/g, ' ')
    .replace(/[^a-z0-9& ]+/g, ' ')
    .split(/\s+/)
    .filter((mot) => mot && !/\d/.test(mot))
    .filter((mot, i) => !(i === 0 && /^(cb|prlv|prelevement|paiement|carte|achat|sepa|vir)$/.test(mot)))
    .filter((mot) => !/^(sepa|prlv|cb|xx+)$/.test(mot))
    .slice(0, 4)
    .join(' ');
}

const jours = (a, b) => (new Date(b) - new Date(a)) / 86400000;
const median = (liste) => {
  const triee = [...liste].sort((a, b) => a - b);
  const milieu = Math.floor(triee.length / 2);
  return triee.length % 2 ? triee[milieu] : (triee[milieu - 1] + triee[milieu]) / 2;
};
const titre = (cle) => cle.charAt(0).toUpperCase() + cle.slice(1);

// Fréquence d'un groupe d'opérations (triées par date) s'il revient régulièrement, sinon null
function frequenceReguliere(liste, reference) {
  if (liste.length < 2) return null;
  // Deux passages seulement : il faut un indice de plus (prélèvement, ou catégorie Abonnements)
  if (liste.length === 2 && !liste.some((t) => t.categorie === 'abonnements' || PRELEVEMENT.test(t.libelle))) return null;

  // Un abonnement passe une fois par période : plusieurs achats dans le même mois = commerce habituel
  const mois = new Set(liste.map((t) => cleMois(t.date)));
  if (liste.length > mois.size + 1) return null;

  // Montants stables (à 25 % près), sinon ce sont des achats variables
  const montants = liste.map((t) => t.montant);
  const mediane = median(montants);
  if (montants.some((m) => Math.abs(m - mediane) > mediane * 0.25)) return null;

  const ecart = median(liste.slice(1).map((t, i) => jours(liste[i].date, t.date)));
  const frequence = FREQUENCES.find((f) => ecart >= f.jours[0] && ecart <= f.jours[1]);
  // Toujours actif : dernier passage il y a moins d'une période et demie
  if (!frequence || jours(liste.at(-1).date, reference) > ecart * 1.5) return null;
  return frequence;
}

export function detecterAbonnements(transactions, reference = aujourdhui()) {
  const limite = new Date(reference);
  limite.setMonth(limite.getMonth() - 25); // deux échéances d'un abonnement annuel
  const depuis = limite.toISOString().slice(0, 10);

  const groupes = new Map();
  for (const t of transactions) {
    if (t.type !== 'depense' || t.date < depuis || t.date > reference) continue;
    if (EXCLUS.test(t.libelle) || CATEGORIES_EXCLUES.includes(t.categorie)) continue;
    const cle = cleLibelle(t.libelle);
    if (cle.length < 3) continue;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(t);
  }

  const abonnements = [];
  for (const [cle, liste] of groupes) {
    liste.sort((a, b) => a.date.localeCompare(b.date));
    const derniere = liste.at(-1);
    const frequence = frequenceReguliere(liste, reference);
    // Classé en « Abonnements » par l'utilisateur ou l'import, même sans régularité visible : supposé mensuel
    const classe = !frequence && derniere.categorie === 'abonnements' && jours(derniere.date, reference) <= 45;
    if (!frequence && !classe) continue;

    const f = frequence ?? FREQUENCES[0];
    const precedent = liste.at(-2)?.montant ?? derniere.montant;
    abonnements.push({
      cle,
      nom: titre(cle),
      categorie: derniere.categorie,
      contrat: typeContrat(cle, derniere.sousCategorie),
      montant: derniere.montant,
      frequence: f,
      suppose: classe,
      mensuel: derniere.montant * f.parMois,
      annuel: derniere.montant * f.parMois * 12,
      derniere: derniere.date,
      occurrences: liste.length,
      hausse: derniere.montant - precedent > 0.005 ? derniere.montant - precedent : 0,
    });
  }
  return abonnements.sort((a, b) => b.annuel - a.annuel);
}
