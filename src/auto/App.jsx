import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Fuel, Zap, Gauge, CalendarClock, Leaf, PiggyBank, RotateCcw, Save, X, Info, Landmark,
} from 'lucide-react';
import { Courbes, Repartition, COULEURS } from './Graphiques';
import {
  CARBURANTS, THERMIQUES, ELECTRIQUES, CLES_THERMIQUE, CLES_ELECTRIQUE, extraire, identique,
  parDefaut, charger, sauvegarder, simuler, croisement, seuilKm, euros, nombre, dureeTexte,
} from './donnees';

const champ =
  'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500/60';
const carte = 'rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5';
const bouton = 'inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 px-3 py-2 text-sm font-medium transition-colors';

const lire = (texte) => parseFloat(String(texte).replace(/\s/g, '').replace(',', '.'));
const ecrire = (n) => String(n).replace('.', ',');

// Saisie numérique tolérant la virgule ; se resynchronise quand la valeur change de l'extérieur (choix d'un modèle)
function Champ({ nom, unite, valeur, onChange, aide }) {
  const [texte, setTexte] = useState(ecrire(valeur));
  useEffect(() => {
    if (lire(texte) !== valeur) setTexte(ecrire(valeur));
  }, [valeur]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <label className="block space-y-1" title={aide}>
      <span className="flex items-center gap-1 text-xs text-gray-400">
        {nom}
        {aide && <Info size={11} className="text-gray-600" />}
      </span>
      <div className="relative">
        <input
          className={`${champ} pr-16 tabular-nums`}
          inputMode="decimal"
          value={texte}
          onChange={(e) => {
            setTexte(e.target.value);
            const n = lire(e.target.value);
            if (Number.isFinite(n) && n >= 0) onChange(n);
          }}
          onBlur={() => setTexte(ecrire(valeur))}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{unite}</span>
      </div>
    </label>
  );
}

