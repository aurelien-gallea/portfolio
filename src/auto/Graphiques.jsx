import React, { useState } from 'react';
import { euros, nombre } from './donnees';

export const COULEURS = { thermique: '#fb923c', electrique: '#34d399', co2Thermique: '#fb923c', co2Electrique: '#34d399' };

// Graduations « rondes » couvrant [min, max]
function graduations(min, max, nb = 5) {
  const brut = (max - min) / nb || 1;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut);
  const debut = Math.floor(min / pas) * pas;
  const fin = Math.ceil(max / pas) * pas;
  const valeurs = [];
  for (let v = debut; v <= fin + pas / 2; v += pas) valeurs.push(v);
  return valeurs;
}

// Courbes de coût cumulé des deux scénarios, avec le point mort
export function Courbes({ annees, pointMort, cles = ['thermique', 'electrique'], format = euros, unite = '' }) {
  const [survol, setSurvol] = useState(null);
  const L = 640;
  const H = 280;
  const marge = { g: 64, d: 16, h: 16, b: 32 };
  const valeurs = annees.flatMap((a) => cles.map((c) => a[c]));
  const ticks = graduations(Math.min(0, ...valeurs), Math.max(...valeurs));
  const yMin = ticks[0];
  const yMax = ticks.at(-1);
  const n = annees.length - 1 || 1;
  const x = (annee) => marge.g + (annee / n) * (L - marge.g - marge.d);
  const y = (v) => H - marge.b - ((v - yMin) / (yMax - yMin || 1)) * (H - marge.h - marge.b);
  const chemin = (cle) => annees.map((a, i) => `${i ? 'L' : 'M'}${x(a.annee)},${y(a[cle])}`).join('');

  const actif = survol !== null ? annees[survol] : null;
  const pm = pointMort !== null && pointMort <= n ? (() => {
    const i = Math.min(Math.floor(pointMort), n - 1);
    const f = pointMort - i;
    const v = annees[i][cles[0]] + f * (annees[i + 1][cles[0]] - annees[i][cles[0]]);
    return { x: x(pointMort), y: y(v) };
  })() : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${L} ${H}`} className="h-auto w-full select-none" onMouseLeave={() => setSurvol(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={marge.g} x2={L - marge.d} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" />
            <text x={marge.g - 8} y={y(t) + 4} textAnchor="end" fontSize="11" className="fill-gray-500">
              {nombre(t)}{unite}
            </text>
          </g>
        ))}
        {annees.map((a) => (
          (n <= 12 || a.annee % 2 === 0) && (
            <text key={a.annee} x={x(a.annee)} y={H - 10} textAnchor="middle" fontSize="11" className="fill-gray-500">
              {a.annee === 0 ? 'Auj.' : `${a.annee} an${a.annee > 1 ? 's' : ''}`}
            </text>
          )
        ))}
        {actif && <line x1={x(actif.annee)} x2={x(actif.annee)} y1={marge.h} y2={H - marge.b} stroke="rgba(255,255,255,0.15)" />}
        {cles.map((c) => (
          <path key={c} d={chemin(c)} fill="none" stroke={COULEURS[c]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {actif && cles.map((c) => (
          <circle key={c} cx={x(actif.annee)} cy={y(actif[c])} r="4" fill={COULEURS[c]} stroke="#0a0a0a" strokeWidth="2" />
        ))}
        {pm && (
          <g>
            <circle cx={pm.x} cy={pm.y} r="6" fill="none" stroke="#fff" strokeWidth="2" />
            <text x={pm.x} y={pm.y - 12} textAnchor="middle" fontSize="11" fontWeight="600" className="fill-white">Point mort</text>
          </g>
        )}
        {annees.map((a, i) => (
          <rect
            key={a.annee}
            x={x(a.annee) - (L - marge.g - marge.d) / n / 2}
            y={0}
            width={(L - marge.g - marge.d) / n}
            height={H}
            fill="transparent"
            onMouseEnter={() => setSurvol(i)}
            onTouchStart={() => setSurvol(i)}
          />
        ))}
      </svg>
      {actif && (
        <div
          className="pointer-events-none absolute top-2 rounded-xl border border-white/10 bg-[#141416]/95 px-3 py-2 text-xs shadow-xl"
          style={x(actif.annee) > L / 2 ? { right: `${((L - x(actif.annee)) / L) * 100 + 2}%` } : { left: `${(x(actif.annee) / L) * 100 + 2}%` }}
        >
          <div className="mb-1 font-semibold text-gray-300">{actif.annee === 0 ? "Aujourd'hui" : `Après ${actif.annee} an${actif.annee > 1 ? 's' : ''}`}</div>
          {cles.map((c) => (
            <div key={c} className="flex items-center justify-between gap-4 tabular-nums">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="h-2 w-2 rounded-full" style={{ background: COULEURS[c] }} />
                {c === 'thermique' || c === 'co2Thermique' ? 'Thermique' : 'Électrique'}
              </span>
              <span className="font-semibold text-white">{format(actif[c])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const POSTES = [
  { cle: 'valeur', nom: 'Perte de valeur & achat', couleur: '#a78bfa' },
  { cle: 'energie', nom: 'Énergie', couleur: '#fbbf24' },
  { cle: 'entretien', nom: 'Entretien', couleur: '#60a5fa' },
  { cle: 'assurance', nom: 'Assurance', couleur: '#f472b6' },
  { cle: 'credit', nom: 'Intérêts du crédit', couleur: '#f87171' },
  { cle: 'autres', nom: 'Autres frais', couleur: '#94a3b8' },
];

// Répartition du coût total par poste, pour les deux scénarios
export function Repartition({ postes }) {
  const total = (p) => Object.values(p).reduce((s, v) => s + v, 0);
  const max = Math.max(...['thermique', 'electrique'].map((s) => POSTES.reduce((t, { cle }) => t + Math.max(0, postes[s][cle]), 0)));
  const visibles = POSTES.filter(({ cle }) => postes.thermique[cle] || postes.electrique[cle]);

  return (
    <div className="space-y-5">
      {[['thermique', 'Garder la thermique'], ['electrique', 'Passer à l\'électrique']].map(([s, nom]) => (
        <div key={s}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-gray-300">{nom}</span>
            <span className="font-semibold tabular-nums" style={{ color: COULEURS[s] }}>{euros(total(postes[s]))}</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
            {visibles.map(({ cle, couleur, nom: n }) => (
              postes[s][cle] > 0 && (
                <div key={cle} title={`${n} : ${euros(postes[s][cle])}`} style={{ width: `${(postes[s][cle] / max) * 100}%`, background: couleur }} />
              )
            ))}
          </div>
        </div>
      ))}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-xs text-gray-500">
            <th className="pb-2 text-left font-normal">Poste</th>
            <th className="pb-2 text-right font-normal">Thermique</th>
            <th className="pb-2 text-right font-normal">Électrique</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {visibles.map(({ cle, nom, couleur }) => (
            <tr key={cle} className="border-t border-white/[0.04]">
              <td className="py-2 text-gray-300">
                <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: couleur }} />
                {nom}
              </td>
              <td className="py-2 text-right text-gray-200">{euros(postes.thermique[cle])}</td>
              <td className="py-2 text-right text-gray-200">{euros(postes.electrique[cle])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
