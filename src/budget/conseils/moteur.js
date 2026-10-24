// Compare les dépenses moyennes de l'utilisateur aux repères français
// et en tire des pistes concrètes, classées par économie possible.
import { categorie, cleMois, decalerMois, nomMois, euros } from '../donnees';
import { ASTUCES, REPERES, ENDETTEMENT_MAX } from './reperes';

const somme = (liste) => liste.reduce((s, t) => s + t.montant, 0);

// Les 3 derniers mois avec des opérations, jusqu'au mois donné inclus
export function fenetreRecente(transactions, fin) {
  const mois = [];
  for (let m = fin, i = 0; i < 12 && mois.length < 3; m = decalerMois(m, -1), i++) {
    if (transactions.some((t) => cleMois(t.date) === m)) mois.push(m);
  }
  return mois.reverse();
}

const LOYER = /loyer/i;
const CREDIT = /cr[eé]dit|pr[eê]t|emprunt|[eé]ch[eé]ance|immo/i;

const FRAIS_BANCAIRES = /agios|commission|cotisation (carte|cb|visa|mastercard)|frais (de )?(tenue|gestion|bancaires?|carte|de compte)|tenue de compte|offre group[eé]e/i;

// Frais bancaires repérés dans les libellés, en moyenne par mois sur la fenêtre récente
export function fraisBancaires(transactions, fin) {
  const mois = fenetreRecente(transactions, fin);
  if (!mois.length) return 0;
  return somme(transactions.filter((t) => t.type === 'depense' && mois.includes(cleMois(t.date)) && FRAIS_BANCAIRES.test(t.libelle))) / mois.length;
}

// Loyer moyen charges comprises pour la surface et le type de logement du profil
export function loyerDeReference(profil) {
  const v = typeof profil.ville === 'object' ? profil.ville : null; // ancien format : identifiant texte
  const surface = Number(profil.surface) || 0;
  if (!v || !surface) return 0;
  const m2 = profil.type === 'maison' ? v.loyerMaisonM2 ?? v.loyerAppartementM2 : v.loyerAppartementM2;
  return Math.round(m2 * surface);
}

function pisteLogement({ recentes, n, logement, revenus, profil }) {
  const v = typeof profil.ville === 'object' ? profil.ville : null;
  const surface = Number(profil.surface) || 0;
  const reference = loyerDeReference(profil);
  const lieu = v && `${profil.type === 'maison' ? 'une maison' : 'un appartement'} de ${surface} m² à ${v.nom}`;
  const effort = revenus > 0 ? logement / revenus : 0;
  // Le poste peut mélanger loyer, crédit et énergie : on isole le loyer ou la mensualité grâce au libellé
  const motif = profil.statut === 'proprietaire' ? CREDIT : LOYER;
  const principal = somme(recentes.filter((t) => t.categorie === 'logement' && motif.test(t.libelle))) / n || logement;

  if (profil.statut === 'proprietaire') {
    const endettement = revenus > 0 ? principal / revenus : 0;
    const constats = [`Votre mensualité de crédit (${euros(principal)}) représente ${Math.round(endettement * 100)} % de vos revenus. Les banques plafonnent l'endettement à ${Math.round(ENDETTEMENT_MAX * 100)} %, assurance comprise.`];
    if (reference) {
      constats.push(principal <= reference
        ? `C'est moins que le loyer moyen pour ${lieu} (≈ ${euros(reference)} par mois) : votre crédit vous coûte moins qu'une location équivalente.`
        : `C'est ${Math.round((principal / reference - 1) * 100)} % de plus que le loyer moyen pour ${lieu} (≈ ${euros(reference)} par mois).`);
    }
    const ecart = Math.max(0, principal - ENDETTEMENT_MAX * revenus);
    if (!ecart && effort <= REPERES.logement) return [];
    return [{
      id: 'logement', titre: 'Logement (crédit)', constats, actions: ASTUCES.credit, economie: ecart,
      part: endettement, repere: ENDETTEMENT_MAX,
    }];
  }

  const constats = [];
  let economie = 0;
  if (effort > REPERES.logement) {
    constats.push(`Le logement absorbe ${Math.round(effort * 100)} % de vos revenus, au-delà du tiers généralement recommandé.`);
    economie = logement - REPERES.logement * revenus;
  }
  if (reference && principal > reference * 1.1) {
    constats.push(`Votre loyer (${euros(principal)}) dépasse d'environ ${Math.round((principal / reference - 1) * 100)} % le loyer moyen pour ${lieu} (≈ ${euros(reference)} charges comprises).`);
    economie = Math.max(economie, principal - reference);
  } else if (reference) {
    constats.push(`Votre loyer (${euros(principal)}) est dans la moyenne pour ${lieu} (≈ ${euros(reference)} charges comprises).`);
  }

  if (!reference) {
    // Sans profil, on invite à le compléter pour une comparaison locale
    return [{
      id: 'logement', titre: 'Logement',
      constats: [
        ...(constats.length ? constats : [`Le logement représente ${revenus ? Math.round(effort * 100) : '—'} % de vos revenus.`]),
        'Indiquez votre ville et votre surface pour le comparer aux loyers de votre commune.',
      ],
      actions: ASTUCES.logement.slice(0, 2), economie, part: effort, repere: REPERES.logement, profilManquant: true,
    }];
  }
  if (!economie) return [];
  const actions = [...ASTUCES.logement];
  if (v.encadrement && principal > reference) {
    actions.unshift(v.encadrement === 2 ? ASTUCES.loyerEncadrePartiel : ASTUCES.loyerEncadre);
  }
  return [{ id: 'logement', titre: 'Logement', constats, actions, economie, part: effort, repere: REPERES.logement }];
}

