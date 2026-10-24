// Catégories, stockage local et utilitaires de calcul du budget

export const CATEGORIES = {
  depense: [
    { id: 'logement', nom: 'Logement', couleur: '#f97316' },
    { id: 'courses', nom: 'Courses', couleur: '#22c55e' },
    { id: 'transport', nom: 'Transport', couleur: '#3b82f6' },
    { id: 'loisirs', nom: 'Loisirs', couleur: '#a855f7' },
    { id: 'sante', nom: 'Santé', couleur: '#ef4444' },
    { id: 'abonnements', nom: 'Abonnements', couleur: '#06b6d4' },
    { id: 'restaurants', nom: 'Restaurants', couleur: '#eab308' },
    { id: 'shopping', nom: 'Shopping', couleur: '#ec4899' },
    { id: 'autre', nom: 'Autre', couleur: '#94a3b8' },
  ],
  revenu: [
    { id: 'salaire', nom: 'Salaire', couleur: '#10b981' },
    { id: 'freelance', nom: 'Freelance', couleur: '#14b8a6' },
    { id: 'aides', nom: 'Aides', couleur: '#84cc16' },
    { id: 'autre-revenu', nom: 'Autre', couleur: '#64748b' },
  ],
};

const TOUTES = [...CATEGORIES.depense, ...CATEGORIES.revenu];
export const categorie = (id) => TOUTES.find((c) => c.id === id) ?? CATEGORIES.depense.at(-1);

const CLE = 'budget-portfolio-v1';

export const nouvelId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const cleMois = (date) => date.slice(0, 7); // "2026-10-24" -> "2026-10"

export const aujourdhui = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const decalerMois = (mois, n) => {
  const [a, m] = mois.split('-').map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const nomMois = (mois, format = 'long') => {
  const [a, m] = mois.split('-').map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString('fr-FR', { month: format, year: format === 'long' ? 'numeric' : undefined });
};

export const euros = (n) =>
  n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

// Exemple affiché à la première visite, pour que la page ne soit pas vide
function exemple() {
  const mois = cleMois(aujourdhui());
  const prec = decalerMois(mois, -1);
  const lignes = (m) => [
    ['revenu', 'salaire', 'Salaire', 2000, '01'],
    ['depense', 'logement', 'Loyer', 780, '02'],
    ['depense', 'abonnements', 'Internet + mobile', 45, '05'],
    ['depense', 'courses', 'Supermarché', 132.4, '06'],
    ['depense', 'transport', 'Carburant', 68, '09'],
    ['depense', 'restaurants', 'Resto entre amis', 54, '12'],
    ['depense', 'loisirs', 'Cinéma', 23, '14'],
    ['depense', 'courses', 'Marché', 41.8, '16'],
  ].map(([type, cat, libelle, montant, jour]) => ({
    id: nouvelId(), type, categorie: cat, libelle, montant, date: `${m}-${jour}`,
  }));
  // Libellés bruts de relevé, laissés en « Autre » pour essayer la catégorisation par IA
  const aClasser = [
    ['CB BURGER KING 4974XXXX', 14.5, '03'],
    ['CB PHARMACIE DU CENTRE', 18.9, '07'],
    ['CB STATION AVIA', 52, '10'],
    ['CB ZALANDO', 64.99, '15'],
  ].map(([libelle, montant, jour]) => ({
    id: nouvelId(), type: 'depense', categorie: 'autre', libelle, montant, date: `${mois}-${jour}`,
  }));
  return {
    transactions: [...lignes(prec), ...lignes(mois), ...aClasser],
    budgets: { courses: 350, loisirs: 120, restaurants: 100, transport: 150, shopping: 100 },
  };
}

export function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) {
      const donnees = JSON.parse(brut);
      if (Array.isArray(donnees.transactions)) return { budgets: {}, ...donnees };
    }
  } catch { /* stockage indisponible : on repart de l'exemple */ }
  return exemple();
}

export function sauvegarder(donnees) {
  try {
    localStorage.setItem(CLE, JSON.stringify(donnees));
  } catch { /* navigation privée : les données restent en mémoire */ }
}

