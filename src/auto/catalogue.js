// Modèles thermiques courants en France. Consommations « réelles » moyennes (usage mixte),
// plus élevées que les valeurs d'homologation ; prix neufs approximatifs à la sortie.
// [marque, modèle, motorisation, carburant, L/100 km, de, à, prix neuf, catégorie]
const BRUT = [
  ['Renault', 'Twingo III', '1.0 SCe 65', 'essence', 5.6, 2014, 2024, 11500, 'citadine'],
  ['Renault', 'Clio III', '1.2 16V 75', 'essence', 6.6, 2005, 2014, 13500, 'citadine'],
  ['Renault', 'Clio III', '1.5 dCi 85', 'gazole', 5, 2005, 2014, 15500, 'citadine'],
  ['Renault', 'Clio IV', '1.2 16V 75', 'essence', 6.3, 2012, 2019, 14500, 'citadine'],
  ['Renault', 'Clio IV', '0.9 TCe 90', 'essence', 6, 2012, 2019, 16000, 'citadine'],
  ['Renault', 'Clio IV', '1.5 dCi 90', 'gazole', 4.6, 2012, 2019, 17500, 'citadine'],
  ['Renault', 'Clio V', '1.0 TCe 90', 'essence', 5.8, 2019, 2026, 18500, 'citadine'],
  ['Renault', 'Clio V', 'E-Tech hybride 145', 'essence', 4.6, 2020, 2026, 23500, 'citadine'],
  ['Renault', 'Captur I', '0.9 TCe 90', 'essence', 6.5, 2013, 2019, 17500, 'suv'],
  ['Renault', 'Captur I', '1.5 dCi 90', 'gazole', 5, 2013, 2019, 19500, 'suv'],
  ['Renault', 'Captur II', '1.3 TCe 140', 'essence', 6.8, 2020, 2026, 24500, 'suv'],
  ['Renault', 'Captur II', 'E-Tech hybride 145', 'essence', 5.2, 2021, 2026, 28000, 'suv'],
  ['Renault', 'Mégane III', '1.5 dCi 110', 'gazole', 5.2, 2008, 2016, 21000, 'compacte'],
  ['Renault', 'Mégane IV', '1.3 TCe 140', 'essence', 6.9, 2016, 2023, 24500, 'compacte'],
  ['Renault', 'Mégane IV', '1.5 dCi 115', 'gazole', 5, 2016, 2023, 26000, 'compacte'],
  ['Renault', 'Scénic III', '1.5 dCi 110', 'gazole', 5.8, 2009, 2016, 24000, 'familiale'],
  ['Renault', 'Kadjar', '1.5 dCi 110', 'gazole', 5.6, 2015, 2022, 26000, 'suv'],
  ['Renault', 'Austral', 'E-Tech hybride 200', 'essence', 5.6, 2022, 2026, 38000, 'suv'],
  ['Peugeot', '206', '1.1 60', 'essence', 6.6, 1998, 2010, 11500, 'citadine'],
  ['Peugeot', '207', '1.4 HDi 70', 'gazole', 4.9, 2006, 2012, 14500, 'citadine'],
  ['Peugeot', '108', '1.0 VTi 72', 'essence', 5, 2014, 2021, 11000, 'citadine'],
  ['Peugeot', '208 I', '1.2 PureTech 82', 'essence', 5.9, 2012, 2019, 15000, 'citadine'],
  ['Peugeot', '208 I', '1.6 BlueHDi 100', 'gazole', 4.4, 2014, 2019, 18000, 'citadine'],
  ['Peugeot', '208 II', '1.2 PureTech 100', 'essence', 6, 2019, 2026, 20000, 'citadine'],
  ['Peugeot', '2008 I', '1.2 PureTech 110', 'essence', 6.4, 2013, 2019, 20000, 'suv'],
  ['Peugeot', '2008 II', '1.2 PureTech 130', 'essence', 6.6, 2019, 2026, 26000, 'suv'],
  ['Peugeot', '308 II', '1.2 PureTech 130', 'essence', 6.5, 2013, 2021, 23000, 'compacte'],
  ['Peugeot', '308 II', '1.5 BlueHDi 130', 'gazole', 5.2, 2017, 2021, 26000, 'compacte'],
  ['Peugeot', '308 III', '1.2 PureTech 130', 'essence', 6.6, 2021, 2026, 29000, 'compacte'],
  ['Peugeot', '3008 II', '1.2 PureTech 130', 'essence', 7, 2016, 2023, 28000, 'suv'],
  ['Peugeot', '3008 II', '1.5 BlueHDi 130', 'gazole', 5.6, 2017, 2023, 31000, 'suv'],
  ['Peugeot', '5008 II', '1.5 BlueHDi 130', 'gazole', 5.9, 2017, 2023, 33000, 'familiale'],
  ['Citroën', 'C1 II', '1.0 VTi 72', 'essence', 5, 2014, 2022, 10500, 'citadine'],
  ['Citroën', 'C3 II', '1.4 HDi 70', 'gazole', 4.7, 2009, 2016, 14500, 'citadine'],
  ['Citroën', 'C3 III', '1.2 PureTech 82', 'essence', 6, 2016, 2023, 15500, 'citadine'],
  ['Citroën', 'C3 Aircross', '1.2 PureTech 110', 'essence', 6.6, 2017, 2024, 20000, 'suv'],
  ['Citroën', 'C4 Picasso II', '1.6 BlueHDi 120', 'gazole', 5.5, 2013, 2018, 27000, 'familiale'],
  ['Citroën', 'C5 Aircross', '1.5 BlueHDi 130', 'gazole', 5.8, 2018, 2026, 32000, 'suv'],
  ['Citroën', 'Berlingo III', '1.5 BlueHDi 100', 'gazole', 5.8, 2018, 2026, 25000, 'familiale'],
  ['Dacia', 'Sandero II', '0.9 TCe 90', 'essence', 6.4, 2012, 2020, 10500, 'citadine'],
  ['Dacia', 'Sandero II', '1.5 dCi 90', 'gazole', 4.8, 2012, 2020, 12000, 'citadine'],
  ['Dacia', 'Sandero III', '1.0 TCe 90', 'essence', 6, 2021, 2026, 14000, 'citadine'],
  ['Dacia', 'Sandero III', '1.0 ECO-G 100 (GPL)', 'gpl', 7.5, 2021, 2026, 14500, 'citadine'],
  ['Dacia', 'Duster II', '1.5 dCi 115', 'gazole', 5.8, 2018, 2024, 19000, 'suv'],
  ['Dacia', 'Duster II', '1.3 TCe 130', 'essence', 7.3, 2019, 2024, 18500, 'suv'],
  ['Dacia', 'Jogger', '1.0 ECO-G 100 (GPL)', 'gpl', 8, 2022, 2026, 19500, 'familiale'],
  ['Volkswagen', 'Polo V', '1.2 TSI 90', 'essence', 6, 2009, 2017, 16500, 'citadine'],
  ['Volkswagen', 'Polo VI', '1.0 TSI 95', 'essence', 5.6, 2017, 2026, 19500, 'citadine'],
  ['Volkswagen', 'Golf VI', '1.6 TDI 105', 'gazole', 5.3, 2008, 2012, 23000, 'compacte'],
  ['Volkswagen', 'Golf VII', '1.6 TDI 115', 'gazole', 5, 2012, 2020, 25000, 'compacte'],
  ['Volkswagen', 'Golf VII', '1.4 TSI 125', 'essence', 6.3, 2012, 2020, 24000, 'compacte'],
  ['Volkswagen', 'Golf VIII', '1.5 TSI 130', 'essence', 6, 2020, 2026, 30000, 'compacte'],
  ['Volkswagen', 'T-Roc', '1.0 TSI 110', 'essence', 6.4, 2017, 2026, 26000, 'suv'],
  ['Volkswagen', 'Tiguan II', '2.0 TDI 150', 'gazole', 6.4, 2016, 2024, 36000, 'suv'],
  ['Volkswagen', 'Touran II', '1.6 TDI 115', 'gazole', 5.6, 2015, 2024, 30000, 'familiale'],
  ['Toyota', 'Aygo', '1.0 VVT-i 72', 'essence', 5, 2014, 2022, 11000, 'citadine'],
  ['Toyota', 'Yaris III', 'Hybride 100', 'essence', 4.4, 2012, 2020, 18500, 'citadine'],
  ['Toyota', 'Yaris IV', 'Hybride 116', 'essence', 4, 2020, 2026, 23000, 'citadine'],
  ['Toyota', 'Yaris Cross', 'Hybride 116', 'essence', 4.8, 2021, 2026, 27000, 'suv'],
  ['Toyota', 'Auris II', 'Hybride 136', 'essence', 4.6, 2013, 2018, 25000, 'compacte'],
  ['Toyota', 'Corolla', 'Hybride 122', 'essence', 4.6, 2019, 2026, 29000, 'compacte'],
  ['Toyota', 'C-HR', 'Hybride 122', 'essence', 5.1, 2016, 2023, 29000, 'suv'],
  ['Toyota', 'RAV4 V', 'Hybride 218', 'essence', 6, 2019, 2026, 40000, 'suv'],
  ['Ford', 'Fiesta VII', '1.0 EcoBoost 100', 'essence', 5.9, 2017, 2023, 17000, 'citadine'],
  ['Ford', 'Focus III', '1.0 EcoBoost 125', 'essence', 6.4, 2011, 2018, 22000, 'compacte'],
  ['Ford', 'Focus III', '1.5 TDCi 120', 'gazole', 5.1, 2014, 2018, 24000, 'compacte'],
  ['Ford', 'Puma', '1.0 EcoBoost mHEV 125', 'essence', 6.2, 2019, 2026, 25000, 'suv'],
  ['Ford', 'Kuga II', '2.0 TDCi 150', 'gazole', 6.5, 2013, 2019, 32000, 'suv'],
  ['Opel', 'Corsa E', '1.4 90', 'essence', 6.5, 2014, 2019, 15500, 'citadine'],
  ['Opel', 'Corsa F', '1.2 100', 'essence', 5.9, 2019, 2026, 19500, 'citadine'],
  ['Opel', 'Astra K', '1.6 CDTi 110', 'gazole', 5, 2015, 2021, 23000, 'compacte'],
  ['Fiat', '500', '1.2 69', 'essence', 5.9, 2007, 2024, 13000, 'citadine'],
  ['Fiat', 'Panda III', '1.2 69', 'essence', 6, 2012, 2026, 11500, 'citadine'],
  ['Fiat', 'Tipo', '1.4 95', 'essence', 7, 2016, 2024, 16500, 'compacte'],
  ['Skoda', 'Fabia III', '1.0 TSI 95', 'essence', 5.5, 2014, 2021, 16000, 'citadine'],
  ['Skoda', 'Octavia III', '1.6 TDI 115', 'gazole', 5, 2013, 2020, 25000, 'compacte'],
  ['Seat', 'Ibiza V', '1.0 TSI 95', 'essence', 5.6, 2017, 2026, 17000, 'citadine'],
  ['Seat', 'Leon III', '1.6 TDI 115', 'gazole', 5, 2013, 2020, 23500, 'compacte'],
  ['Hyundai', 'i10 III', '1.0 67', 'essence', 5.3, 2019, 2026, 12500, 'citadine'],
  ['Hyundai', 'i20 II', '1.2 84', 'essence', 6, 2014, 2020, 15000, 'citadine'],
  ['Hyundai', 'Tucson III', '1.6 T-GDi 150', 'essence', 7.6, 2015, 2020, 28000, 'suv'],
  ['Kia', 'Picanto III', '1.0 67', 'essence', 5.3, 2017, 2026, 12000, 'citadine'],
  ['Kia', 'Sportage IV', '1.6 CRDi 136', 'gazole', 6.1, 2018, 2021, 31000, 'suv'],
  ['Kia', 'Niro', 'Hybride 141', 'essence', 4.9, 2016, 2026, 29000, 'suv'],
  ['Nissan', 'Micra V', '1.0 IG-T 92', 'essence', 5.8, 2017, 2023, 16500, 'citadine'],
  ['Nissan', 'Juke I', '1.5 dCi 110', 'gazole', 5.3, 2010, 2019, 20000, 'suv'],
  ['Nissan', 'Qashqai II', '1.5 dCi 110', 'gazole', 5.5, 2014, 2021, 26000, 'suv'],
  ['Nissan', 'Qashqai II', '1.3 DIG-T 140', 'essence', 7, 2018, 2021, 27000, 'suv'],
  ['Suzuki', 'Swift', '1.2 Dualjet Hybrid', 'essence', 4.9, 2017, 2026, 16000, 'citadine'],
  ['Honda', 'Jazz IV', 'e:HEV 109', 'essence', 4.6, 2020, 2026, 23000, 'citadine'],
  ['Mini', 'Cooper', '1.5 136', 'essence', 6.3, 2014, 2024, 24000, 'premium'],
  ['Audi', 'A3 8V', '1.6 TDI 110', 'gazole', 5, 2012, 2020, 28000, 'premium'],
  ['BMW', 'Série 1 F20', '118d 150', 'gazole', 5.3, 2011, 2019, 30000, 'premium'],
  ['BMW', 'Série 3 F30', '320d 190', 'gazole', 5.6, 2012, 2019, 40000, 'premium'],
  ['Mercedes', 'Classe A W176', 'A 180 d', 'gazole', 5, 2012, 2018, 28000, 'premium'],
  ['Mercedes', 'Classe C W205', 'C 220 d', 'gazole', 5.7, 2014, 2021, 43000, 'premium'],
];

