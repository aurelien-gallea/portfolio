import React, { useState } from 'react';
import { euros, nomMois } from './donnees';

// Anneau de répartition des dépenses par catégorie
export function Anneau({ parts, total, selection, onChoisir }) {
  const [survol, setSurvol] = useState(null);
  const rayon = 70;
  const circonference = 2 * Math.PI * rayon;
  let cumul = 0;

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        Aucune dépense ce mois-ci
      </div>
    );
  }

  // Le survol prime, sinon on garde en évidence la catégorie sélectionnée
  const enAvant = survol ?? selection;
  const actif = enAvant ? parts.find((p) => p.id === enAvant) : null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0 -rotate-90">
        <circle cx="90" cy="90" r={rayon} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="22" />
        {parts.map((p) => {
          const longueur = (p.montant / total) * circonference;
          const segment = (
            <circle
              key={p.id}
              cx="90"
              cy="90"
              r={rayon}
              fill="none"
              stroke={p.couleur}
              strokeWidth={enAvant === p.id ? 28 : 22}
              strokeDasharray={`${Math.max(longueur - 2, 0.5)} ${circonference}`}
              strokeDashoffset={-cumul}
              className="cursor-pointer transition-all duration-200"
              style={{ opacity: enAvant && enAvant !== p.id ? 0.35 : 1 }}
              onMouseEnter={() => setSurvol(p.id)}
              onMouseLeave={() => setSurvol(null)}
              onClick={() => onChoisir(p.id)}
            />
          );
          cumul += longueur;
          return segment;
        })}
        <g className="rotate-90" style={{ transformOrigin: '90px 90px' }}>
          <text x="90" y="84" textAnchor="middle" className="fill-gray-400" fontSize="11">
            {actif ? actif.nom : 'Total'}
          </text>
          <text x="90" y="104" textAnchor="middle" className="fill-white" fontSize="16" fontWeight="700">
            {euros(actif ? actif.montant : total)}
          </text>
        </g>
      </svg>

      <ul className="m-0 w-full list-none space-y-1 p-0 text-sm">
        {parts.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onChoisir(p.id)}
              onMouseEnter={() => setSurvol(p.id)}
              onMouseLeave={() => setSurvol(null)}
              aria-pressed={selection === p.id}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border-0 px-2 py-1.5 text-left text-sm transition-colors ${
                selection === p.id ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'
              }`}
            >
              <span className={`flex items-center gap-2 ${selection === p.id ? 'text-white' : 'text-gray-300'}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.couleur }} />
                {p.nom}
              </span>
              <span className="tabular-nums text-gray-400">
                {euros(p.montant)} · {Math.round((p.montant / total) * 100)}&nbsp;%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Barres revenus / dépenses sur les derniers mois
export function Historique({ mois, moisActif, onChoisir }) {
  const max = Math.max(1, ...mois.flatMap((m) => [m.revenus, m.depenses]));

  return (
    <div>
      <div className="flex h-44 items-end justify-between gap-2 sm:gap-4">
        {mois.map((m) => (
          <button
            key={m.mois}
            type="button"
            onClick={() => onChoisir(m.mois)}
            title={`${nomMois(m.mois)} : +${euros(m.revenus)} / -${euros(m.depenses)}`}
            className={`group flex h-full flex-1 flex-col items-center justify-end gap-2 rounded-xl border-0 bg-transparent p-1 transition-colors ${
              m.mois === moisActif ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="w-1/3 max-w-[18px] rounded-t-md bg-emerald-500/80 transition-all duration-500"
                style={{ height: `${(m.revenus / max) * 100}%`, minHeight: m.revenus ? 3 : 0 }}
              />
              <div
                className="w-1/3 max-w-[18px] rounded-t-md bg-orange-500/80 transition-all duration-500"
                style={{ height: `${(m.depenses / max) * 100}%`, minHeight: m.depenses ? 3 : 0 }}
              />
            </div>
            <span className={`text-[11px] capitalize ${m.mois === moisActif ? 'text-white' : 'text-gray-500'}`}>
              {nomMois(m.mois, 'short').replace('.', '')}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-5 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" />Revenus</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-orange-500" />Dépenses</span>
      </div>
    </div>
  );
}