function Curseur({ nom, valeur, min, max, pas, format, onChange, couleur = 'accent-emerald-500' }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-gray-400">{nom}</span>
        <span className="text-lg font-semibold tabular-nums text-white">{format(valeur)}</span>
      </span>
      <input
        type="range" min={min} max={max} step={pas} value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full cursor-pointer ${couleur}`}
      />
    </label>
  );
}

// Puces de modèles prédéfinis + modèles enregistrés par l'utilisateur
function Modeles({ predefinis, perso, actuel, cles, couleur, onChoisir, onEnregistrer, onSupprimer }) {
  const [nom, setNom] = useState(null);
  const tous = [...predefinis, ...perso];
  const selection = tous.find((m) => identique(m, actuel, cles));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tous.map((m) => {
          const actif = selection?.id === m.id;
          return (
            <span key={m.id} className="relative inline-flex">
              <button
                type="button"
                onClick={() => onChoisir(m)}
                title={m.detail}
                className={`${bouton} border px-2.5 py-1.5 text-xs ${m.perso ? 'pr-6' : ''} ${
                  actif ? 'text-white' : 'border-white/10 bg-transparent text-gray-400 hover:text-white'
                }`}
                style={actif ? { background: `${couleur}26`, borderColor: couleur } : undefined}
              >
                {m.nom}
              </button>
              {m.perso && (
                <button
                  type="button"
                  onClick={() => onSupprimer(m.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0.5 text-gray-500 hover:text-red-400"
                  aria-label={`Supprimer le modèle ${m.nom}`}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          );
        })}
      </div>
      <div className="flex min-h-[2rem] flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-gray-500">
          {selection ? (selection.detail ?? 'Modèle personnel') : 'Personnalisé'}
        </span>
        {nom === null ? (
          !selection && (
            <button type="button" onClick={() => setNom('')} className={`${bouton} bg-white/5 px-2.5 py-1 text-xs text-gray-300 hover:bg-white/10`}>
              <Save size={12} /> Enregistrer ce modèle
            </button>
          )
        ) : (
          <form
            className="flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (nom.trim()) onEnregistrer(nom.trim());
              setNom(null);
            }}
          >
            <input autoFocus className={`${champ} w-40 py-1 text-xs`} placeholder="Nom du modèle" value={nom} maxLength={30} onChange={(e) => setNom(e.target.value)} />
            <button type="submit" className={`${bouton} bg-emerald-500 px-2.5 py-1 text-xs text-black hover:bg-emerald-400`}>OK</button>
            <button type="button" onClick={() => setNom(null)} className={`${bouton} bg-transparent px-1.5 py-1 text-gray-500 hover:text-white`} aria-label="Annuler"><X size={14} /></button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AutoApp() {
  const [d, setD] = useState(charger);
  useEffect(() => sauvegarder(d), [d]);

  const maj = (section, cle) => (v) => setD((x) => ({ ...x, [section]: { ...x[section], [cle]: v } }));
  const u = d.usage;
  const th = d.thermique;
  const el = d.electrique;

  const choisirThermique = (m) => setD((x) => ({
    ...x,
    thermique: extraire(m, CLES_THERMIQUE),
    usage: m.carburant !== x.thermique.carburant ? { ...x.usage, prixCarburant: CARBURANTS[m.carburant].prix } : x.usage,
  }));
  const choisirCarburant = (c) => setD((x) => ({
    ...x,
    thermique: { ...x.thermique, carburant: c },
    usage: { ...x.usage, prixCarburant: CARBURANTS[c].prix },
  }));
  const enregistrerModele = (type, cles, valeurs) => (nom) => setD((x) => ({
    ...x,
    modeles: { ...x.modeles, [type]: [...x.modeles[type], { id: `perso-${Date.now()}`, nom, perso: true, ...extraire(valeurs, cles) }] },
  }));
  const supprimerModele = (type) => (id) => setD((x) => ({
    ...x,
    modeles: { ...x.modeles, [type]: x.modeles[type].filter((m) => m.id !== id) },
  }));
  const reinitialiser = () => {
    if (window.confirm('Revenir aux valeurs par défaut ? Vos modèles enregistrés sont conservés.')) {
      setD((x) => ({ ...parDefaut(), modeles: x.modeles }));
    }
  };

  const sim = useMemo(() => simuler(d), [d]);
  // Simulation prolongée pour situer le point mort même au-delà de la durée choisie
  const longue = useMemo(() => simuler(d, Math.max(u.duree, 25)), [d, u.duree]);
  const seuil = useMemo(() => seuilKm(d), [d]);

  const fin = sim.annees.at(-1);
  const economie = fin.thermique - fin.electrique;
  const pointMort = croisement(longue.annees, 'electrique', 'thermique');
  const co2Evite = fin.co2Thermique - fin.co2Electrique;
  const pointMortCO2 = croisement(longue.annees, 'co2Electrique', 'co2Thermique');
  const gagnant = economie >= 0;

  const tuiles = [
    {
      nom: 'Point mort financier',
      valeur: pointMort === null ? 'Jamais' : pointMort === 0 ? 'Immédiat' : dureeTexte(pointMort),
      note: pointMort !== null && pointMort > u.duree ? `au-delà des ${u.duree} ans simulés` : 'moment où l\'électrique devient rentable',
      icone: CalendarClock,
      couleur: 'text-sky-400', fond: 'bg-sky-500/10',
    },
    {
      nom: 'Coût au km (énergie)',
      valeur: `${nombre(sim.parKm.electrique * 100, 1)} c€`,
      note: `contre ${nombre(sim.parKm.thermique * 100, 1)} c€ en thermique`,
      icone: Gauge,
      couleur: 'text-emerald-400', fond: 'bg-emerald-500/10',
    },
    {
      nom: 'Budget courant / mois',
      valeur: euros(sim.mensuel.electrique),
      note: `contre ${euros(sim.mensuel.thermique)} · hors achat`,
      icone: PiggyBank,
      couleur: 'text-amber-400', fond: 'bg-amber-500/10',
    },
    {
      nom: `CO₂ ${co2Evite >= 0 ? 'évité' : 'en plus'} sur ${u.duree} ans`,
      valeur: `${nombre(Math.abs(co2Evite), 1)} t`,
      note: pointMortCO2 === null ? 'fabrication jamais compensée' : pointMortCO2 === 0 ? 'dès la première année' : `fabrication compensée en ${dureeTexte(pointMortCO2)}`,
      icone: Leaf,
      couleur: co2Evite >= 0 ? 'text-lime-400' : 'text-red-400', fond: 'bg-lime-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pb-24 pt-6 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-xl bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Retour au portfolio">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="m-0 text-2xl font-bold sm:text-3xl">
                <span style={{ color: COULEURS.thermique }}>Thermique</span> ou <span style={{ color: COULEURS.electrique }}>électrique</span> ?
              </h1>
              <p className="m-0 text-xs text-gray-500">Garder sa voiture ou passer à l'électrique : le vrai coût, année par année</p>
            </div>
          </div>
          <button type="button" onClick={reinitialiser} className={`${bouton} bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white`}>
            <RotateCcw size={16} /> Valeurs par défaut
          </button>
        </header>

        {/* Verdict */}
        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            borderColor: `${gagnant ? COULEURS.electrique : COULEURS.thermique}40`,
            background: `linear-gradient(to right, ${gagnant ? COULEURS.electrique : COULEURS.thermique}1f, transparent)`,
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="rounded-xl p-2.5" style={{ background: `${gagnant ? COULEURS.electrique : COULEURS.thermique}26`, color: gagnant ? COULEURS.electrique : COULEURS.thermique }}>
                {gagnant ? <Zap size={22} /> : <Fuel size={22} />}
              </span>
              <div>
                <p className="m-0 text-sm text-gray-400">Sur {u.duree} an{u.duree > 1 ? 's' : ''} et {nombre(u.km)} km/an</p>
                <p className="m-0 mt-1 text-xl font-bold sm:text-2xl">
                  {gagnant ? 'Passer à l\'électrique vous fait économiser ' : 'Garder votre thermique vous fait économiser '}
                  <span style={{ color: gagnant ? COULEURS.electrique : COULEURS.thermique }}>{euros(Math.abs(economie))}</span>
                </p>
                <p className="m-0 mt-1 text-sm text-gray-400">
                  soit {euros(Math.abs(economie) / u.duree / 12)} par mois
                  {seuil !== null && (
                    <> · l'électrique est rentable dès <strong className="text-gray-200">{nombre(Math.round(seuil / 100) * 100)} km/an</strong></>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tuiles.map(({ nom, valeur, note, icone: Icone, couleur, fond }) => (
            <div key={nom} className={`${carte} p-4`}>
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
                <span className={`rounded-lg p-1.5 ${fond} ${couleur}`}><Icone size={14} /></span>
                {nom}
              </div>
              <div className={`text-lg font-bold tabular-nums sm:text-2xl ${couleur}`}>{valeur}</div>
              <div className="mt-1 text-xs text-gray-500">{note}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Paramètres */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <section className={carte}>
              <h2 className="mb-4 mt-0 text-base font-semibold">Votre usage</h2>
              <div className="space-y-5">
                <Curseur nom="Kilométrage annuel" valeur={u.km} min={2000} max={50000} pas={500} format={(v) => `${nombre(v)} km`} onChange={maj('usage', 'km')} />
                <Curseur nom="Durée de la comparaison" valeur={u.duree} min={1} max={15} pas={1} format={(v) => `${v} an${v > 1 ? 's' : ''}`} onChange={maj('usage', 'duree')} />
                <Curseur nom="Recharge à domicile" valeur={u.partDomicile} min={0} max={100} pas={5} format={(v) => `${v} %`} onChange={maj('usage', 'partDomicile')} />
                <div className="grid grid-cols-2 gap-3">
                  <Champ nom={`Prix ${CARBURANTS[th.carburant].nom.toLowerCase()}`} unite="€/L" valeur={u.prixCarburant} onChange={maj('usage', 'prixCarburant')} />
                  <Champ nom="Électricité maison" unite="€/kWh" valeur={u.prixDomicile} onChange={maj('usage', 'prixDomicile')} aide="Tarif de votre abonnement, idéalement en heures creuses" />
                  <Champ nom="Recharge publique" unite="€/kWh" valeur={u.prixPublic} onChange={maj('usage', 'prixPublic')} aide="Prix moyen des bornes (supermarché, autoroute…)" />
                  <Champ nom="Pertes de recharge" unite="%" valeur={u.pertes} onChange={maj('usage', 'pertes')} aide="Énergie perdue entre la prise et la batterie" />
                  <Champ nom="Hausse des énergies" unite="%/an" valeur={u.inflation} onChange={maj('usage', 'inflation')} aide="Appliquée au carburant comme à l'électricité" />
                </div>
              </div>
            </section>

            <section className={carte} style={{ borderColor: `${COULEURS.thermique}30` }}>
              <h2 className="mb-4 mt-0 flex items-center gap-2 text-base font-semibold">
                <Fuel size={18} style={{ color: COULEURS.thermique }} /> Votre voiture actuelle
              </h2>
              <div className="space-y-4">
                <Modeles
                  predefinis={THERMIQUES}
                  perso={d.modeles.thermiques}
                  actuel={th}
                  cles={CLES_THERMIQUE}
                  couleur={COULEURS.thermique}
                  onChoisir={choisirThermique}
                  onEnregistrer={enregistrerModele('thermiques', CLES_THERMIQUE, th)}
                  onSupprimer={supprimerModele('thermiques')}
                />
                <div className="flex gap-1 rounded-xl bg-black/40 p-1">
                  {Object.entries(CARBURANTS).map(([id, c]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => choisirCarburant(id)}
                      className={`${bouton} flex-1 justify-center px-2 py-1.5 text-xs ${th.carburant === id ? 'bg-white/10 text-white' : 'bg-transparent text-gray-500 hover:text-white'}`}
                    >
                      {c.nom}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Champ nom="Consommation" unite="L/100" valeur={th.conso} onChange={maj('thermique', 'conso')} />
                  <Champ nom="Valeur de revente" unite="€" valeur={th.valeur} onChange={maj('thermique', 'valeur')} aide="Ce que vous en tireriez aujourd'hui (La Centrale, Argus…)" />
                  <Champ nom="Décote" unite="%/an" valeur={th.decote} onChange={maj('thermique', 'decote')} />
                  <Champ nom="Entretien & réparations" unite="€/an" valeur={th.entretien} onChange={maj('thermique', 'entretien')} />
                  <Champ nom="Hausse de l'entretien" unite="%/an" valeur={th.hausseEntretien} onChange={maj('thermique', 'hausseEntretien')} aide="Une voiture qui vieillit coûte de plus en plus cher à entretenir" />
                  <Champ nom="Assurance" unite="€/an" valeur={th.assurance} onChange={maj('thermique', 'assurance')} />
                  <Champ nom="Autres frais" unite="€/an" valeur={th.autres} onChange={maj('thermique', 'autres')} aide="Stationnement, péages, contrôle technique, restrictions ZFE…" />
                </div>
              </div>
            </section>

            <section className={carte} style={{ borderColor: `${COULEURS.electrique}30` }}>
              <h2 className="mb-4 mt-0 flex items-center gap-2 text-base font-semibold">
                <Zap size={18} style={{ color: COULEURS.electrique }} /> La voiture électrique
              </h2>
              <div className="space-y-4">
                <Modeles
                  predefinis={ELECTRIQUES}
                  perso={d.modeles.electriques}
                  actuel={el}
                  cles={CLES_ELECTRIQUE}
                  couleur={COULEURS.electrique}
                  onChoisir={(m) => setD((x) => ({ ...x, electrique: { ...x.electrique, ...extraire(m, CLES_ELECTRIQUE) } }))}
                  onEnregistrer={enregistrerModele('electriques', CLES_ELECTRIQUE, el)}
                  onSupprimer={supprimerModele('electriques')}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Champ nom="Prix d'achat" unite="€" valeur={el.prix} onChange={maj('electrique', 'prix')} />
                  <Champ nom="Aides à l'achat" unite="€" valeur={el.aides} onChange={maj('electrique', 'aides')} aide="Prime CEE « coup de pouce », aides locales… à vérifier selon vos revenus et le modèle" />
                  <Champ nom="Consommation" unite="kWh/100" valeur={el.conso} onChange={maj('electrique', 'conso')} />
                  <Champ nom="Borne à domicile" unite="€" valeur={el.borne} onChange={maj('electrique', 'borne')} aide="Wallbox installée, crédit d'impôt déduit. 0 si vous rechargez sur une prise classique" />
                  <Champ nom="Décote 1re année" unite="%" valeur={el.decote1} onChange={maj('electrique', 'decote1')} />
                  <Champ nom="Décote ensuite" unite="%/an" valeur={el.decote} onChange={maj('electrique', 'decote')} />
                  <Champ nom="Entretien" unite="€/an" valeur={el.entretien} onChange={maj('electrique', 'entretien')} />
                  <Champ nom="Assurance" unite="€/an" valeur={el.assurance} onChange={maj('electrique', 'assurance')} />
                  <Champ nom="Carte grise" unite="€" valeur={el.carteGrise} onChange={maj('electrique', 'carteGrise')} aide="Gratuite ou réduite selon les régions" />
                  <Champ nom="Autres frais" unite="€/an" valeur={el.autres} onChange={maj('electrique', 'autres')} />
                  <Champ nom="CO₂ de fabrication" unite="t" valeur={el.fabrication} onChange={maj('electrique', 'fabrication')} aide="Émissions liées à la construction du véhicule et de sa batterie. 0 pour une occasion : elle existe déjà" />
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                  <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-gray-300"><Landmark size={16} /> Financer par un crédit</span>
                    <input type="checkbox" checked={el.credit} onChange={(e) => maj('electrique', 'credit')(e.target.checked)} className="h-4 w-4 cursor-pointer accent-emerald-500" />
                  </label>
                  {el.credit && (
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <Champ nom="Apport en plus" unite="€" valeur={el.apport} onChange={maj('electrique', 'apport')} aide="En plus de la revente de votre thermique, déjà utilisée comme apport" />
                        <Champ nom="Taux" unite="%" valeur={el.taux} onChange={maj('electrique', 'taux')} />
                        <Champ nom="Durée" unite="mois" valeur={el.dureeCredit} onChange={maj('electrique', 'dureeCredit')} />
                      </div>
                      <p className="m-0 text-xs text-gray-400">
                        Emprunt de <strong className="text-gray-200">{euros(sim.emprunt)}</strong>
                        {sim.emprunt > 0 && <> · mensualité <strong className="text-gray-200">{euros(sim.mensualite)}</strong></>}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Résultats */}
          <div className="min-w-0 space-y-6 lg:col-span-3">
            <section className={carte}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">Coût cumulé</h2>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: COULEURS.thermique }} />Garder la thermique</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: COULEURS.electrique }} />Passer à l'électrique</span>
                </div>
              </div>
              <Courbes annees={sim.annees} pointMort={pointMort} />
              <p className="mb-0 mt-3 text-xs text-gray-500">
                Coût = dépenses + perte de valeur du véhicule. Dans les deux cas on part de votre thermique actuelle :
                la revendre finance une partie de l'électrique.
              </p>
            </section>

            <section className={carte}>
              <h2 className="mb-4 mt-0 text-base font-semibold">Détail sur {u.duree} an{u.duree > 1 ? 's' : ''}</h2>
              <Repartition postes={sim.postes} />
            </section>

            <section className={carte}>
              <h2 className="mb-4 mt-0 text-base font-semibold">Émissions de CO₂ cumulées</h2>
              <Courbes
                annees={sim.annees}
                pointMort={pointMortCO2}
                cles={['co2Electrique', 'co2Thermique']}
                format={(v) => `${nombre(v, 1)} t`}
                unite=" t"
              />
              <p className="mb-0 mt-3 text-xs text-gray-500">
                Carburant du puits à la roue (ADEME) et électricité au mix français ({nombre(52)} g/kWh).
                L'électrique part avec la dette carbone de sa fabrication ; votre thermique, elle, existe déjà.
              </p>
            </section>

            <p className="m-0 text-xs text-gray-600">
              Prix, aides et décotes indicatifs : ajustez-les à votre situation. Vos réglages restent dans votre navigateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
