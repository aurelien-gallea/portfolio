// Logique de classement par similarité d'embeddings (sans dépendance au modèle)

// Retire le bruit des relevés bancaires : « CB CARREFOUR 12/10 CARTE 4974XXXX » -> « carrefour »
export function nettoyer(libelle) {
  return libelle
    .replace(/\b(CB|CARTE|PAIEMENT|PAIE|PRLV|PRELEVEMENT|SEPA|VIR|VIREMENT|RETRAIT|DAB|FACTURE|ACHAT)\b/gi, ' ')
    .replace(/\b(X{2,}|\d{4}X+)\w*/gi, ' ')
    .replace(/\d{1,2}[/.-]\d{1,2}([/.-]\d{2,4})?/g, ' ')
    .replace(/\b\d{3,}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const produitScalaire = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

// exemples : [{ categorie, vecteur }] ; renvoie la meilleure catégorie et l'écart avec la 2e
export function meilleureCategorie(vecteur, exemples) {
  const scores = {};
  for (const ex of exemples) {
    const s = produitScalaire(vecteur, ex.vecteur);
    if (!(ex.categorie in scores) || s > scores[ex.categorie]) scores[ex.categorie] = s;
  }
  const tries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (tries.length === 0) return null;
  const [categorie, score] = tries[0];
  return { categorie, score, ecart: score - (tries[1]?.[1] ?? 0) };
}
