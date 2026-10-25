import React, { useEffect } from 'react';
import { X, Gauge, PlugZap, Tag, Wrench, CalendarClock, MapPin } from 'lucide-react';
import { euros, nombre, dureeTexte } from './donnees';

function Fenetre({ titre, onFermer, children }) {
  useEffect(() => {
    const echap = (e) => e.key === 'Escape' && onFermer();
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [onFermer]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onFermer}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141416] p-5 shadow-2xl sm:rounded-3xl sm:p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="m-0 text-lg font-semibold">{titre}</h3>
          <button type="button" onClick={onFermer} className="cursor-pointer rounded-lg border-0 bg-transparent p-1 text-gray-400 hover:text-white" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Les critères qui font pencher la balance, illustrés avec les réglages en cours
export default function Conseils({ d, sim, seuil, pointMort, onFermer }) {
  const { usage: u, thermique: th, electrique: el } = d;
  const gainKm = sim.parKm.thermique - sim.parKm.electrique;
  const gainAn = gainKm * u.km;
  const kmPublic = ((el.conso / 100) * (1 + u.pertes / 100)) * u.prixPublic;
  const achatNet = el.prix - el.aides - th.valeur;

  const points = [
    {
      icone: Gauge,
      titre: 'Vos kilomètres annuels',
      texte: "C'est le critère n°1 : chaque kilomètre en électrique coûte moins cher en énergie, donc plus vous roulez, plus vite l'achat est amorti. Sous 10 000 km/an, c'est rarement rentable sur le seul plan financier.",
      vous: gainKm > 0
        ? `Vous économisez ${nombre(gainKm * 100, 1)} c€ par km, soit ${euros(gainAn)} par an à ${nombre(u.km)} km.${seuil !== null ? ` L'électrique devient rentable dès ${nombre(Math.round(seuil / 100) * 100)} km/an.` : ''}`
        : "Avec vos prix d'énergie, l'électrique ne coûte pas moins cher au km : il ne sera pas rentable financièrement.",
    },
    {
      icone: PlugZap,
      titre: 'Pouvoir recharger chez soi',
      texte: "Recharger à la maison, surtout en heures creuses, coûte 3 à 4 fois moins cher qu'aux bornes rapides. Sans prise ni borne à domicile (ou au travail), l'économie d'énergie fond fortement.",
      vous: `Votre kWh moyen revient à ${nombre(sim.prixKwh, 2)} €. En ne rechargeant qu'aux bornes publiques, le km coûterait ${nombre(kmPublic * 100, 1)} c€ au lieu de ${nombre(sim.parKm.electrique * 100, 1)} c€ (thermique : ${nombre(sim.parKm.thermique * 100, 1)} c€).`,
    },
    {
      icone: Tag,
      titre: "Le prix d'achat et la décote",
      texte: "C'est le poste le plus lourd. Une électrique d'occasion récente (2 à 4 ans) a déjà subi la plus grosse décote : c'est souvent le meilleur compromis. Pensez aux aides à l'achat et comparez avec la valeur de revente de votre voiture.",
      vous: `Changer vous coûte ${euros(achatNet)} aujourd'hui (prix − aides − revente de votre thermique), à récupérer grâce aux économies d'usage.`,
    },
    {
      icone: Wrench,
      titre: "L'état de votre voiture actuelle",
      texte: "Une thermique fiable, déjà amortie, qui vaut peu à la revente est difficile à battre : la garder est souvent le plus économique. À l'inverse, si de grosses réparations approchent (distribution, embrayage, boîte, FAP…), ajoutez-les à l'entretien : elles peuvent faire basculer le calcul.",
      vous: `Le simulateur compte ${euros(th.entretien)} d'entretien la 1re année, en hausse de ${nombre(th.hausseEntretien)} % par an.`,
    },
    {
      icone: CalendarClock,
      titre: 'Combien de temps vous la garderez',
      texte: "Le surcoût à l'achat se rattrape petit à petit. Si vous changez de voiture tous les 3 ou 4 ans, le point mort risque de ne jamais être atteint ; si vous la gardez 8 à 10 ans, c'est bien plus favorable.",
      vous: pointMort === null
        ? "Avec vos réglages, l'électrique ne rattrape jamais la thermique."
        : pointMort === 0
          ? "Avec vos réglages, l'électrique est moins chère dès le départ."
          : `Avec vos réglages, le point mort arrive au bout de ${dureeTexte(pointMort)}${pointMort > u.duree ? `, après les ${u.duree} ans simulés` : ''}.`,
    },
    {
      icone: MapPin,
      titre: 'Ce que le calcul ne voit pas',
      texte: "Zones à faibles émissions (ZFE) qui interdiront votre Crit'Air, stationnement gratuit ou réduit, avantages en entreprise, mais aussi vos longs trajets (temps de recharge) : ajoutez-les dans « Autres frais » ou pesez-les à part.",
    },
  ];

  return (
    <Fenetre titre="Est-ce rentable de passer à l'électrique ?" onFermer={onFermer}>
      <p className="mb-4 mt-0 text-sm text-gray-400">
        Le simulateur additionne tout ce que chaque option vous coûte : énergie, entretien, assurance, crédit, et la valeur que perd la voiture.
        L'électrique est rentable quand ses économies d'usage dépassent son surcoût à l'achat. Six points font pencher la balance :
      </p>
      <ol className="m-0 list-none space-y-3 p-0">
        {points.map(({ icone: Icone, titre, texte, vous }, i) => (
          <li key={titre} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="mb-1.5 flex items-center gap-2 font-semibold">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"><Icone size={15} /></span>
              {i + 1}. {titre}
            </div>
            <p className="m-0 text-sm text-gray-300">{texte}</p>
            {vous && <p className="m-0 mt-2 rounded-lg bg-black/30 px-3 py-2 text-xs text-gray-400"><strong className="text-gray-200">Pour vous : </strong>{vous}</p>}
          </li>
        ))}
      </ol>
      <p className="mb-0 mt-4 text-xs text-gray-500">
        En résumé : beaucoup de kilomètres, une recharge à domicile, une voiture gardée longtemps et une thermique qui commence à coûter cher
        sont les signes que l'électrique sera rentable.
      </p>
    </Fenetre>
  );
}
