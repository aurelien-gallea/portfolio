// Repères français utilisés pour les pistes d'économies.
// Ce sont des ordres de grandeur indicatifs, pas des normes : ils servent à repérer
// un poste qui pèse nettement plus que la moyenne, pas à juger un budget.

// Part du revenu net au-delà de laquelle un poste mérite d'être regardé.
// Logement : le tiers des revenus, seuil classique du « taux d'effort ».
// Autres postes : arrondis au-dessus des parts moyennes de la consommation des ménages (INSEE).
// Taux d'endettement maximal recommandé par le Haut Conseil de stabilité financière (HCSF)
export const ENDETTEMENT_MAX = 0.35;

export const REPERES = {
  logement: 0.33,
  courses: 0.15,
  transport: 0.13,
  loisirs: 0.07,
  shopping: 0.06,
  restaurants: 0.05,
  abonnements: 0.04,
  sante: 0.03,
};

const lien = (texte, url) => ({ texte, url });

// Pistes concrètes par poste, de la plus simple à la plus engageante
export const ASTUCES = {
  logement: [
    lien('Simulez vos droits à l\'aide au logement (APL, ALS) : la simulation prend 5 minutes', 'https://www.caf.fr/allocataires/aides-et-demarches/mes-demarches'),
    lien('Comparez votre offre d\'électricité et de gaz avec le comparateur public du médiateur de l\'énergie', 'https://comparateur.energie-info.fr'),
    lien('Vérifiez si vous avez droit au chèque énergie', 'https://chequeenergie.gouv.fr'),
    { texte: 'Remettez votre assurance habitation en concurrence : elle est résiliable à tout moment après un an (loi Hamon)' },
  ],
  loyerEncadre: lien('Votre ville applique l\'encadrement des loyers : vérifiez que votre loyer respecte le plafond légal', 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1314'),
  loyerEncadrePartiel: lien('Une partie de votre commune applique l\'encadrement des loyers : vérifiez si votre adresse est concernée', 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1314'),
  credit: [
    { texte: "Changez d'assurance emprunteur : depuis la loi Lemoine, c'est possible à tout moment et sans frais, et l'économie atteint souvent plusieurs milliers d'euros sur la durée du prêt" },
    { texte: 'Si les taux actuels sont nettement inférieurs au vôtre, demandez une renégociation à votre banque, ou faites jouer la concurrence via un courtier' },
    { texte: 'Méfiez-vous du rachat de crédit : il baisse la mensualité, mais allonge la durée et augmente souvent le coût total' },
  ],
  courses: [
    { texte: 'Passez aux marques distributeur sur les produits de base : souvent 20 à 30 % moins chères à qualité proche' },
    { texte: 'Faites une liste avant de partir, ou commandez en drive pour éviter les achats d\'impulsion' },
    { texte: 'Essayez les paniers anti-gaspi des commerces de votre quartier (applications de type Too Good To Go)' },
  ],
  transport: [
    { texte: 'Votre employeur doit rembourser 50 % de votre abonnement de transport en commun : vérifiez que c\'est bien le cas' },
    lien('Comparez les prix des stations autour de chez vous sur le site officiel des carburants', 'https://www.prix-carburants.gouv.fr'),
    { texte: 'Pour les trajets réguliers, le covoiturage divise le coût par le nombre de passagers' },
  ],
  abonnements: [
    { texte: 'Listez vos abonnements et résiliez ceux que vous n\'avez pas utilisés le mois dernier : la loi impose une résiliation en 3 clics' },
    { texte: 'Un forfait mobile sans engagement coûte aujourd\'hui moins de 10 € par mois pour un usage courant' },
    { texte: 'Partagez les abonnements de streaming en offre famille, ou alternez-les au lieu de les cumuler' },
  ],
  restaurants: [
    { texte: 'Préparez vos déjeuners de la semaine en une fois le dimanche (batch cooking)' },
    { texte: 'Si votre employeur en propose, les titres-restaurant sont pris en charge à 50 % au moins par celui-ci' },
  ],
  loisirs: [
    { texte: 'Les médiathèques municipales prêtent livres, films, jeux vidéo, et parfois l\'accès à des plateformes en ligne, souvent gratuitement' },
    { texte: 'Renseignez-vous sur les tarifs réduits de votre ville (cinéma, piscine, musées) selon l\'âge ou les revenus' },
  ],
  shopping: [
    { texte: 'Attendez 48 heures avant tout achat non essentiel : une bonne partie des envies disparaît d\'elle-même' },
    { texte: 'Pensez à la seconde main et au reconditionné pour les vêtements, les meubles et l\'électronique' },
  ],
  sante: [
    lien('Vérifiez si vous avez droit à la Complémentaire santé solidaire, gratuite ou à moins de 1 € par jour', 'https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/complementaire-sante'),
    { texte: 'Comparez votre mutuelle : elle est résiliable à tout moment après un an' },
  ],
  revenus: [
    lien('Faites le point sur toutes les aides auxquelles vous pourriez avoir droit (prime d\'activité, APL, etc.) avec le simulateur officiel', 'https://www.mesdroitssociaux.gouv.fr'),
  ],
};