export function calculerPistes({ transactions, profil = {} }, fin) {
  const mois = fenetreRecente(transactions, fin);
  if (mois.length === 0) return { mois, revenus: 0, pistes: [] };

  const n = mois.length;
  const recentes = transactions.filter((t) => mois.includes(cleMois(t.date)));
  const revenus = somme(recentes.filter((t) => t.type === 'revenu')) / n;
  const moyenne = (id) => somme(recentes.filter((t) => t.type === 'depense' && t.categorie === id)) / n;
  const depenses = somme(recentes.filter((t) => t.type === 'depense')) / n;
  const pistes = [];

  // Logement : taux d'effort, puis comparaison au loyer moyen de la commune
  const logement = moyenne('logement');
  if (logement > 0) pistes.push(...pisteLogement({ recentes, n, logement, revenus, profil }));

  // Autres postes : part du revenu comparée au repère national
  for (const [id, repere] of Object.entries(REPERES)) {
    if (id === 'logement') continue;
    const montant = moyenne(id);
    if (!montant || !revenus) continue;
    const part = montant / revenus;
    if (part <= repere) continue;
    const plafondRepere = repere * revenus;
    pistes.push({
      id,
      titre: categorie(id).nom,
      constats: [`${euros(montant)} par mois, soit ${Math.round(part * 100)} % de vos revenus. Le repère français tourne autour de ${Math.round(repere * 100)} %, soit environ ${euros(Math.round(plafondRepere))} pour vous.`],
      actions: ASTUCES[id] ?? [],
      economie: montant - plafondRepere,
      part,
      repere,
    });
  }

  // Budget dans le rouge : en plus des économies, regarder du côté des aides
  if (revenus > 0 && depenses > revenus) {
    pistes.push({
      id: 'revenus', titre: 'Aides et revenus',
      constats: [`Vos dépenses (${euros(depenses)}) dépassent vos revenus (${euros(revenus)}) de ${euros(depenses - revenus)} par mois en moyenne.`],
      actions: ASTUCES.revenus, economie: depenses - revenus, urgent: true,
    });
  }

  pistes.sort((a, b) => (Number(!!b.urgent) - Number(!!a.urgent)) || (b.economie - a.economie));
  return { mois, revenus, pistes };
}

// Version texte, transmise à l'assistant IA comme faits vérifiés
export function pistesEnTexte({ mois, pistes }) {
  if (!pistes.length) return '';
  return [
    `Comparaison avec les repères français (moyenne de ${mois.map((m) => nomMois(m)).join(', ')}) :`,
    ...pistes.slice(0, 3).map((p) =>
      `- ${p.titre} : ${p.constats.join(' ')}${p.economie > 0 ? ` ${p.id === 'logement' ? 'Écart avec la moyenne' : 'Économie possible'} : environ ${euros(Math.round(p.economie))} par mois.` : ''} Piste concrète : ${p.actions[0]?.texte ?? '—'}.`
    ),
  ].join('\n');
}
