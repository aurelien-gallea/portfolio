import React, { useMemo, useState } from 'react';
import { ExternalLink, Home, Lightbulb, AlertTriangle, ChevronDown, LocateFixed, Loader2, MapPin, Landmark } from 'lucide-react';
import { categorie, euros, nomMois } from '../donnees';
import { calculerPistes, loyerDeReference, fraisBancaires } from './moteur';
import { PARRAINAGE_BOURSOBANK } from './reperes';
import { chargerVilles, rechercherVilles, villeLaPlusProche, resumeVille, nomCourt } from './villes';

const champ =
  'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/60';
const bouton = 'inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 px-3 py-2 text-sm font-medium transition-colors';

function Bascule({ options, valeur, onChoisir }) {
  return (
    <div className="flex gap-1 rounded-xl bg-black/40 p-1">
      {options.map(([val, nom]) => (
        <button
          key={val}
          type="button"
          onClick={() => onChoisir(val)}
          aria-pressed={valeur === val}
          className={`${bouton} flex-1 justify-center px-2 py-1.5 text-xs ${valeur === val ? 'bg-white/10 text-white' : 'bg-transparent text-gray-500 hover:text-white'}`}
        >
          {nom}
        </button>
      ))}
    </div>
  );
}

const libelleVille = (v) => `${nomCourt(v.nom)} (${v.codePostal})`;