const CATEGORIES = {
  citadine: { entretien: 550, assurance: 550 },
  compacte: { entretien: 700, assurance: 650 },
  suv: { entretien: 800, assurance: 750 },
  familiale: { entretien: 800, assurance: 700 },
  premium: { entretien: 1000, assurance: 900 },
};

const sansAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const CATALOGUE = BRUT.map(([marque, modele, moteur, carburant, conso, de, a, prixNeuf, categorie]) => ({
  id: sansAccents(`${marque}-${modele}-${moteur}`).replace(/[^a-z0-9]+/g, '-'),
  marque, modele, moteur, carburant, conso, de, a, prixNeuf, categorie,
  hybride: /hybrid|e:hev/i.test(moteur),
}));

const CARBURANT_RECHERCHE = { essence: 'essence', gazole: 'diesel gazole', gpl: 'gpl', e85: 'e85 ethanol' };

export function rechercher(texte) {
  const mots = sansAccents(texte).split(/\s+/).filter(Boolean);
  return CATALOGUE.filter((m) => {
    const cible = sansAccents(`${m.marque} ${m.modele} ${m.moteur} ${CARBURANT_RECHERCHE[m.carburant]} ${m.categorie}`);
    return mots.every((mot) => cible.includes(mot));
  });
}

// Valeurs estimées pour un exemplaire de l'année choisie : cote, entretien qui grimpe avec l'âge…
export function estimer(m, annee, anneeCourante = new Date().getFullYear()) {
  const age = Math.max(0, anneeCourante - annee);
  const { entretien, assurance } = CATEGORIES[m.categorie];
  const cote = age === 0 ? m.prixNeuf * 0.85 : m.prixNeuf * 0.85 * 0.9 ** age;
  const arrondi = (n, pas) => Math.round(n / pas) * pas;
  return {
    carburant: m.carburant,
    conso: m.conso,
    valeur: Math.max(500, arrondi(cote, 100)),
    decote: age < 5 ? 13 : age < 10 ? 10 : 8,
    entretien: arrondi(entretien * (m.carburant === 'gazole' ? 1.15 : 1) * Math.min(2, 1 + Math.max(0, age - 3) * 0.06), 10),
    hausseEntretien: age < 6 ? 4 : 6,
    assurance: arrondi(assurance * (age > 10 ? 0.85 : 1), 10),
    autres: 0,
  };
}
