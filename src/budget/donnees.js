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
  // Prélèvements récurrents, pour le scanner d'abonnements (dont une hausse de prix)
  const abonnements = [
    ['abonnements', 'PRLV NETFLIX.COM', 12.99, 13.49, '08'],
    ['loisirs', 'PRLV SALLE DE SPORT FITNESS', 29.99, 29.99, '04'],
    ['abonnements', 'CB SPOTIFY P1A2B3', 11.12, 11.12, '19'],
    // Contrats à comparer plutôt qu'à résilier
    ['logement', 'PRLV EDF CLIENTS PARTICULIERS', 64.3, 64.3, '07'],
    ['logement', 'PRLV MAIF ASSURANCE HABITATION', 18.4, 18.4, '10'],
    // Classé en Abonnements, un seul passage pour l'instant
    ['abonnements', 'CB DISNEY PLUS', null, 9.99, '21'],
  ].flatMap(([cat, libelle, avant, maintenant, jour]) => [[prec, avant], [mois, maintenant]]
    .filter(([, montant]) => montant !== null)
    .map(([m, montant]) => ({
      id: nouvelId(), type: 'depense', categorie: cat, libelle, montant, date: `${m}-${jour}`,
    })));
  return {
    // Données de démonstration : remplacées dès que l'utilisateur commence son propre budget
    exemple: true,
    transactions: [...lignes(prec), ...lignes(mois), ...aClasser, ...abonnements],
    budgets: { courses: 350, loisirs: 120, restaurants: 100, transport: 150, shopping: 100 },
  };
}

export { exemple as donneesExemple };

export function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) {
      const donnees = JSON.parse(brut);
      if (Array.isArray(donnees.transactions)) {
        // Exemple enregistré avant l'ajout du marqueur : reconnu à l'une de ses opérations
        const exempleAncien = donnees.exemple === undefined && donnees.transactions.some((t) => t.libelle === 'CB BURGER KING 4974XXXX');
        return { budgets: {}, ...donnees, ...(exempleAncien && { exemple: true }) };
      }
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
  shopping: ['amazon', 'amzn', 'amz ', 'zara', 'h&m', 'ikea', 'cdiscount', 'vinted', 'leroy merlin'],
  salaire: ['salaire', 'paie', 'virement employeur'],
  aides: ['caf', 'pole emploi', 'france travail', 'apl', 'remboursement'],
};

// Catégories fournies par les banques (BoursoBank, Crédit Agricole…) ramenées aux nôtres ; l'ordre compte
const CATEGORIES_BANQUE = {
  abonnements: /telephon|multimedia|internet|abonnement|streaming/,
  restaurants: /restaurant|restauration|fast.?food/,
  courses: /alimentation|supermarche|hypermarche|courses|epicerie/,
  logement: /loyer|logement|habitation|electricite|energie|\bgaz\b|\beau\b|charges/,
  transport: /carburant|transport|\bauto\b|\bmoto\b|peage|parking|stationnement|vehicule/,
  sante: /sante|pharmacie|medecin|medical|mutuelle|optique|dentaire/,
  shopping: /shopping|vetement|habillement|chaussure|livres|mobilier|electromenager|electronique|informatique|bricolage|jardinage|bien-etre|beaute|cadeau|equipement/,
  loisirs: /loisir|sport|sortie|culture|spectacle|voyage|vacances|jeux|hotel/,
  salaire: /salaire|remuneration|revenus du travail|\bpaie\b/,
  aides: /allocation|prestation|\baides?\b|remboursement|indemnit/,
};

// Virements entre ses propres comptes ou vers l'épargne : ni une dépense ni un revenu
const MOUVEMENT_INTERNE = /epargne|mouvements? internes?|comptes? a comptes?/;

