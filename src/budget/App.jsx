import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Wallet, TrendingUp,
  TrendingDown, PiggyBank, Download, Upload, Search, X, Target, Sparkles, Wand2,
} from 'lucide-react';
import { Anneau, Historique } from './Graphiques';
import Pistes from './conseils/Pistes';
import {
  CATEGORIES, categorie, charger, sauvegarder, nouvelId, cleMois, aujourdhui, decalerMois,
  nomMois, euros, totaux, parCategorie, exporterCsv, importerCsv, empreinte, telecharger,
} from './donnees';

// Fonctions IA chargées à la demande : les modèles ne sont téléchargés qu'à la première utilisation
const Assistant = lazy(() => import('./ia/Assistant'));
const Categorisation = lazy(() => import('./ia/Categorisation'));

const champ =
  'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-orange-500/60';
const carte = 'rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5';
const bouton = 'inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 px-3 py-2 text-sm font-medium transition-colors';

const formulaireVide = () => ({
  type: 'depense', categorie: 'courses', libelle: '', montant: '', date: aujourdhui(),
});

function Formulaire({ initial, onValider, onAnnuler }) {
  const [f, setF] = useState(initial);
  const [erreur, setErreur] = useState('');
  const maj = (cle) => (e) => setF({ ...f, [cle]: e.target.value });

  const changerType = (type) =>
    setF({ ...f, type, categorie: CATEGORIES[type][0].id });

  const valider = (e) => {
    e.preventDefault();
    const montant = parseFloat(String(f.montant).replace(',', '.'));
    if (!montant || montant <= 0) return setErreur('Indiquez un montant positif.');
    if (!f.date) return setErreur('Indiquez une date.');
    onValider({
      ...f,
      montant: Math.round(montant * 100) / 100,
      libelle: f.libelle.trim() || categorie(f.categorie).nom,
    });
  };

  return (
    <form onSubmit={valider} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/40 p-1">
        {[['depense', 'Dépense'], ['revenu', 'Revenu']].map(([val, nom]) => (
          <button
            key={val}
            type="button"
            onClick={() => changerType(val)}
            className={`${bouton} justify-center ${
              f.type === val
                ? val === 'depense' ? 'bg-orange-500 text-black' : 'bg-emerald-500 text-black'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            {nom}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 space-y-1 sm:col-span-1">
          <span className="text-xs text-gray-400">Montant (€)</span>
          <input
            className={`${champ} text-lg font-semibold`}
            inputMode="decimal"
            placeholder="0,00"
            value={f.montant}
            onChange={maj('montant')}
            autoFocus
          />
        </label>
        <label className="col-span-2 space-y-1 sm:col-span-1">
          <span className="text-xs text-gray-400">Date</span>
          <input type="date" className={`${champ} [color-scheme:dark]`} value={f.date} onChange={maj('date')} />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs text-gray-400">Libellé</span>
        <input className={champ} placeholder="Ex. : Courses du samedi" value={f.libelle} onChange={maj('libelle')} maxLength={60} />
      </label>

      <div className="space-y-1">
        <span className="text-xs text-gray-400">Catégorie</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES[f.type].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setF({ ...f, categorie: c.id })}
              className={`${bouton} border px-2.5 py-1.5 text-xs ${
                f.categorie === c.id ? 'text-white' : 'border-white/10 bg-transparent text-gray-400 hover:text-white'
              }`}
              style={f.categorie === c.id ? { background: `${c.couleur}33`, borderColor: c.couleur } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: c.couleur }} />
              {c.nom}
            </button>
          ))}
        </div>
      </div>

      {erreur && <p className="text-sm text-red-400">{erreur}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onAnnuler} className={`${bouton} bg-white/5 text-gray-300 hover:bg-white/10`}>
          Annuler
        </button>
        <button type="submit" className={`${bouton} bg-orange-500 text-black hover:bg-orange-400`}>
          {initial.id ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}

function Fenetre({ titre, onFermer, children }) {
  useEffect(() => {
    const echap = (e) => e.key === 'Escape' && onFermer();
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [onFermer]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onFermer}>
      <div
        className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#141416] p-5 shadow-2xl sm:rounded-3xl sm:p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{titre}</h3>
          <button type="button" onClick={onFermer} className={`${bouton} bg-transparent p-1 text-gray-400 hover:text-white`} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Budgets({ budgets, depenses, onModifier, selection, onChoisir }) {
  const [edition, setEdition] = useState(false);
  const [brouillon, setBrouillon] = useState({});

  const ouvrir = () => {
    setBrouillon(Object.fromEntries(CATEGORIES.depense.map((c) => [c.id, budgets[c.id] ?? ''])));
    setEdition(true);
  };

  const enregistrer = () => {
    const propres = {};
    for (const [id, v] of Object.entries(brouillon)) {
      const n = parseFloat(String(v).replace(',', '.'));
      if (n > 0) propres[id] = n;
    }
    onModifier(propres);
    setEdition(false);
  };

  const suivis = CATEGORIES.depense.filter((c) => budgets[c.id]);

  return (
    <div className={carte}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><Target size={18} className="text-orange-400" /> Plafonds mensuels</h3>
        <button type="button" onClick={edition ? enregistrer : ouvrir} className={`${bouton} bg-white/5 py-1.5 text-xs text-gray-300 hover:bg-white/10`}>
          {edition ? 'Enregistrer' : 'Modifier'}
        </button>
      </div>

      {edition ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CATEGORIES.depense.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.couleur }} />
              <span className="w-24 shrink-0 text-gray-300">{c.nom}</span>
              <input
                className={`${champ} py-1.5`}
                inputMode="decimal"
                placeholder="—"
                value={brouillon[c.id]}
                onChange={(e) => setBrouillon({ ...brouillon, [c.id]: e.target.value })}
              />
            </label>
          ))}
        </div>
      ) : suivis.length === 0 ? (
        <p className="text-sm text-gray-500">Définissez des plafonds pour suivre vos catégories de dépenses.</p>
      ) : (
        <div className="-mx-2 space-y-1">
          {suivis.map((c) => {
            const depense = depenses[c.id] ?? 0;
            const ratio = depense / budgets[c.id];
            const couleur = ratio > 1 ? 'bg-red-500' : ratio > 0.8 ? 'bg-amber-400' : 'bg-emerald-500';
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChoisir(c.id)}
                aria-pressed={selection === c.id}
                className={`block w-full cursor-pointer rounded-xl border-0 px-2 py-2 text-left transition-colors ${
                  selection === c.id ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'
                }`}
              >
                <span className="mb-1.5 flex justify-between text-sm">
                  <span className={selection === c.id ? 'text-white' : 'text-gray-300'}>{c.nom}</span>
                  <span className={`tabular-nums ${ratio > 1 ? 'text-red-400' : 'text-gray-400'}`}>
                    {euros(depense)} / {euros(budgets[c.id])}
                  </span>
                </span>
                <span className="block h-2 overflow-hidden rounded-full bg-white/5">
                  <span className={`block h-full rounded-full ${couleur} transition-all duration-500`} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
                </span>
                {ratio > 1 && <span className="mt-1 block text-xs text-red-400">Dépassement de {euros(depense - budgets[c.id])}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BudgetApp() {
  const [donnees, setDonnees] = useState(charger);
  const [mois, setMois] = useState(() => cleMois(aujourdhui()));
  const [formulaire, setFormulaire] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('tout');
  const [assistant, setAssistant] = useState(false);
  const [categorisation, setCategorisation] = useState(false);
  const [categorieFiltre, setCategorieFiltre] = useState(null);
  const fichier = useRef(null);
  const listeOperations = useRef(null);

  // Clic sur une catégorie (graphique ou plafond) : filtre la liste, un second clic retire le filtre
  const choisirCategorie = (id) => {
    const nouvelle = categorieFiltre === id ? null : id;
    setCategorieFiltre(nouvelle);
    if (nouvelle) setFiltre('tout');
    if (nouvelle &&window.matchMedia('(max-width: 1023px)').matches) {
      listeOperations.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => { sauvegarder(donnees); }, [donnees]);
  useEffect(() => {
    const precedent = document.title;
    document.title = 'Mon Budget | Aurélien Gallea';
    return () => { document.title = precedent; };
  }, []);

  const { transactions, budgets } = donnees;

  const duMois = useMemo(
    () => transactions.filter((t) => cleMois(t.date) === mois).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, mois]
  );
  const resume = useMemo(() => totaux(duMois), [duMois]);
  const repartition = useMemo(() => parCategorie(duMois), [duMois]);
  const depensesParCat = useMemo(() => Object.fromEntries(repartition.map((r) => [r.id, r.montant])), [repartition]);

  const historique = useMemo(
    () => Array.from({ length: 6 }, (_, i) => {
      const m = decalerMois(mois, i - 5);
      return { mois: m, ...totaux(transactions.filter((t) => cleMois(t.date) === m)) };
    }),
    [transactions, mois]
  );

  const visibles = duMois.filter((t) =>
    (filtre === 'tout' || t.type === filtre) &&
    (!categorieFiltre || t.categorie === categorieFiltre) &&
    (!recherche || `${t.libelle} ${categorie(t.categorie).nom}`.toLowerCase().includes(recherche.toLowerCase()))
  );

  const nonClassees = transactions.filter((t) => t.categorie === 'autre' || t.categorie === 'autre-revenu').length;

  const tauxEpargne = resume.revenus > 0 ? Math.round((resume.solde / resume.revenus) * 100) : null;

  const enregistrer = (t) => {
    setDonnees((d) => ({
      ...d,
      transactions: t.id
        ? d.transactions.map((x) => (x.id === t.id ? t : x))
        : [...d.transactions, { ...t, id: nouvelId() }],
    }));
    setMois(cleMois(t.date));
    setFormulaire(null);
  };

  const supprimer = (id) =>
    setDonnees((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));

  const importer = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const texte = await f.text();

    if (!/\.json$/i.test(f.name)) {
      try {
        const { transactions: lues, ignorees } = importerCsv(texte);
        const connues = new Set(transactions.map(empreinte));
        const nouvelles = lues.filter((t) => !connues.has(empreinte(t)));
        const doublons = lues.length - nouvelles.length;
        if (nouvelles.length === 0) {
          window.alert(`Aucune nouvelle opération à importer${doublons ? ` (${doublons} déjà présentes)` : ''}.`);
          return;
        }
        const details = [doublons && `${doublons} doublon(s) ignoré(s)`, ignorees && `${ignorees} ligne(s) illisible(s)`]
          .filter(Boolean).join(', ');
        if (window.confirm(`Ajouter ${nouvelles.length} opération(s) à votre budget ?${details ? `\n(${details})` : ''}`)) {
          setDonnees((d) => ({ ...d, transactions: [...d.transactions, ...nouvelles] }));
          setMois(cleMois(nouvelles.map((t) => t.date).sort().at(-1)));
        }
      } catch (err) {
        window.alert(`Import CSV impossible : ${err.message}`);
      }
      return;
    }

    try {
      const lu = JSON.parse(texte);
      if (!Array.isArray(lu.transactions)) throw new Error();
      if (window.confirm(`Remplacer vos données par ${lu.transactions.length} opérations importées ?`)) {
        setDonnees({ budgets: {}, ...lu });
      }
    } catch {
      window.alert('Fichier invalide : utilisez une sauvegarde JSON exportée depuis cette page.');
    }
  };

  const appliquerCategories = (nouvelles) => {
    setDonnees((d) => ({
      ...d,
      transactions: d.transactions.map((t) => (nouvelles[t.id] ? { ...t, categorie: nouvelles[t.id] } : t)),
    }));
    setCategorisation(false);
  };

  const reinitialiser = () => {
    if (window.confirm('Effacer toutes les opérations et plafonds ? Pensez à exporter une sauvegarde avant.')) {
      setDonnees({ transactions: [], budgets: {} });
    }
  };

  // Regroupe la liste par jour
  const parJour = [];
  for (const t of visibles) {
    const dernier = parJour.at(-1);
    if (dernier && dernier.date === t.date) dernier.items.push(t);
    else parJour.push({ date: t.date, items: [t] });
  }

  const tuiles = [
    { nom: 'Revenus', valeur: euros(resume.revenus), icone: TrendingUp, couleur: 'text-emerald-400', fond: 'bg-emerald-500/10' },
    { nom: 'Dépenses', valeur: euros(resume.depenses), icone: TrendingDown, couleur: 'text-orange-400', fond: 'bg-orange-500/10' },
    { nom: 'Solde', valeur: euros(resume.solde), icone: Wallet, couleur: resume.solde >= 0 ? 'text-white' : 'text-red-400', fond: 'bg-white/5' },
    { nom: "Taux d'épargne", valeur: tauxEpargne === null ? '—' : `${tauxEpargne} %`, icone: PiggyBank, couleur: 'text-sky-400', fond: 'bg-sky-500/10' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pb-24 pt-6 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* En-tête */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-xl bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Retour au portfolio">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="m-0 text-2xl font-bold sm:text-3xl">Mon Budget</h1>
              <p className="m-0 text-xs text-gray-500">Données enregistrées uniquement dans votre navigateur</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => telecharger(exporterCsv(transactions), 'budget.csv', 'text/csv;charset=utf-8')} className={`${bouton} bg-white/5 text-gray-300 hover:bg-white/10`} title="Exporter en CSV (Excel)">
              <Download size={16} /> CSV
            </button>
            <button type="button" onClick={() => telecharger(JSON.stringify(donnees, null, 2), 'budget-sauvegarde.json', 'application/json')} className={`${bouton} bg-white/5 text-gray-300 hover:bg-white/10`} title="Sauvegarder toutes les données">
              <Download size={16} /> Sauvegarde
            </button>
            <button type="button" onClick={() => fichier.current?.click()} className={`${bouton} bg-white/5 text-gray-300 hover:bg-white/10`} title="Importer un CSV (relevé bancaire ou export) ou restaurer une sauvegarde JSON">
              <Upload size={16} /> Importer
            </button>
            <button type="button" onClick={reinitialiser} className={`${bouton} bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-300`} title="Tout effacer" aria-label="Tout effacer">
              <Trash2 size={16} />
            </button>
            <input ref={fichier} type="file" accept=".csv,.txt,text/csv,application/json,.json" className="hidden" onChange={importer} />
          </div>
        </header>

        {/* Sélecteur de mois */}
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2">
          <button type="button" onClick={() => setMois(decalerMois(mois, -1))} className={`${bouton} bg-transparent text-gray-400 hover:bg-white/5 hover:text-white`} aria-label="Mois précédent">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="text-lg font-semibold capitalize">{nomMois(mois)}</div>
            {mois !== cleMois(aujourdhui()) && (
              <button type="button" onClick={() => setMois(cleMois(aujourdhui()))} className="cursor-pointer border-0 bg-transparent p-0 text-xs text-orange-400 hover:underline">
                Revenir au mois en cours
              </button>
            )}
          </div>
          <button type="button" onClick={() => setMois(decalerMois(mois, 1))} className={`${bouton} bg-transparent text-gray-400 hover:bg-white/5 hover:text-white`} aria-label="Mois suivant">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Indicateurs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tuiles.map(({ nom, valeur, icone: Icone, couleur, fond }) => (
            <div key={nom} className={`${carte} p-4`}>
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
                <span className={`rounded-lg p-1.5 ${fond} ${couleur}`}><Icone size={14} /></span>
                {nom}
              </div>
              <div className={`text-lg font-bold tabular-nums sm:text-2xl ${couleur}`}>{valeur}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Colonne graphiques */}
          <div className="space-y-6 lg:col-span-2">
            <div className={carte}>
              <h3 className="mb-4 mt-0 font-semibold">Répartition des dépenses</h3>
              <Anneau parts={repartition} total={resume.depenses} selection={categorieFiltre} onChoisir={choisirCategorie} />
            </div>
            <div className={carte}>
              <h3 className="mb-4 mt-0 font-semibold">6 derniers mois</h3>
              <Historique mois={historique} moisActif={mois} onChoisir={setMois} />
            </div>
            <Budgets budgets={budgets} depenses={depensesParCat} onModifier={(b) => setDonnees((d) => ({ ...d, budgets: b }))} selection={categorieFiltre} onChoisir={choisirCategorie} />
          </div>

          {/* Colonne opérations */}
          <div ref={listeOperations} className={`${carte} scroll-mt-4 lg:col-span-3`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="m-0 font-semibold">Opérations <span className="text-sm font-normal text-gray-500">({duMois.length})</span></h3>
              <button type="button" onClick={() => setFormulaire({ ...formulaireVide(), date: mois === cleMois(aujourdhui()) ? aujourdhui() : `${mois}-01` })} className={`${bouton} bg-orange-500 text-black hover:bg-orange-400`}>
                <Plus size={16} /> Ajouter
              </button>
            </div>

            {nonClassees > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-500/20 bg-orange-500/[0.06] px-3 py-2.5 text-sm">
                <span className="text-gray-300">{nonClassees} opération(s) classée(s) dans « Autre »</span>
                <button type="button" onClick={() => setCategorisation(true)} className={`${bouton} bg-orange-500/15 py-1.5 text-xs text-orange-300 hover:bg-orange-500/25`}>
                  <Wand2 size={14} /> Catégoriser avec l'IA
                </button>
              </div>
            )}

            {categorieFiltre && (() => {
              const c = categorie(categorieFiltre);
              const depense = depensesParCat[c.id] ?? 0;
              const plafond = budgets[c.id];
              return (
                <div
                  className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm"
                  style={{ borderColor: `${c.couleur}55`, background: `${c.couleur}14` }}
                >
                  <span className="flex items-center gap-2 text-gray-200">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.couleur }} />
                    <strong className="font-semibold">{c.nom}</strong>
                    <span className="tabular-nums text-gray-400">
                      {euros(depense)}{plafond ? ` / ${euros(plafond)}` : ''}
                    </span>
                    {plafond && depense > plafond && (
                      <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-xs text-red-300">
                        +{euros(depense - plafond)}
                      </span>
                    )}
                  </span>
                  <button type="button" onClick={() => setCategorieFiltre(null)} className={`${bouton} bg-white/5 py-1 text-xs text-gray-300 hover:bg-white/10`}>
                    <X size={14} /> Toutes les catégories
                  </button>
                </div>
              );
            })()}

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input className={`${champ} pl-9`} placeholder="Rechercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              </div>
              <div className="flex gap-1 rounded-xl bg-black/40 p-1">
                {[['tout', 'Tout'], ['depense', 'Dépenses'], ['revenu', 'Revenus']].map(([val, nom]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFiltre(val)}
                    className={`${bouton} flex-1 px-3 py-1.5 text-xs ${filtre === val ? 'bg-white/10 text-white' : 'bg-transparent text-gray-500 hover:text-white'}`}
                  >
                    {nom}
                  </button>
                ))}
              </div>
            </div>

            {parJour.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">
                {duMois.length === 0 ? 'Aucune opération ce mois-ci. Ajoutez-en une pour commencer.' : 'Aucun résultat.'}
              </div>
            ) : (
              <div className="space-y-5">
                {parJour.map((jour) => (
                  <div key={jour.date}>
                    <div className="mb-1 text-xs font-medium capitalize text-gray-500">
                      {new Date(`${jour.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <ul className="m-0 list-none divide-y divide-white/[0.04] p-0">
                      {jour.items.map((t) => {
                        const c = categorie(t.categorie);
                        return (
                          <li key={t.id} className="group flex items-center gap-3 py-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold" style={{ background: `${c.couleur}22`, color: c.couleur }}>
                              {c.nom.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm text-gray-100">{t.libelle}</div>
                              <div className="text-xs text-gray-500">{c.nom}</div>
                            </div>
                            <span className={`shrink-0 text-sm font-semibold tabular-nums ${t.type === 'revenu' ? 'text-emerald-400' : 'text-gray-200'}`}>
                              {t.type === 'revenu' ? '+' : '−'}{euros(t.montant)}
                            </span>
                            <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                              <button type="button" onClick={() => setFormulaire({ ...t, montant: String(t.montant).replace('.', ',') })} className={`${bouton} bg-transparent p-1.5 text-gray-500 hover:bg-white/5 hover:text-white`} aria-label="Modifier">
                                <Pencil size={14} />
                              </button>
                              <button type="button" onClick={() => supprimer(t.id)} className={`${bouton} bg-transparent p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400`} aria-label="Supprimer">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Pistes donnees={donnees} mois={mois} onProfil={(profil) => setDonnees((d) => ({ ...d, profil }))} />
      </div>

      {categorisation && (
        <Fenetre titre="Catégorisation automatique" onFermer={() => setCategorisation(false)}>
          <Suspense fallback={null}>
            <Categorisation transactions={transactions} onAppliquer={appliquerCategories} onFermer={() => setCategorisation(false)} />
          </Suspense>
        </Fenetre>
      )}

      {assistant ? (
        <Suspense fallback={null}>
          <Assistant donnees={donnees} onFermer={() => setAssistant(false)} />
        </Suspense>
      ) : (
        <button type="button" onClick={() => setAssistant(true)} className={`${bouton} fixed bottom-6 right-6 z-40 rounded-full bg-orange-500 px-5 py-3 text-black shadow-lg shadow-orange-500/20 hover:bg-orange-400`}>
          <Sparkles size={18} /> Assistant IA
        </button>
      )}

      {formulaire && (
        <Fenetre titre={formulaire.id ? "Modifier l'opération" : 'Nouvelle opération'} onFermer={() => setFormulaire(null)}>
          <Formulaire initial={formulaire} onValider={enregistrer} onAnnuler={() => setFormulaire(null)} />
        </Fenetre>
      )}
    </div>
  );
}