export function totaux(transactions) {
  let revenus = 0;
  let depenses = 0;
  for (const t of transactions) {
    if (t.type === 'revenu') revenus += t.montant;
    else depenses += t.montant;
  }
  return { revenus, depenses, solde: revenus - depenses };
}

export function parCategorie(transactions) {
  const somme = {};
  for (const t of transactions) {
    if (t.type !== 'depense') continue;
    somme[t.categorie] = (somme[t.categorie] ?? 0) + t.montant;
  }
  return Object.entries(somme)
    .map(([id, montant]) => ({ ...categorie(id), montant }))
    .sort((a, b) => b.montant - a.montant);
}

// Un libellé commençant par = + - @ serait exécuté comme formule par Excel :
// l'apostrophe le force en texte (retirée à la réimportation)
const FORMULE = /^[=+\-@\t\r]/;
const sansFormule = (texte) => (FORMULE.test(texte) ? `'${texte}` : texte);

export function exporterCsv(transactions) {
  const entete = 'date;type;categorie;libelle;montant';
  const lignes = transactions.map((t) =>
    [t.date, t.type, categorie(t.categorie).nom, `"${sansFormule(t.libelle).replace(/"/g, '""')}"`, t.montant.toFixed(2).replace('.', ',')].join(';')
  );
  return '﻿' + [entete, ...lignes].join('\n');
}

// --- Import CSV : notre propre export ou un relevé bancaire ---

const sansAccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Mots-clés pour deviner la catégorie d'une ligne de relevé bancaire
const MOTS_CLES = {
  // Avant transport : « uber eats » doit primer sur « uber »
  restaurants: ['restaurant', 'resto', 'mcdo', 'mcdonald', 'burger', 'kfc', 'deliveroo', 'uber eats', 'just eat', 'pizza', 'boulangerie', 'cafe'],
  logement: ['loyer', 'edf', 'engie', 'eau ', 'veolia', 'assurance hab', 'syndic', 'charges'],
  courses: ['carrefour', 'leclerc', 'auchan', 'lidl', 'intermarche', 'super u', 'monoprix', 'franprix', 'casino', 'aldi', 'picard', 'marche'],
  transport: ['sncf', 'ratp', 'total', 'esso', 'shell', 'bp ', 'uber', 'blablacar', 'peage', 'parking', 'carburant', 'essence', 'navigo'],
  loisirs: ['cinema', 'fnac', 'steam', 'playstation', 'concert', 'decathlon', 'cultura'],
  sante: ['pharmacie', 'medecin', 'docteur', 'dentiste', 'mutuelle', 'hopital', 'cpam'],
  abonnements: ['netflix', 'spotify', 'deezer', 'disney', 'canal', 'free', 'orange', 'sfr', 'bouygues', 'sosh', 'amazon prime', 'abonnement'],
  shopping: ['amazon', 'zara', 'h&m', 'ikea', 'cdiscount', 'vinted', 'leroy merlin'],
  salaire: ['salaire', 'paie', 'virement employeur'],
  aides: ['caf', 'pole emploi', 'france travail', 'apl', 'remboursement'],
};

function devinerCategorie(texte, type) {
  const t = sansAccent(texte);
  const permises = CATEGORIES[type].map((c) => c.id);
  // Nom de catégorie exact (cas de notre propre export)
  const exacte = CATEGORIES[type].find((c) => sansAccent(c.nom) === t || c.id === t);
  if (exacte) return exacte.id;
  for (const [id, mots] of Object.entries(MOTS_CLES)) {
    if (permises.includes(id) && mots.some((m) => t.includes(m))) return id;
  }
  return type === 'revenu' ? 'autre-revenu' : 'autre';
}

function lireLignes(texte) {
  texte = texte.replace(/^﻿/, '');
  const premiere = texte.split(/\r?\n/).find((l) => l.trim()) ?? '';
  const separateur = [';', '\t', ','].sort((a, b) => premiere.split(b).length - premiere.split(a).length)[0];

  const lignes = [];
  let ligne = [];
  let cellule = '';
  let guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"' && texte[i + 1] === '"') { cellule += '"'; i++; }
      else if (c === '"') guillemets = false;
      else cellule += c;
    } else if (c === '"') guillemets = true;
    else if (c === separateur) { ligne.push(cellule.trim()); cellule = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++;
      ligne.push(cellule.trim());
      if (ligne.some(Boolean)) lignes.push(ligne);
      ligne = [];
      cellule = '';
    } else cellule += c;
  }
  ligne.push(cellule.trim());
  if (ligne.some(Boolean)) lignes.push(ligne);
  return lignes;
}