function ChoixVille({ ville, onChoisir }) {
  const [saisie, setSaisie] = useState('');
  const [villes, setVilles] = useState(null);
  const [ouvert, setOuvert] = useState(false);
  const [localisation, setLocalisation] = useState({ etat: 'repos', message: '' });

  const charger = () => { if (!villes) chargerVilles().then(setVilles); };
  const resultats = useMemo(() => (villes ? rechercherVilles(villes, saisie) : []), [villes, saisie]);

  const choisir = (v, message = '') => {
    onChoisir(resumeVille(v));
    setSaisie('');
    setOuvert(false);
    setLocalisation({ etat: 'repos', message });
  };

  const localiser = () => {
    if (!navigator.geolocation) {
      setLocalisation({ etat: 'erreur', message: "La géolocalisation n'est pas disponible dans ce navigateur." });
      return;
    }
    setLocalisation({ etat: 'recherche', message: '' });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const liste = villes ?? await chargerVilles();
        setVilles(liste);
        const { ville: proche, distanceKm } = villeLaPlusProche(liste, coords.latitude, coords.longitude);
        choisir(proche, distanceKm > 5 ? `Ville de plus de 5 000 habitants la plus proche, à ${Math.round(distanceKm)} km.` : '');
      },
      (e) => setLocalisation({
        etat: 'erreur',
        message: e.code === 1 ? 'Localisation refusée : cherchez votre ville à la main.' : 'Position introuvable : cherchez votre ville à la main.',
      }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  return (
    <div className="space-y-1">
      <span className="text-xs text-gray-500">Ville</span>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            className={champ}
            placeholder={ville ? libelleVille(ville) : 'Nom ou code postal…'}
            value={saisie}
            onFocus={() => { charger(); setOuvert(true); }}
            onBlur={() => setTimeout(() => setOuvert(false), 150)}
            onChange={(e) => { setSaisie(e.target.value); setOuvert(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && resultats[0]) { e.preventDefault(); choisir(resultats[0]); } }}
            aria-label="Rechercher une ville"
          />
          {ouvert && saisie.trim().length >= 2 && (
            <ul className="absolute left-0 right-0 top-full z-20 m-0 mt-1 max-h-64 list-none overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a1d] p-1 shadow-2xl">
              {!villes && <li className="px-3 py-2 text-xs text-gray-500">Chargement des villes…</li>}
              {villes && resultats.length === 0 && <li className="px-3 py-2 text-xs text-gray-500">Aucune ville de plus de 5 000 habitants ne correspond.</li>}
              {resultats.map((v) => (
                <li key={v.code}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choisir(v)}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10"
                  >
                    <span className="truncate">{libelleVille(v)}</span>
                    <span className="shrink-0 text-xs tabular-nums text-gray-500">{v.loyerAppartementM2.toLocaleString('fr-FR')} €/m²</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={localiser}
          disabled={localisation.etat === 'recherche'}
          className={`${bouton} shrink-0 bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-50`}
          title="Utiliser ma position (le calcul est fait dans votre navigateur)"
        >
          {localisation.etat === 'recherche' ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
          <span className="hidden sm:inline">Me localiser</span>
        </button>
      </div>
      {ville && !saisie && (
        <p className="m-0 flex items-center gap-1 text-xs text-gray-400"><MapPin size={12} className="text-orange-400" /> {libelleVille(ville)}</p>
      )}
      {localisation.message && (
        <p className={`m-0 text-xs ${localisation.etat === 'erreur' ? 'text-red-400' : 'text-gray-500'}`}>{localisation.message}</p>
      )}
    </div>
  );
}

function Profil({ profil, onModifier }) {
  const maj = (champs) => onModifier({ ...profil, ...champs });
  const reference = loyerDeReference(profil);

  return (
    <div className="space-y-3 rounded-xl bg-black/30 p-3">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Home size={16} className="text-orange-400" /> Mon logement
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Bascule options={[['locataire', 'Locataire'], ['proprietaire', 'Propriétaire (crédit)']]} valeur={profil.statut ?? 'locataire'} onChoisir={(statut) => maj({ statut })} />
        <Bascule options={[['appartement', 'Appartement'], ['maison', 'Maison']]} valeur={profil.type ?? 'appartement'} onChoisir={(type) => maj({ type })} />
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
        <ChoixVille ville={typeof profil.ville === 'object' ? profil.ville : null} onChoisir={(ville) => maj({ ville })} />
        <label className="space-y-1">
          <span className="text-xs text-gray-500">Surface (m²)</span>
          <input
            className={champ}
            inputMode="numeric"
            placeholder="Ex. : 45"
            value={profil.surface ?? ''}
            onChange={(e) => maj({ surface: e.target.value.replace(/\D/g, '').slice(0, 4) })}
          />
        </label>
      </div>
      {reference > 0 && (
        <p className="m-0 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-gray-400">
          {profil.statut === 'proprietaire' ? 'Loyer équivalent' : 'Loyer moyen'} pour {profil.type === 'maison' ? 'une maison' : 'un appartement'} de {profil.surface} m² :{' '}
          <strong className="text-sm text-white">≈ {euros(reference)}</strong> par mois, charges comprises
          <span className="block text-[11px] text-gray-600">Source : Carte des loyers 2025 (ANIL, ministère du Logement), loyers d'annonce.</span>
        </p>
      )}
    </div>
  );
}

// Encart mis en avant : frais bancaires repérés et banque en ligne (lien de parrainage)
function FraisBancaires({ parMois }) {
  return (
    <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.07] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <Landmark size={16} className="text-sky-400" /> Frais bancaires
        </span>
        {parMois > 0 && (
          <span className="text-right">
            <span className="block text-sm font-semibold tabular-nums text-sky-300">{euros(parMois * 12)}</span>
            <span className="block text-[11px] text-gray-500">par an</span>
          </span>
        )}
      </div>
      <p className="m-0 text-sm text-gray-300">
        {parMois > 0
          ? `Vous payez environ ${euros(parMois)} de frais bancaires par mois (cotisation carte, tenue de compte, commissions…).`
          : 'Cotisation carte, tenue de compte, commissions : dans une banque traditionnelle, ces frais pèsent souvent plusieurs dizaines d\'euros par an.'}
        {' '}Une banque en ligne permet en général de les supprimer.
      </p>
      {PARRAINAGE_BOURSOBANK && (
        <>
          <a
            href={PARRAINAGE_BOURSOBANK}
            target="_blank"
            rel="noreferrer sponsored"
            className={`${bouton} mt-3 w-full justify-center bg-sky-500 text-black hover:bg-sky-400 hover:text-black`}
          >
            Ouvrir un compte BoursoBank <ExternalLink size={14} />
          </a>
          <p className="m-0 mt-2 text-[11px] leading-snug text-gray-500">
            BoursoBank propose un compte et une carte sans frais de tenue de compte, sous conditions d'utilisation (voir leur grille tarifaire).
            Lien de parrainage : il peut vous donner droit à une prime de bienvenue, et m'en rapporte une aussi.
          </p>
        </>
      )}
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
  const frais = useMemo(() => fraisBancaires(donnees.transactions, mois), [donnees.transactions, mois]);
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

      <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Profil profil={profil} onModifier={onProfil} />
        <FraisBancaires parMois={frais} />
      </div>

      <div className="space-y-2 lg:col-span-3">
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
    </div>
  );
}
