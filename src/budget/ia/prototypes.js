// Descriptions types de chaque catégorie : l'IA compare le libellé d'une opération
// à ces phrases (et aux opérations déjà classées par l'utilisateur)

export const PROTOTYPES = {
  restaurants: [
    'restaurant, brasserie, bistrot, pizzeria',
    'fast-food, burger, kebab, sushi, tacos',
    'livraison de repas à domicile',
    'café, bar, boulangerie, salon de thé',
  ],
  logement: [
    'loyer de l\'appartement, agence immobilière',
    'facture d\'électricité, de gaz ou d\'eau',
    'assurance habitation',
    'charges de copropriété, syndic, taxe foncière',
  ],
  courses: [
    'supermarché, hypermarché, épicerie',
    'courses alimentaires de la semaine',
    'marché, primeur, boucherie, fromagerie, produits bio',
  ],
  transport: [
    'billet de train, métro, bus, tramway',
    'station-service, carburant, gazole',
    'péage d\'autoroute, parking, stationnement',
    'taxi, VTC, location de voiture, trottinette',
    'garage, entretien de la voiture, contrôle technique, pneus',
  ],
  loisirs: [
    'cinéma, concert, théâtre, musée, spectacle',
    'jeux vidéo, console, boutique de jeux',
    'salle de sport, club de sport, piscine, équipement sportif',
    'librairie, livres, bandes dessinées',
    'voyage, hôtel, location de vacances, billet d\'avion',
  ],
  sante: [
    'pharmacie, parapharmacie, médicaments',
    'consultation médecin, dentiste, kinésithérapeute, ophtalmologue',
    'mutuelle santé, hôpital, laboratoire d\'analyses médicales',
  ],
  animaux: [
    'clinique vétérinaire, consultation chez le vétérinaire',
    'animalerie, croquettes et accessoires pour chien ou chat',
    'assurance santé pour animaux',
  ],
  credits: [
    'échéance de crédit à la consommation, prêt personnel',
    'mensualité de crédit auto, location avec option d\'achat',
  ],
  abonnements: [
    'abonnement de streaming vidéo ou musique',
    'forfait de téléphone mobile, box internet, opérateur télécom',
    'abonnement mensuel à un logiciel, stockage cloud, presse en ligne',
  ],
  shopping: [
    'vêtements, chaussures, prêt-à-porter, mode',
    'achat en ligne, site de e-commerce',
    'meubles, décoration, magasin de bricolage',
    'électronique, informatique, téléphone, high-tech',
    'cosmétiques, parfumerie, coiffeur',
  ],
  salaire: [
    'salaire mensuel, paie, virement de l\'employeur',
  ],
  freelance: [
    'paiement d\'une facture client, prestation, mission freelance, honoraires',
  ],
  aides: [
    'allocation familiale CAF, aide au logement, prime d\'activité',
    'remboursement de la sécurité sociale, de la mutuelle',
    'allocation chômage, France Travail',
  ],
};
