// Référentiel des villes (généré par scripts/generer-villes-budget.mjs), chargé à la demande

let chargement = null;

export function chargerVilles() {
  chargement ??= import('./villes.json').then(({ default: { colonnes, villes } }) =>
    villes.map((ligne) => Object.fromEntries(colonnes.map((c, i) => [c, ligne[i]])))
  );
  return chargement;
}

const normaliser = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-'’\s]+/g, ' ').toLowerCase().trim();

// « Lyon 3e Arrondissement » -> « Lyon 3e »
export const nomCourt = (nom) => nom.replace(/ (\d+)(er|e) Arrondissement$/, ' $1$2');

// Recherche par nom (début de mot prioritaire) ou par code postal
export function rechercherVilles(villes, saisie, max = 10) {
  const q = normaliser(saisie).replace(/^st /, 'saint ').replace(/^ste /, 'sainte ').replace(/ st /g, ' saint ');
  if (q.length < 2) return [];
  if (/^\d{2,5}$/.test(q)) {
    return villes.filter((v) => v.codePostal.startsWith(q) || v.departement === q).slice(0, max);
  }
  const scores = [];
  for (const v of villes) {
    const nom = normaliser(v.nom);
    const score = nom === q ? 0 : nom.startsWith(q) ? 1 : nom.includes(` ${q}`) ? 2 : nom.includes(q) ? 3 : -1;
    if (score >= 0) scores.push([score, v]);
  }
  return scores
    .sort((a, b) => a[0] - b[0] || a[1].nom.localeCompare(b[1].nom, 'fr', { numeric: true }))
    .slice(0, max)
    .map(([, v]) => v);
}

// Ville du référentiel la plus proche d'une position (calcul local : la position ne quitte pas le navigateur)
export function villeLaPlusProche(villes, lat, lon) {
  const rad = Math.PI / 180;
  let meilleure = null;
  let distanceMin = Infinity;
  for (const v of villes) {
    const dLat = (v.lat - lat) * rad;
    const dLon = (v.lon - lon) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * rad) * Math.cos(v.lat * rad) * Math.sin(dLon / 2) ** 2;
    const distance = 12742 * Math.asin(Math.sqrt(a));
    if (distance < distanceMin) {
      distanceMin = distance;
      meilleure = v;
    }
  }
  return { ville: meilleure, distanceKm: distanceMin };
}

// Ce qui est conservé dans le profil (sans les coordonnées)
export const resumeVille = ({ code, nom, codePostal, loyerAppartementM2, loyerMaisonM2, encadrement }) =>
  ({ code, nom: nomCourt(nom), codePostal, loyerAppartementM2, loyerMaisonM2, encadrement });
