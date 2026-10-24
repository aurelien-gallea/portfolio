// Génère src/budget/conseils/villes.json, le référentiel des villes de l'appli budget.
// Sources (données publiques, licence ouverte) :
//  - communes, population et coordonnées : API Géo (geo.api.gouv.fr)
//  - loyers d'annonce charges comprises au m² : « Carte des loyers » 2025, ANIL / ministère du Logement (data.gouv.fr)
//  - communes soumises à l'encadrement des loyers : service-public.gouv.fr (fiche F1314)
// Usage : node scripts/generer-villes-budget.mjs
import { writeFile } from 'node:fs/promises';

const POPULATION_MIN = 5000;
const CARTE_LOYERS = 'https://static.data.gouv.fr/resources/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025/20251211-';
const SOURCES_LOYERS = {
  appartement: `${CARTE_LOYERS}145010/pred-app-mef-dhup.csv`,
  maison: `${CARTE_LOYERS}145039/pred-mai-mef-dhup.csv`,
};
const CHAMPS_GEO = 'fields=nom,code,population,centre,codesPostaux,departement&format=json';

// Encadrement des loyers : 1 = toute la commune, 2 = une partie seulement
const ENCADREMENT = {
  75: { tout: ['*'] },
  59: { tout: ['Lille'] },
  69: { tout: ['Lyon', 'Villeurbanne'] },
  34: { tout: ['Montpellier'] },
  33: { tout: ['Bordeaux'] },
  93: {
    tout: [
      'Bagnolet', 'Bobigny', 'Bondy', 'Le Pré-Saint-Gervais', 'Les Lilas', 'Montreuil', 'Noisy-le-Sec', 'Pantin', 'Romainville',
      'Aubervilliers', 'La Courneuve', 'Épinay-sur-Seine', "L'Île-Saint-Denis", 'Saint-Denis', // Pierrefitte-sur-Seine a fusionné avec Saint-Denis en 2025
     
      'Saint-Ouen-sur-Seine', 'Stains', 'Villetaneuse',
    ],
  },
  38: {
    tout: ['Bresson', 'Claix', 'Domène', 'Eybens', 'Fontanil-Cornillon', 'Gières', 'Meylan', 'Murianette', 'Poisat', 'La Tronche', 'Seyssins', 'Varces-Allières-et-Risset', 'Venon'],
    partie: ['Échirolles', 'Fontaine', 'Grenoble', 'Le Pont-de-Claix', 'Saint-Égrève', "Saint-Martin-d'Hères", 'Sassenage', 'Seyssinet-Pariset'],
  },
  64: {
    tout: [
      'Ahetze', 'Anglet', 'Arbonne', 'Arcangues', 'Ascain', 'Bassussarry', 'Bayonne', 'Biarritz', 'Bidart', 'Biriatou', 'Boucau', 'Ciboure',
      'Guéthary', 'Hendaye', 'Jatxou', 'Lahonce', 'Larressore', 'Mouguerre', 'Saint-Jean-de-Luz', "Saint-Pierre-d'Irube", 'Urcuit', 'Urrugne',
      'Ustaritz', 'Villefranque',
    ],
  },
};

const normaliser = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").replace(/[-\s]+/g, ' ').toLowerCase().trim();

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} : ${r.status}`);
  return r.json();
}

// Les CSV de la Carte des loyers sont en Latin-1, séparateur « ; », virgule décimale
async function loyers(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} : ${r.status}`);
  const texte = new TextDecoder('latin1').decode(await r.arrayBuffer());
  const [entete, ...lignes] = texte.trim().split(/\r?\n/);
  const cols = entete.split(';').map((c) => c.replace(/"/g, ''));
  const iCode = cols.indexOf('INSEE_C');
  const iLoyer = cols.indexOf('loypredm2');
  const parCode = new Map();
  for (const l of lignes) {
    const c = l.split(';');
    const valeur = parseFloat(c[iLoyer].replace(',', '.'));
    if (!isNaN(valeur)) parCode.set(c[iCode].replace(/"/g, ''), Math.round(valeur * 10) / 10);
  }
  return parCode;
}

const [communes, arrondissements, app, mai] = await Promise.all([
  json(`https://geo.api.gouv.fr/communes?${CHAMPS_GEO}`),
  json(`https://geo.api.gouv.fr/communes?type=arrondissement-municipal&${CHAMPS_GEO}`),
  loyers(SOURCES_LOYERS.appartement),
  loyers(SOURCES_LOYERS.maison),
]);

const regles = Object.fromEntries(Object.entries(ENCADREMENT).map(([dep, r]) => [dep, {
  tout: new Set((r.tout ?? []).map(normaliser)),
  partie: new Set((r.partie ?? []).map(normaliser)),
}]));
const trouvees = new Set();

function encadrement(c) {
  const r = regles[c.departement?.code];
  if (!r) return 0;
  const nom = normaliser(c.nom.replace(/ \d+(er|e) Arrondissement$/i, ''));
  if (r.tout.has('*') || r.tout.has(nom)) { trouvees.add(nom); return 1; }
  if (r.partie.has(nom)) { trouvees.add(nom); return 2; }
  return 0;
}

// Paris, Lyon et Marseille sont remplacées par leurs arrondissements, plus précis
const SUBDIVISEES = new Set(['75056', '69123', '13055']);
const villes = [...communes.filter((c) => !SUBDIVISEES.has(c.code)), ...arrondissements]
  .map((c) => ({ c, enc: encadrement(c) }))
  .filter(({ c, enc }) => c.centre && app.has(c.code) && (c.population >= POPULATION_MIN || enc || c.code.length === 5 && /^(751|6938|132)/.test(c.code)))
  .map(({ c, enc }) => {
    const [lon, lat] = c.centre.coordinates;
    // [code INSEE, nom, département, code postal, latitude, longitude, loyer appart. €/m², loyer maison €/m², encadrement]
    return [c.code, c.nom, c.departement?.code ?? '', c.codesPostaux?.[0] ?? '', Math.round(lat * 1e4) / 1e4, Math.round(lon * 1e4) / 1e4, app.get(c.code), mai.get(c.code) ?? null, enc];
  })
  .sort((a, b) => a[1].localeCompare(b[1], 'fr'));

const manquantes = Object.values(ENCADREMENT).flatMap((r) => [...(r.tout ?? []), ...(r.partie ?? [])])
  .filter((n) => n !== '*' && !trouvees.has(normaliser(n)));

await writeFile(new URL('../src/budget/conseils/villes.json', import.meta.url), JSON.stringify({
  source: 'API Géo (geo.api.gouv.fr) ; Carte des loyers 2025, ANIL / ministère du Logement (data.gouv.fr) ; service-public.gouv.fr',
  colonnes: ['code', 'nom', 'departement', 'codePostal', 'lat', 'lon', 'loyerAppartementM2', 'loyerMaisonM2', 'encadrement'],
  villes,
}));
console.log(`${villes.length} villes écrites.`);
if (manquantes.length) console.log('Communes encadrées non trouvées :', manquantes.join(', '));
