// Valeurs indicatives (France, fin 2026) : toutes modifiables dans l'interface
import { CATALOGUE_ELECTRIQUE, estimerElectrique } from './catalogue';

export const CARBURANTS = {
  essence: { nom: 'Essence', prix: 1.99, co2: 2.7 },
  gazole: { nom: 'Gazole', prix: 2.25, co2: 3.1 },
  e85: { nom: 'E85', prix: 0.85, co2: 1.4 },
  gpl: { nom: 'GPL', prix: 1.0, co2: 1.9 },
};

// kg CO2e par kWh, mix électrique français (cycle de vie)
export const CO2_KWH = 0.052;

export const THERMIQUES = [
  { id: 'citadine-essence', nom: 'Citadine essence', detail: 'Clio IV, 208, Polo… · 2015', carburant: 'essence', conso: 6, valeur: 6500, decote: 10, entretien: 700, hausseEntretien: 6, assurance: 550, autres: 0 },
  { id: 'compacte-diesel', nom: 'Compacte diesel', detail: '308, Mégane, Golf… · 2016', carburant: 'gazole', conso: 5.2, valeur: 8500, decote: 11, entretien: 900, hausseEntretien: 6, assurance: 650, autres: 0 },
  { id: 'suv-essence', nom: 'SUV essence', detail: '3008, Captur, Tiguan… · 2019', carburant: 'essence', conso: 7, valeur: 16000, decote: 12, entretien: 950, hausseEntretien: 5, assurance: 750, autres: 0 },
  { id: 'familiale-diesel', nom: 'Monospace diesel', detail: 'Scénic, C4 Picasso, Touran… · 2014', carburant: 'gazole', conso: 6, valeur: 6000, decote: 10, entretien: 1100, hausseEntretien: 7, assurance: 650, autres: 0 },
  { id: 'hybride', nom: 'Hybride essence', detail: 'Yaris, Corolla, Clio E-Tech… · 2019', carburant: 'essence', conso: 4.5, valeur: 14000, decote: 9, entretien: 650, hausseEntretien: 4, assurance: 600, autres: 0 },
];

// Champs qui définissent un modèle (comparés pour savoir si un modèle est sélectionné)
export const CLES_THERMIQUE = ['carburant', 'conso', 'valeur', 'decote', 'entretien', 'hausseEntretien', 'assurance', 'autres'];
export const CLES_ELECTRIQUE = ['prix', 'aides', 'conso', 'decote1', 'decote', 'entretien', 'assurance', 'carteGrise', 'fabrication'];

const ELECTRIQUE_DEFAUT = 'renault-5-e-tech-52-kwh';

export const extraire =(objet, cles) => Object.fromEntries(cles.map((c) => [c, objet[c]]));
export const identique = (a, b, cles) => cles.every((c) => a[c] === b[c]);

export const parDefaut = () => ({
  usage: {
    km: 13000, duree: 8, prixCarburant: CARBURANTS.essence.prix,
    prixDomicile: 0.2, prixPublic: 0.5, partDomicile: 80, pertes: 10, inflation: 2,
  },
  thermique: { ...extraire(THERMIQUES[0], CLES_THERMIQUE) },
  electrique: {
    ...estimerElectrique(CATALOGUE_ELECTRIQUE.find((m) => m.id === ELECTRIQUE_DEFAUT), 0),
    catalogue: ELECTRIQUE_DEFAUT, annee: 0,
    borne: 1000, autres: 0,
    credit: false, apport: 0, taux: 4.5, dureeCredit: 60,
  },
});

const CLE = 'thermique-vs-electrique';

// Anciens prix par défaut : un prix enregistré resté à cette valeur suit les nouveaux
const ANCIENS_PRIX = { essence: 1.75, gazole: 1.65 };

export function charger() {
  const base = parDefaut();
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) {
      const d = JSON.parse(brut);
      const thermique = { ...base.thermique, ...d.thermique };
      const usage = { ...base.usage, ...d.usage };
      if (usage.prixCarburant === ANCIENS_PRIX[thermique.carburant]) usage.prixCarburant = CARBURANTS[thermique.carburant].prix;
      return {
        usage,
        thermique,
        electrique: { ...base.electrique, ...d.electrique },
      };
    }
  } catch { /* données illisibles : on repart des valeurs par défaut */ }
  return base;
}

export function sauvegarder(donnees) {
  try {
    localStorage.setItem(CLE, JSON.stringify(donnees));
  } catch { /* navigation privée : les données restent en mémoire */ }
}

const fmtEuros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const euros = (n) => fmtEuros.format(Math.round(n) || 0);
export const nombre = (n, decimales = 0) =>
  (n || 0).toLocaleString('fr-FR', { maximumFractionDigits: decimales, minimumFractionDigits: 0 });

// Mensualité et intérêts payés chaque année d'un prêt amortissable
function pret(capital, tauxAnnuel, mois) {
  if (capital <= 0 || mois <= 0) return { mensualite: 0, interetsParAn: [] };
  const t = tauxAnnuel / 100 / 12;
  const mensualite = t === 0 ? capital / mois : (capital * t) / (1 - (1 + t) ** -mois);
  const interetsParAn = [];
  let restant = capital;
  for (let m = 0; m < mois; m++) {
    const interets = restant * t;
    restant -= mensualite - interets;
    const an = Math.floor(m / 12);
    interetsParAn[an] = (interetsParAn[an] ?? 0) + interets;
  }
  return { mensualite, interetsParAn };
}

