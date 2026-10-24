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
    ['revenu', 'salaire', 'Salaire', 2450, '01'],
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
  return {
    transactions: [...lignes(prec), ...lignes(mois)],
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

export function exporterCsv(transactions) {
  const entete = 'date;type;categorie;libelle;montant';
  const lignes = transactions.map((t) =>
    [t.date, t.type, categorie(t.categorie).nom, `"${t.libelle.replace(/"/g, '""')}"`, t.montant.toFixed(2).replace('.', ',')].join(';')
  );
  return '﻿' + [entete, ...lignes].join('\n');
}

export function telecharger(contenu, nom, type) {
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
}
