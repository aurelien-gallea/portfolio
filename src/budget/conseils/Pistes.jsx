import React, { useMemo, useState } from 'react';
import { ExternalLink, Home, Lightbulb, AlertTriangle, ChevronDown } from 'lucide-react';
import { categorie, euros, nomMois } from '../donnees';
import { VILLES } from './reperes';
import { calculerPistes } from './moteur';

const champ =
  'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/60';
const bouton = 'inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 px-3 py-2 text-sm font-medium transition-colors';

function Profil({ profil, onModifier }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-black/30 p-3 sm:flex-row sm:items-end">
      <div className="flex items-center gap-2 text-sm text-gray-300 sm:mb-2 sm:w-40 sm:shrink-0">
        <Home size={16} className="text-orange-400" /> Mon logement
      </div>
      <label className="flex-1 space-y-1">
        <span className="text-xs text-gray-500">Ville ou secteur</span>
        <select className={`${champ} [color-scheme:dark]`} value={profil.ville ?? ''} onChange={(e) => onModifier({ ...profil, ville: e.target.value })}>
          <option value="">Choisir…</option>
          {VILLES.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
        </select>
      </label>
      <label className="space-y-1 sm:w-32">
        <span className="text-xs text-gray-500">Surface (m²)</span>
        <input
          className={champ}
          inputMode="numeric"
          placeholder="Ex. : 45"
          value={profil.surface ?? ''}
          onChange={(e) => onModifier({ ...profil, surface: e.target.value.replace(/\D/g, '').slice(0, 4) })}
        />
      </label>
    </div>
  );
}

function Piste({ piste, ouverte, onBasculer }) {
  const couleur = piste.urgent ? '#ef4444' : categorie(piste.id).couleur;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20">
      <button
        type="button"
        onClick={onBasculer}
        aria-expanded={ouverte}
        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 bg-transparent p-4 text-left text-white"
      >
        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: couleur }} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-semibold">
            {piste.urgent && <AlertTriangle size={15} className="text-red-400" />}
            {piste.titre}
          </span>
          <span className="block text-xs text-gray-500">
            {piste.repere != null && piste.part > 0
              ? `${Math.round(piste.part * 100)} % de vos revenus · repère ≈ ${Math.round(piste.repere * 100)} %`
              : piste.profilManquant ? 'Comparaison locale à compléter' : 'À regarder en priorité'}
          </span>
        </span>
        {piste.economie > 0 && (
          <span className="shrink-0 text-right">
            <span className="block text-sm font-semibold tabular-nums text-emerald-400">≈ {euros(Math.round(piste.economie))}</span>
            <span className="block text-[11px] text-gray-500">{piste.urgent ? 'de déficit / mois' : piste.id === 'logement' ? "d'écart / mois" : 'à gagner / mois'}</span>
          </span>
        )}
        <ChevronDown size={18} className={`shrink-0 text-gray-500 transition-transform ${ouverte ? 'rotate-180' : ''}`} />
      </button>

      {ouverte && (
        <div className="space-y-3 px-4 pb-4 pl-8">
          {piste.constats.map((c) => <p key={c} className="m-0 text-sm text-gray-300">{c}</p>)}
          <ul className="m-0 list-none space-y-2 p-0">
            {piste.actions.map((a) => (
              <li key={a.texte} className="flex gap-2 text-sm text-gray-400">
                <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-400" />
                {a.url ? (
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-gray-300 underline decoration-white/20 underline-offset-2 hover:text-orange-300">
                    {a.texte} <ExternalLink size={12} className="inline align-baseline" />
                  </a>
                ) : (
                  <span>{a.texte}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Pistes({ donnees, mois, onProfil }) {
  const { pistes, mois: fenetre } = useMemo(() => calculerPistes(donnees, mois), [donnees, mois]);
  const [ouverte, setOuverte] = useState(null);
  const [toutes, setToutes] = useState(false);
  const profil = donnees.profil ?? {};
  const visibles = toutes ? pistes : pistes.slice(0, 4);
  const premiere = ouverte ?? pistes[0]?.id;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
      <div className="mb-4">
        <h3 className="m-0 flex items-center gap-2 font-semibold"><Lightbulb size={18} className="text-amber-400" /> Pistes pour alléger votre budget</h3>
        <p className="m-0 mt-1 text-xs text-gray-500">
          {fenetre.length
            ? `Moyenne de ${fenetre.map((m) => nomMois(m, 'short').replace('.', '')).join(', ')}, comparée aux repères français. Ordres de grandeur indicatifs.`
            : 'Ajoutez quelques opérations pour obtenir des pistes.'}
        </p>
      </div>

      <Profil profil={profil} onModifier={onProfil} />

      <div className="mt-4 space-y-2">
        {fenetre.length > 0 && pistes.length === 0 && (
          <p className="m-0 py-4 text-center text-sm text-emerald-400">Tous vos postes sont dans les repères français. Bravo !</p>
        )}
        {visibles.map((p) => (
          <Piste
            key={p.id}
            piste={p}
            ouverte={premiere === p.id}
            onBasculer={() => setOuverte(premiere === p.id ? '' : p.id)}
          />
        ))}
        {pistes.length > 4 && (
          <button type="button" onClick={() => setToutes(!toutes)} className={`${bouton} w-full justify-center bg-transparent text-xs text-gray-400 hover:text-white`}>
            {toutes ? 'Afficher moins' : `Voir les ${pistes.length - 4} autres pistes`}
          </button>
        )}
      </div>
    </div>
  );
}