const prixKwhMoyen = (u) => {
  const part = u.partDomicile / 100;
  return part * u.prixDomicile + (1 - part) * u.prixPublic;
};

// Coût cumulé de chaque scénario, année par année.
// « Coût » = argent dépensé + perte de valeur du véhicule possédé : les deux scénarios
// partent de la même situation (on possède la thermique), on peut donc les comparer directement.
export function simuler({ usage: u, thermique: th, electrique: el }, horizon = u.duree) {
  const litresAn = (u.km * th.conso) / 100;
  const kwhAn = ((u.km * el.conso) / 100) * (1 + u.pertes / 100);
  const prixKwh = prixKwhMoyen(u);
  const co2Carburant = CARBURANTS[th.carburant]?.co2 ?? CARBURANTS.essence.co2;

  const emprunt = el.credit ? Math.max(0, el.prix - el.aides - th.valeur - el.apport) : 0;
  const { mensualite, interetsParAn } = pret(emprunt, el.taux, el.credit ? el.dureeCredit : 0);

  const valeurThermique = (t) => th.valeur * (1 - th.decote / 100) ** t;
  const valeurElectrique = (t) =>
    t === 0 ? el.prix : el.prix * (1 - el.decote1 / 100) * (1 - el.decote / 100) ** (t - 1);

  const postes = {
    thermique: { valeur: 0, energie: 0, entretien: 0, assurance: 0, credit: 0, autres: 0 },
    electrique: { valeur: el.borne + el.carteGrise - el.aides, energie: 0, entretien: 0, assurance: 0, credit: 0, autres: 0 },
  };
  const annees = [{ annee: 0, thermique: 0, electrique: postes.electrique.valeur, co2Thermique: 0, co2Electrique: el.fabrication }];
  let co2T = 0;
  let co2E = el.fabrication;
  let totalT = 0;
  let totalE = postes.electrique.valeur;

  for (let t = 1; t <= horizon; t++) {
    const inflation = (1 + u.inflation / 100) ** (t - 1);
    const pT = postes.thermique;
    const pE = postes.electrique;

    const energieT = litresAn * u.prixCarburant * inflation;
    const entretienT = th.entretien * (1 + th.hausseEntretien / 100) ** (t - 1);
    const perteT = valeurThermique(t - 1) - valeurThermique(t);
    pT.energie += energieT; pT.entretien += entretienT; pT.assurance += th.assurance; pT.autres += th.autres; pT.valeur += perteT;
    totalT += energieT + entretienT + th.assurance + th.autres + perteT;

    const energieE = kwhAn * prixKwh * inflation;
    const interets = interetsParAn[t - 1] ?? 0;
    const perteE = valeurElectrique(t - 1) - valeurElectrique(t);
    pE.energie += energieE; pE.entretien += el.entretien; pE.assurance += el.assurance; pE.autres += el.autres; pE.credit += interets; pE.valeur += perteE;
    totalE += energieE + el.entretien + el.assurance + el.autres + interets + perteE;

    co2T += (litresAn * co2Carburant) / 1000;
    co2E += (kwhAn * CO2_KWH) / 1000;
    annees.push({ annee: t, thermique: totalT, electrique: totalE, co2Thermique: co2T, co2Electrique: co2E });
  }

  return {
    annees,
    postes,
    emprunt,
    mensualite,
    // Budget courant de la 1re année, hors perte de valeur
    mensuel: {
      thermique: (litresAn * u.prixCarburant + th.entretien + th.assurance + th.autres) / 12,
      electrique: (kwhAn * prixKwh + el.entretien + el.assurance + el.autres) / 12,
    },
    parKm: {
      thermique: (th.conso / 100) * u.prixCarburant,
      electrique: ((el.conso / 100) * (1 + u.pertes / 100)) * prixKwh,
    },
    prixKwh,
  };
}

// Moment (en années, interpolé) à partir duquel la courbe a reste durablement sous la courbe b
export function croisement(annees, a, b) {
  const ecart = (i) => annees[i][a] - annees[i][b];
  let dernier = -1;
  annees.forEach((_, i) => { if (ecart(i) > 0) dernier = i; });
  if (dernier === -1) return 0;
  if (dernier === annees.length - 1) return null;
  const avant = ecart(dernier);
  return annees[dernier].annee + avant / (avant - ecart(dernier + 1));
}

// Le coût est linéaire en km : on en déduit le kilométrage annuel où les deux options s'équilibrent
export function seuilKm(donnees) {
  const ecart = (km) => {
    const fin = simuler({ ...donnees, usage: { ...donnees.usage, km } }).annees.at(-1);
    return fin.electrique - fin.thermique;
  };
  const e0 = ecart(0);
  const pente = (ecart(10000) - e0) / 10000;
  if (pente >= 0) return null;
  return Math.max(0, -e0 / pente);
}

export const dureeTexte = (annees) => {
  const total = Math.round(annees * 12);
  const a = Math.floor(total / 12);
  const m = total % 12;
  if (total === 0) return 'immédiatement';
  return [a && `${a} an${a > 1 ? 's' : ''}`, m && `${m} mois`].filter(Boolean).join(' et ');
};
