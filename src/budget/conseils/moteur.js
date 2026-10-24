// Compare les dépenses moyennes de l'utilisateur aux repères français
// et en tire des pistes concrètes, classées par économie possible.
import { categorie, cleMois, decalerMois, nomMois, euros } from '../donnees';
import { ASTUCES, REPERES, ville } from './reperes';

const somme = (liste) => liste.reduce((s, t) => s + t.montant, 0);

// Les 3 derniers mois avec des opérations, jusqu'au mois donné inclus
export function fenetreRecente(transactions, fin) {
  const mois = [];
  for (let m = fin, i = 0; i < 12 && mois.length < 3; m = decalerMois(m, -1), i++) {
    if (transactions.some((t) => cleMois(t.date) === m)) mois.push(m);
  }
  return mois.reverse();
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

  // Logement : taux d'effort et comparaison au loyer moyen local
  const logement = moyenne('logement');
  const lieu = ville(profil.ville);
  const surface = Number(profil.surface) || 0;
  if (logement > 0) {
    // Le poste peut mélanger loyer et énergie : on isole le loyer quand le libellé le permet
    const loyer = somme(recentes.filter((t) => t.categorie === 'logement' && /loyer/i.test(t.libelle))) / n || logement;
    const loyerLocal = lieu && surface ? lieu.loyerM2 * surface : 0;
    const effort = revenus > 0 ? logement / revenus : 0;
    const constats = [];
    let economie = 0;

    if (effort > REPERES.logement) {
      constats.push(`Le logement absorbe ${Math.round(effort * 100)} % de vos revenus, au-delà du tiers généralement recommandé.`);
      economie = Math.max(economie, logement - REPERES.logement * revenus);
    }
    if (loyerLocal && loyer > loyerLocal * 1.1) {
      constats.push(`Votre loyer (${euros(loyer)}) dépasse d'environ ${Math.round((loyer / loyerLocal - 1) * 100)} % le loyer moyen d'un ${surface} m² à ${lieu.nom} (≈ ${euros(Math.round(loyerLocal))} charges comprises).`);
      economie = Math.max(economie, loyer - loyerLocal);
    } else if (loyerLocal && loyer > 0) {
      constats.push(`Votre loyer (${euros(loyer)}) est dans la moyenne d'un ${surface} m² à ${lieu.nom} (≈ ${euros(Math.round(loyerLocal))}).`);
    }

    if (constats.length && (effort > REPERES.logement || economie > 0)) {
      const actions = [...ASTUCES.logement];
      if (lieu?.encadrement && loyer > loyerLocal) {
        actions.unshift(lieu.encadrement === 'partiel' ? ASTUCES.loyerEncadrePartiel : ASTUCES.loyerEncadre);
      }
      pistes.push({
        id: 'logement', titre: 'Logement', constats, actions, economie,
        part: effort, repere: REPERES.logement,
      });
    } else if (!lieu || !surface) {
      // Sans profil, on invite à le compléter pour une comparaison locale
      pistes.push({
        id: 'logement', titre: 'Logement',
        constats: [`Le logement représente ${revenus ? Math.round(effort * 100) : '—'} % de vos revenus. Indiquez votre ville et votre surface pour le comparer aux loyers de votre secteur.`],
        actions: ASTUCES.logement.slice(0, 2), economie: 0, part: effort, repere: REPERES.logement, profilManquant: true,
      });
    }
  }

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
