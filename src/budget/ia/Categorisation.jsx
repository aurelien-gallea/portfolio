import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { proposerCategories } from './categoriser';
import { categorie, euros } from '../donnees';

const bouton = 'inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 px-3 py-2 text-sm font-medium transition-colors';

// Contenu de la fenêtre « Catégoriser avec l'IA » : calcul, puis revue des propositions
export default function Categorisation({ transactions, onAppliquer, onFermer }) {
  const [etat, setEtat] = useState({ etape: 'chargement', progression: 0, taille: 0 });
  const [retenues, setRetenues] = useState(new Set());

  useEffect(() => {
    let actif = true;
    proposerCategories(transactions, (progression, taille) => actif && setEtat({ etape: 'chargement', progression, taille }))
      .then((propositions) => {
        if (!actif) return;
        setRetenues(new Set(propositions.map((p) => p.transaction.id)));
        setEtat({ etape: 'revue', propositions });
      })
      .catch((e) => actif && setEtat({ etape: 'erreur', message: e.message }));
    return () => { actif = false; };
    // Calcul unique à l'ouverture de la fenêtre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (etat.etape === 'chargement') {
    const pct = Math.round(etat.progression * 100);
    return (
      <div className="space-y-4 py-4 text-sm text-gray-300">
        <p className="m-0 flex items-center gap-2"><Loader2 size={16} className="animate-spin text-orange-400" />
          {pct < 100 && etat.taille ? `Téléchargement du modèle (${Math.round(etat.taille / 1e6)} Mo, une seule fois)…` : 'Analyse des libellés…'}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${pct || 3}%` }} />
        </div>
        <p className="m-0 text-xs text-gray-500">
          Le modèle multilingue e5-small tourne dans votre navigateur : vos opérations ne sont envoyées nulle part.
        </p>
      </div>
    );
  }

  if (etat.etape === 'erreur') {
    return <p className="text-sm text-red-400">Impossible de charger le modèle : {etat.message}</p>;
  }

  const { propositions } = etat;
  if (propositions.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-400">Le modèle n'est assez sûr d'aucune catégorie pour ces opérations. Classez-en quelques-unes à la main : il s'en servira d'exemples la prochaine fois.</p>
        <div className="flex justify-end"><button type="button" onClick={onFermer} className={`${bouton} bg-white/5 text-gray-300 hover:bg-white/10`}>Fermer</button></div>
      </div>
    );
  }

  const basculer = (id) => setRetenues((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const appliquer = () => {
    onAppliquer(Object.fromEntries(propositions.filter((p) => retenues.has(p.transaction.id)).map((p) => [p.transaction.id, p.categorie])));
  };

  return (
    <div className="space-y-4">
      <p className="m-0 text-sm text-gray-400">
        {propositions.length} proposition(s). Décochez celles qui vous semblent fausses.
      </p>
      <ul className="m-0 max-h-[50vh] list-none space-y-1 overflow-y-auto p-0">
        {propositions.map(({ transaction: t, categorie: id, confiance }) => {
          const c = categorie(id);
          const coche = retenues.has(t.id);
          return (
            <li key={t.id}>
              <button type="button" onClick={() => basculer(t.id)} className={`${bouton} w-full bg-transparent px-2 text-left hover:bg-white/5 ${coche ? 'text-gray-100' : 'text-gray-500'}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${coche ? 'border-orange-500 bg-orange-500 text-black' : 'border-white/20'}`}>
                  {coche && <Check size={14} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{t.libelle}</span>
                  <span className="text-xs text-gray-500">{euros(t.montant)} · confiance {Math.round(confiance * 100)} %</span>
                </span>
                <span className="shrink-0 rounded-lg px-2 py-1 text-xs" style={{ background: `${c.couleur}22`, color: c.couleur }}>{c.nom}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onFermer} className={`${bouton} bg-white/5 text-gray-300 hover:bg-white/10`}>Annuler</button>
        <button type="button" onClick={appliquer} disabled={retenues.size === 0} className={`${bouton} bg-orange-500 text-black hover:bg-orange-400 disabled:opacity-40`}>
          Appliquer ({retenues.size})
        </button>
      </div>
    </div>
  );
}