function lireDate(s) {
  s = s.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const annee = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${annee}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return null;
}

function lireMontant(s) {
  if (!s) return NaN;
  let n = s.replace(/[€\s  ]/g, '').replace(/EUR/i, '');
  // "1.234,56" ou "1234,56" -> virgule décimale ; "1,234.56" -> point décimal
  if (n.includes(',') && n.lastIndexOf(',') > n.lastIndexOf('.')) n = n.replace(/\./g, '').replace(',', '.');
  else n = n.replace(/,/g, '');
  return parseFloat(n);
}

const COLONNES = {
  date: ['date', 'date operation', 'date de l\'operation', 'date comptable', 'date valeur'],
  libelle: ['libelle', 'description', 'libelle operation', 'label', 'intitule', 'detail', 'operation', 'nature'],
  montant: ['montant', 'amount', 'valeur', 'somme'],
  debit: ['debit', 'debits'],
  credit: ['credit', 'credits'],
  type: ['type'],
  categorie: ['categorie', 'category'],
};

export function importerCsv(texte) {
  const lignes = lireLignes(texte);
  if (lignes.length < 2) throw new Error('Le fichier ne contient aucune ligne.');

  // La ligne d'en-tête est la première qui contient une colonne "date"
  const indexEntete = lignes.findIndex((l) => l.some((c) => sansAccent(c).startsWith('date')));
  if (indexEntete === -1) throw new Error('Colonne « date » introuvable.');
  const entete = lignes[indexEntete].map(sansAccent);
  const col = {};
  for (const [cle, noms] of Object.entries(COLONNES)) {
    const i = entete.findIndex((h) => noms.includes(h));
    col[cle] = i === -1 ? entete.findIndex((h) => noms.some((n) => h.startsWith(n))) : i;
  }
  if (col.montant === -1 && col.debit === -1 && col.credit === -1) {
    throw new Error('Colonne « montant » (ou « débit » / « crédit ») introuvable.');
  }

  const transactions = [];
  let ignorees = 0;
  for (const l of lignes.slice(indexEntete + 1)) {
    const date = col.date >= 0 ? lireDate(l[col.date] ?? '') : null;
    let montant;
    let type;
    if (col.montant >= 0 && !isNaN(lireMontant(l[col.montant]))) {
      montant = lireMontant(l[col.montant]);
      const typeLu = col.type >= 0 ? sansAccent(l[col.type] ?? '') : '';
      type = typeLu.startsWith('rev') || typeLu.startsWith('cred') ? 'revenu'
        : typeLu.startsWith('dep') || typeLu.startsWith('deb') ? 'depense'
        : montant < 0 ? 'depense' : 'revenu';
    } else {
      const debit = Math.abs(lireMontant(l[col.debit]) || 0);
      const credit = Math.abs(lireMontant(l[col.credit]) || 0);
      montant = credit || -debit;
      type = credit ? 'revenu' : 'depense';
    }
    montant = Math.round(Math.abs(montant) * 100) / 100;
    if (!date || !montant) { ignorees++; continue; }

    const libelle = (col.libelle >= 0 ? l[col.libelle] : '')?.replace(/^'(?=[=+\-@])/, '').replace(/\s+/g, ' ').slice(0, 60) ?? '';
    const indice = col.categorie >= 0 && l[col.categorie] ? l[col.categorie] : libelle;
    const cat = devinerCategorie(indice, type);
    transactions.push({
      id: nouvelId(), type, categorie: cat, date, montant,
      libelle: libelle || categorie(cat).nom,
    });
  }
  return { transactions, ignorees };
}

// Empreinte d'une opération pour éviter les doublons à l'import
export const empreinte = (t) => `${t.date}|${t.type}|${t.montant}|${sansAccent(t.libelle)}`;

export function telecharger(contenu, nom, type) {
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
}