function devinerCategorie(libelle, type, categoriesBanque = []) {
  const permises = CATEGORIES[type].map((c) => c.id);
  const banque = categoriesBanque.filter(Boolean).map(sansAccent);
  // Nom de catégorie exact (cas de notre propre export)
  const exacte = CATEGORIES[type].find((c) => banque.some((b) => sansAccent(c.nom) === b || c.id === b));
  if (exacte) return exacte.id;
  // Le libellé (nom du commerçant) d'abord, puis la catégorie de la banque, puis sa catégorie parente
  const texte = sansAccent(libelle);
  for (const [id, mots] of Object.entries(MOTS_CLES)) {
    if (permises.includes(id) && mots.some((m) => texte.includes(m))) return id;
  }
  for (const b of banque) {
    for (const [id, motif] of Object.entries(CATEGORIES_BANQUE)) {
      if (permises.includes(id) && motif.test(b)) return id;
    }
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
  n = n.replace(/[−–]/g, '-');
  // Comptabilité : "(12,50)" = -12,50
  if (/^\(.*\)$/.test(n)) n = `-${n.slice(1, -1)}`;
  if (!/^[+-]?[\d.,]+$/.test(n)) return NaN;
  // "1.234,56" ou "1234,56" -> virgule décimale ; "1,234.56" -> point décimal
  if (n.includes(',') && n.lastIndexOf(',') > n.lastIndexOf('.')) n = n.replace(/\./g, '').replace(',', '.');
  else n = n.replace(/,/g, '');
  return parseFloat(n);
}

// Noms de colonnes reconnus, par ordre de préférence (comparés sans accents ni majuscules)
const COLONNES = {
  date: ['date operation', 'date de l\'operation', 'date comptable', 'date', 'transaction date', 'booking date', 'date valeur', 'value date'],
  libelle: ['libelle', 'libelle operation', 'description', 'label', 'intitule', 'detail', 'operation', 'nature', 'beneficiaire', 'payee', 'merchant', 'memo'],
  montant: ['montant', 'amount', 'somme', 'valeur', 'debit/credit', 'debit / credit', 'credit/debit'],
  debit: ['debit', 'debits', 'sortie', 'sorties', 'paid out', 'withdrawal'],
  credit: ['credit', 'credits', 'entree', 'entrees', 'paid in', 'deposit'],
  type: ['type'],
  categorie: ['categorie', 'category', 'sous-categorie'],
  parente: ['categorie parente', 'parent category'],
};

function trouverColonne(entete, noms) {
  for (const n of noms) {
    const i = entete.indexOf(n);
    if (i !== -1) return i;
  }
  for (const n of noms) {
    const i = entete.findIndex((h) => h.startsWith(n));
    if (i !== -1) return i;
  }
  return -1;
}

// Colonnes dont la plupart des valeurs vérifient le test (sur un échantillon de lignes)
function colonnesOu(donnees, test, exclues) {
  const largeur = Math.max(...donnees.map((l) => l.length));
  const resultat = [];
  for (let i = 0; i < largeur; i++) {
    if (exclues.includes(i)) continue;
    const valeurs = donnees.map((l) => l[i]).filter(Boolean);
    if (valeurs.length >= donnees.length * 0.8 && valeurs.filter(test).length >= valeurs.length * 0.9) resultat.push(i);
  }
  return resultat;
}

// Montant plausible : ni une date, ni un numéro de compte (zéros en tête)
const estMontant = (v) => !lireDate(v) && !/^0\d{4,}$/.test(v) && !isNaN(lireMontant(v));

export function importerCsv(texte) {
  const lignes = lireLignes(texte);
  if (lignes.length === 0) throw new Error('Le fichier ne contient aucune ligne.');

  // En-tête : première ligne d'au moins 3 cellules dont l'une parle de date sans en contenir une
  // (les lignes d'introduction de certaines banques sont ainsi sautées)
  const indexEntete = lignes.findIndex((l) =>
    l.filter(Boolean).length >= 3 && l.some((c) => sansAccent(c).includes('date')) && !l.some((c) => lireDate(c))
  );
  const entete = indexEntete === -1 ? [] : lignes[indexEntete].map(sansAccent);
  const donnees = lignes.slice(indexEntete + 1);
  if (donnees.length === 0) throw new Error('Le fichier ne contient aucune opération.');
  const echantillon = donnees.slice(0, 50);

  const col = {};
  for (const [cle, noms] of Object.entries(COLONNES)) col[cle] = trouverColonne(entete, noms);
  if (col.parente === col.categorie) col.parente = -1;

  // Colonnes non nommées (ou fichier sans en-tête) : on les reconnaît à leur contenu
  if (col.date === -1) col.date = colonnesOu(echantillon, (v) => !!lireDate(v), [])[0] ?? -1;
  if (col.montant === -1 && col.debit === -1 && col.credit === -1) {
    const numeriques = colonnesOu(echantillon, estMontant, [col.date])
      .filter((i) => new Set(echantillon.map((l) => l[i])).size > 1);
    // Un solde suit souvent le montant : on préfère une colonne qui ne s'appelle pas « solde »
    col.montant = numeriques.find((i) => !/solde|balance/.test(entete[i] ?? '')) ?? numeriques[0] ?? -1;
  }
  if (col.libelle === -1) {
    const utilisees = [col.date, col.montant, col.debit, col.credit];
    const longueur = (i) => echantillon.reduce((s, l) => s + (l[i]?.length ?? 0), 0);
    col.libelle = colonnesOu(echantillon, (v) => !lireDate(v) && isNaN(lireMontant(v)), utilisees)
      .sort((a, b) => longueur(b) - longueur(a))[0] ?? -1;
  }
  if (col.date === -1) throw new Error('Aucune colonne de dates trouvée.');
  if (col.montant === -1 && col.debit === -1 && col.credit === -1) {
    throw new Error('Colonne « montant » (ou « débit » / « crédit ») introuvable.');
  }

  const transactions = [];
  let ignorees = 0;
  let internes = 0;
  for (const l of donnees) {
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

    const categoriesBanque = [l[col.categorie], l[col.parente]];
    if (MOUVEMENT_INTERNE.test(sansAccent(categoriesBanque.filter(Boolean).join(' ')))) { internes++; continue; }

    const libelle = (col.libelle >= 0 ? l[col.libelle] : '')?.replace(/^'(?=[=+\-@])/, '').replace(/\s+/g, ' ').slice(0, 60) ?? '';
    const cat = devinerCategorie(libelle, type, categoriesBanque);
    transactions.push({
      id: nouvelId(), type, categorie: cat, date, montant,
      libelle: libelle || categorie(cat).nom,
    });
  }
  return { transactions, ignorees, internes };
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
