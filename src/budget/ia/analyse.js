// Outils de l'assistant : le modèle choisit une requête, ce module calcule les chiffres
// (le LLM ne fait jamais d'arithmétique lui-même)
import { CATEGORIES, categorie, cleMois, decalerMois, nomMois, euros, aujourdhui } from '../donnees';
import { calculerPistes, pistesEnTexte } from '../conseils/moteur';

const ACTIONS = ['total', 'repartition', 'evolution', 'top', 'conseil', 'hors_sujet'];
const FORMAT_MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;
const COMPRESSIBLES = ['restaurants', 'loisirs', 'shopping', 'abonnements'];

export const SCHEMA = {
  type: 'object',
  properties: {
    action: { type: 'string', enum: ACTIONS },
    type: { type: 'string', enum: ['depense', 'revenu'] },
    categories: {
      type: 'array',
      items: { type: 'string', enum: [...CATEGORIES.depense, ...CATEGORIES.revenu].map((c) => c.id) },
    },
    debut: { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}$' },
    fin: { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}$' },
    recherche: { type: 'string', maxLength: 30 },
  },
  required: ['action', 'type', 'categories', 'debut', 'fin', 'recherche'],
};

export function promptExtraction(transactions) {
  const courant = cleMois(aujourdhui());
  const moisConnus = transactions.map((t) => cleMois(t.date)).sort();
  const ex = (question, requete) => `Q : ${question}\n${JSON.stringify({ type: 'depense', categories: [], recherche: '', ...requete })}`;
  return `Tu convertis une question sur un budget personnel en requête JSON.
Date du jour : ${aujourdhui()}. Les mois sont au format AAAA-MM.
Repères : ce mois-ci = ${courant} ; le mois dernier = ${decalerMois(courant, -1)} ; cette année = de ${courant.slice(0, 4)}-01 à ${courant}.
${moisConnus.length ? `Données disponibles de ${moisConnus[0]} à ${moisConnus.at(-1)}.` : ''}
Catégories de dépenses : ${CATEGORIES.depense.map((c) => `${c.id} (${c.nom})`).join(', ')}.
Catégories de revenus : ${CATEGORIES.revenu.map((c) => `${c.id} (${c.nom})`).join(', ')}.

Actions :
- total : montant total sur une période
- repartition : répartition par catégorie, « où part mon argent »
- evolution : comparaison mois par mois
- top : plus grosses opérations
- conseil : comment économiser, respect des plafonds, analyse globale
- hors_sujet : question sans rapport avec le budget

« type » = "revenu" pour les questions sur l'argent gagné, touché ou reçu (salaire, revenus), sinon "depense".
« categories » vide = toutes les catégories. « recherche » = un mot du libellé (marque, commerce) ou "" ; si « recherche » est rempli, laisse « categories » vide.

${ex('Combien j\'ai dépensé en restaurants depuis août ?', { action: 'total', categories: ['restaurants'], debut: `${courant.slice(0, 4)}-08`, fin: courant })}
${ex('Où est passé mon argent le mois dernier ?', { action: 'repartition', debut: decalerMois(courant, -1), fin: decalerMois(courant, -1) })}
${ex('Compare mes dépenses des 6 derniers mois', { action: 'evolution', debut: decalerMois(courant, -5), fin: courant })}
${ex('Combien me coûte Netflix par an ?', { action: 'total', recherche: 'netflix', debut: decalerMois(courant, -11), fin: courant })}
${ex('Quels ont été mes revenus cette année ?', { action: 'evolution', type: 'revenu', debut: `${courant.slice(0, 4)}-01`, fin: courant })}
${ex('Combien ai-je touché en freelance le mois dernier ?', { action: 'total', type: 'revenu', categories: ['freelance'], debut: decalerMois(courant, -1), fin: decalerMois(courant, -1) })}
${ex('Mes plus grosses dépenses ce mois-ci', { action: 'top', debut: courant, fin: courant })}
${ex('Où puis-je économiser ?', { action: 'conseil', debut: courant, fin: courant })}
${ex('Quelle est la capitale du Pérou ?', { action: 'hors_sujet', debut: courant, fin: courant })}`;
}

