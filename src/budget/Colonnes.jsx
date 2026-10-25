import React, { useMemo, useState } from 'react';
import { AlertTriangle, Upload } from 'lucide-react';
import { convertirCsv, erreurColonnes, euros, categorie } from './donnees';

const champ =
  'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/60';

// Rôles proposés, dans l'ordre d'affichage ; « requis » n'est qu'une indication visuelle
const ROLES = [
  { cle: 'date', nom: 'Date', requis: true },
  { cle: 'libelle', nom: 'Libellé' },
  { cle: 'montant', nom: 'Montant (signé)' },
  { cle: 'debit', nom: 'Débit' },
  { cle: 'credit', nom: 'Crédit' },
  { cle: 'type', nom: 'Sens (dépense / revenu, IN / OUT…)' },
  { cle: 'categorie', nom: 'Catégorie de la banque' },
];

const lettre = (i) => (i < 26 ? String.fromCharCode(65 + i) : `C${i + 1}`);
const apercu = (v) => (v && v.length > 18 ? `${v.slice(0, 18)}…` : v || '');

// Correspondance manuelle des colonnes d'un relevé CSV que la détection automatique n'a pas su lire
export default function Colonnes({ analyse, nom, raison, onValider, onAnnuler }) {
  const { lignes } = analyse;
  const [debut, setDebut] = useState(analyse.debut);
  const [col, setCol] = useState(analyse.col);
  const [formatDate, setFormatDate] = useState(analyse.formatDate);
  const [inverser, setInverser] = useState(analyse.inverser);

  const largeur = Math.max(...lignes.slice(0, 200).map((l) => l.length));
  const entete = debut > 0 ? lignes[debut - 1] : [];
  const exemples = lignes.slice(debut, debut + 5);
  const reglages = { lignes, debut, col, formatDate, inverser };
  const erreur = erreurColonnes(reglages);
  const resultat = useMemo(() => (erreur ? null : convertirCsv(reglages)), [lignes, debut, col, formatDate, inverser, erreur]);

  const nomColonne = (i) => {
    const titre = entete[i];
    const exemple = exemples.map((l) => l[i]).find(Boolean);
    return `${lettre(i)}${titre ? ` · ${apercu(titre)}` : ''}${exemple && exemple !== titre ? ` (ex. ${apercu(exemple)})` : ''}`;
  };
  const roleDe = (i) => ROLES.find((r) => col[r.cle] === i);
  const choisir = (cle, valeur) => setCol((c) => ({ ...c, [cle]: Number(valeur) }));

  return (
    <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1 text-sm text-gray-300">
      <p className="m-0 flex gap-2 rounded-xl bg-amber-500/10 p-3 text-amber-200">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>{raison} Indiquez quelle colonne de « {nom} » contient quoi : l'aperçu en bas se met à jour.</span>
      </p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {Array.from({ length: largeur }, (_, i) => {
                const role = roleDe(i);
                return (
                  <th key={i} className={`whitespace-nowrap border-0 border-b border-white/10 px-2 py-1.5 text-left font-medium ${role ? 'bg-orange-500/15 text-orange-300' : 'text-gray-500'}`}>
                    {lettre(i)}{entete[i] ? ` · ${apercu(entete[i])}` : ''}
                    {role && <span className="block text-[10px] uppercase tracking-wide">{role.nom}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {exemples.map((l, n) => (
              <tr key={n}>
                {Array.from({ length: largeur }, (_, i) => (
                  <td key={i} className={`whitespace-nowrap border-0 border-b border-white/5 px-2 py-1 ${roleDe(i) ? 'text-white' : 'text-gray-500'}`}>
                    {apercu(l[i])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ROLES.map((r) => (
          <label key={r.cle} className="space-y-1">
            <span className="text-xs text-gray-400">{r.nom}{r.requis && <span className="text-orange-400"> *</span>}</span>
            <select value={col[r.cle] ?? -1} onChange={(e) => choisir(r.cle, e.target.value)} className={champ}>
              <option value={-1}>— Aucune —</option>
              {Array.from({ length: largeur }, (_, i) => <option key={i} value={i}>{nomColonne(i)}</option>)}
            </select>
          </label>
        ))}
        <label className="space-y-1">
          <span className="text-xs text-gray-400">Première opération à la ligne</span>
          <input
            type="number" min={1} max={lignes.length} value={debut + 1}
            onChange={(e) => setDebut(Math.min(Math.max(Number(e.target.value) || 1, 1), lignes.length) - 1)}
            className={champ}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-400">Format des dates</span>
          <select value={formatDate} onChange={(e) => setFormatDate(e.target.value)} className={champ}>
            <option value="jma">Jour / mois / année (05/10/2026)</option>
            <option value="mja">Mois / jour / année (10/05/2026)</option>
          </select>
        </label>
      </div>
      <p className="m-0 text-xs text-gray-500">
        Un seul montant avec un signe (négatif = dépense) ou accompagné d'une colonne de sens, ou bien deux colonnes débit et crédit. La catégorie de la banque est facultative : elle aide à classer les opérations.
      </p>
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <input type="checkbox" checked={inverser} onChange={(e) => setInverser(e.target.checked)} />
        Les dépenses sont en positif dans ce fichier (inverser les signes)
      </label>

      <div className="rounded-xl bg-white/[0.03] p-3">
        {erreur ? (
          <p className="m-0 text-amber-300">{erreur}</p>
        ) : (
          <>
            <p className="m-0 mb-2 text-white">
              {resultat.transactions.length} opération(s) lue(s)
              {resultat.ignorees > 0 && <span className="text-amber-300"> · {resultat.ignorees} ligne(s) illisible(s)</span>}
              {resultat.internes > 0 && <span className="text-gray-400"> · {resultat.internes} virement(s) interne(s) écarté(s)</span>}
            </p>
            <ul className="m-0 list-none space-y-1 p-0 text-xs">
              {resultat.transactions.slice(0, 4).map((t) => (
                <li key={t.id} className="flex justify-between gap-3">
                  <span className="truncate">{t.date} · {t.libelle} <span className="text-gray-500">({categorie(t.categorie).nom})</span></span>
                  <span className={t.type === 'depense' ? 'text-red-300' : 'text-emerald-300'}>{t.type === 'depense' ? '−' : '+'}{euros(t.montant)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onAnnuler} className="cursor-pointer rounded-xl border-0 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10">
          Annuler
        </button>
        <button
          type="button"
          disabled={!resultat?.transactions.length}
          onClick={() => onValider(resultat)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-orange-500 px-3 py-2 text-sm font-medium text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Upload size={15} /> Importer {resultat?.transactions.length ?? 0} opération(s)
        </button>
      </div>
    </div>
  );
}