export const PROMPT_REPONSE = `Tu es l'assistant de l'application « Mon Budget ». Tu vouvoies l'utilisateur (« vous avez dépensé », « vos revenus »).
Réponds en français, en 2 ou 3 phrases courtes et factuelles, sans titre, sans liste et sans jugement.
Appuie-toi UNIQUEMENT sur les faits fournis : cite les montants importants tels quels, n'invente aucun chiffre ni aucune information.
Commence toujours ta réponse par « Vous » ou « Votre ».
Si les faits comparent le budget aux repères français, cite le poste qui dépasse le plus et reprends telle quelle une des pistes concrètes fournies.`;

const somme = (liste) => liste.reduce((s, t) => s + t.montant, 0);

function plageMois(debut, fin) {
  const mois = [];
  for (let m = debut; m <= fin && mois.length < 24; m = decalerMois(m, 1)) mois.push(m);
  return mois;
}

// Exécute la requête produite par le modèle ; renvoie { titre, barres, faits }
export function executer(requete, { transactions, budgets, profil }) {
  const courant = cleMois(aujourdhui());
  let debut = FORMAT_MOIS.test(requete.debut) ? requete.debut : courant;
  let fin = FORMAT_MOIS.test(requete.fin) ? requete.fin : debut;
  if (debut > fin) [debut, fin] = [fin, debut];
  const mois = plageMois(debut, fin);
  fin = mois.at(-1);

  const type = requete.type === 'revenu' ? 'revenu' : 'depense';
  const motif = (requete.recherche ?? '').trim().toLowerCase();
  // Une recherche par libellé suffit : les catégories devinées en plus risqueraient de tout exclure
  const cats = motif ? [] : [...new Set(requete.categories ?? [])].filter((id) => CATEGORIES[type].some((c) => c.id === id));
  const filtrees = transactions.filter((t) =>
    t.type === type && cleMois(t.date) >= debut && cleMois(t.date) <= fin &&
    (!cats.length || cats.includes(t.categorie)) &&
    (!motif || t.libelle.toLowerCase().includes(motif))
  );

  const periode = debut === fin ? `en ${nomMois(debut)}` : `de ${nomMois(debut)} à ${nomMois(fin)}`;
  const nature = type === 'revenu' ? 'revenus' : 'dépenses';
  const portee = [cats.map((id) => categorie(id).nom).join(', '), motif && `libellés contenant « ${motif} »`].filter(Boolean).join(', ') || 'toutes catégories';
  const total = somme(filtrees);
  const parMois = mois.map((m) => ({ nom: nomMois(m, 'short'), valeur: somme(filtrees.filter((t) => cleMois(t.date) === m)), mois: m }));
  // Pour le graphique, on saute les mois vides en début de période (avant les premières données)
  const premier = parMois.findIndex((m) => m.valeur > 0);
  const barresMois = parMois.slice(Math.max(premier, 0)).map((m) => ({ nom: m.nom, valeur: m.valeur }));

  switch (requete.action) {
    case 'hors_sujet':
      return { titre: null, barres: [], faits: null };

    case 'repartition': {
      const parCat = {};
      for (const t of filtrees) parCat[t.categorie] = (parCat[t.categorie] ?? 0) + t.montant;
      const barres = Object.entries(parCat)
        .map(([id, valeur]) => ({ nom: categorie(id).nom, valeur, couleur: categorie(id).couleur }))
        .sort((a, b) => b.valeur - a.valeur);
      return {
        titre: `Répartition des ${nature} ${periode}`,
        barres,
        faits: barres.length
          ? `Total des ${nature} ${periode} : ${euros(total)}.\n${barres.map((b) => `- ${b.nom} : ${euros(b.valeur)} (${Math.round((b.valeur / total) * 100)} %)`).join('\n')}`
          : `Aucune opération ${periode}.`,
      };
    }

    case 'evolution': {
      const actifs = parMois.filter((m) => m.valeur > 0);
      const moyenne = actifs.length ? somme(actifs.map((m) => ({ montant: m.valeur }))) / actifs.length : 0;
      const tries = [...actifs].sort((a, b) => b.valeur - a.valeur);
      return {
        titre: `${nature[0].toUpperCase()}${nature.slice(1)} par mois (${portee})`,
        barres: barresMois,
        faits: `${nature} (${portee}) ${periode}, mois par mois :\n${parMois.map((m) => `- ${nomMois(m.mois)} : ${euros(m.valeur)}`).join('\n')}\nTotal : ${euros(total)}. Moyenne des mois avec des opérations : ${euros(moyenne)}.` +
          (tries.length > 1 ? `\nMois le plus élevé : ${nomMois(tries[0].mois)} (${euros(tries[0].valeur)}). Mois le plus bas : ${nomMois(tries.at(-1).mois)} (${euros(tries.at(-1).valeur)}).` : '') +
          (actifs.length < parMois.length ? `\n${parMois.length - actifs.length} mois sans aucune opération enregistrée.` : ''),
      };
    }

    case 'top': {
      const top = [...filtrees].sort((a, b) => b.montant - a.montant).slice(0, 5);
      return {
        titre: `Plus grosses ${nature} ${periode}`,
        barres: top.map((t) => ({ nom: t.libelle, valeur: t.montant, couleur: categorie(t.categorie).couleur })),
        faits: top.length
          ? `Les ${top.length} plus grosses ${nature} (${portee}) ${periode} :\n${top.map((t) => `- ${t.libelle} (${categorie(t.categorie).nom}, le ${t.date}) : ${euros(t.montant)}`).join('\n')}`
          : `Aucune opération (${portee}) ${periode}.`,
      };
    }

    case 'conseil': {
      // Moyenne des 3 derniers mois renseignés, comparée aux plafonds définis
      const fenetre = plageMois(decalerMois(fin, -2), fin).filter((m) => transactions.some((t) => cleMois(t.date) === m));
      if (fenetre.length === 0) return { titre: null, barres: [], faits: `Aucune opération enregistrée jusqu'à ${nomMois(fin)}.` };
      const recentes = transactions.filter((t) => fenetre.includes(cleMois(t.date)));
      const n = fenetre.length;
      const revenus = somme(recentes.filter((t) => t.type === 'revenu')) / n;
      const lignes = CATEGORIES.depense
        .map((c) => ({ c, moyenne: somme(recentes.filter((t) => t.type === 'depense' && t.categorie === c.id)) / n }))
        .filter((l) => l.moyenne > 0)
        .sort((a, b) => b.moyenne - a.moyenne);
      const depenses = somme(lignes.map((l) => ({ montant: l.moyenne })));
      const depasses = lignes.filter(({ c, moyenne }) => budgets[c.id] && moyenne > budgets[c.id]);
      const compressibles = lignes.filter(({ c }) => COMPRESSIBLES.includes(c.id)).slice(0, 3);
      const gain = somme(compressibles.map((l) => ({ montant: l.moyenne * 0.2 })));
      return {
        titre: `Dépenses moyennes par mois (${nomMois(fenetre[0], 'short')} – ${nomMois(fin, 'short')})`,
        barres: lignes.map((l) => ({ nom: l.c.nom, valeur: l.moyenne, couleur: l.c.couleur })),
        faits: [
          `Sur ${n} mois (${fenetre.map((m) => nomMois(m)).join(', ')}), vous gagnez en moyenne ${euros(revenus)} et dépensez ${euros(depenses)} par mois : il vous reste ${euros(revenus - depenses)} par mois.`,
          depasses.length
            ? `Plafonds dépassés : ${depasses.map(({ c, moyenne }) => `${c.nom} (${euros(moyenne)} par mois pour un plafond de ${euros(budgets[c.id])})`).join(', ')}.`
            : 'Aucun plafond n\'est dépassé en moyenne.',
          compressibles.length
            ? `Dépenses les plus faciles à réduire : ${compressibles.map(({ c, moyenne }) => `${c.nom} (${euros(moyenne)} par mois)`).join(', ')}. Les réduire de 20 % ferait économiser environ ${euros(gain)} par mois, soit ${euros(gain * 12)} par an.`
            : '',
          pistesEnTexte(calculerPistes({ transactions, profil }, fin)),
        ].filter(Boolean).join('\n'),
      };
    }

    default:
      return {
        titre: `Total des ${nature} ${periode}`,
        barres: mois.length > 1 ? barresMois : [],
        faits: `Total des ${nature} (${portee}) ${periode} : ${euros(total)}, sur ${filtrees.length} opération(s).` +
          (mois.length > 1 ? `\nDétail : ${parMois.map((m) => `${nomMois(m.mois)} ${euros(m.valeur)}`).join(', ')}.` : ''),
      };
  }
}
