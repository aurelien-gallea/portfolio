import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Graphique from './Graphique';
import { analyser, ema, vwapCumule, LEVIER, SEUIL, TICKER } from './analyse';
import { chargerTout, enregistrerCles, lireCles } from './donnees';
import './scalper.css';

const VERT = '#2ecc71', ROUGE = '#e74c3c', JAUNE = '#f1c40f', BLEU = '#2d6cdf';
const ACTUALISATION_MS = 60_000; // 1 req/min Twelve Data : ~390 sur une séance (800/jour)

const couleur = v => (v == null ? '' : v > 0 ? 'sn-vert' : v < 0 ? 'sn-rouge' : '');
const pct = (v, d = 2) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(d)} %`);

function FormulaireCles({ cles, onValider }) {
  const [twelve, setTwelve] = useState(cles.twelve || '');
  const [finnhub, setFinnhub] = useState(cles.finnhub || '');
  return (
    <form className="sn-cles" onSubmit={e => { e.preventDefault(); onValider({ twelve, finnhub }); }}>
      <h2>Clés d'API</h2>
      <p>Gardées uniquement dans ce navigateur.</p>
      <label>
        Twelve Data (obligatoire, bougies temps réel)
        <input value={twelve} onChange={e => setTwelve(e.target.value.trim())} required />
      </label>
      <label>
        Finnhub (facultatif : prix live, statut du marché, résultats)
        <input value={finnhub} onChange={e => setFinnhub(e.target.value.trim())} />
      </label>
      <button type="submit">Enregistrer</button>
    </form>
  );
}

function PanneauSignal({ res, maj, marcheOuvert }) {
  const coul = res.score >= SEUIL ? VERT : res.score <= -SEUIL ? ROUGE : JAUNE;
  return (
    <section className="sn-panneau">
      <div className="sn-decision" style={{ color: coul }}>{res.decision}</div>
      <div className="sn-info">
        {TICKER} {res.prix.toFixed(2)} | score {res.score > 0 ? '+' : ''}{res.score} | {maj}
        {marcheOuvert === false && <div>⚠ Marché US fermé</div>}
      </div>

      <table className="sn-table">
        <thead>
          <tr><th /><th>QQQ</th><th>3QQQ ≈</th><th>3QSS ≈</th></tr>
        </thead>
        <tbody>
          {res.perfs.map(p => (
            <tr key={p.nom}>
              <td>{p.nom}</td>
              {[p.qqq, p.long, p.short].map((v, i) => <td key={i} className={couleur(v)}>{pct(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="sn-table">
        <tbody>
          {res.autres.map(([nom, texte, v]) => (
            <tr key={nom}><td>{nom}</td><td className={couleur(v)}>{texte ?? pct(v)}</td></tr>
          ))}
        </tbody>
      </table>

      <PanneauSortie res={res} />

      <ul className="sn-raisons">
        {res.raisons.map(r => (
          <li key={r.texte} className={r.sens > 0 ? 'sn-vert' : 'sn-rouge'}>
            {r.sens > 0 ? '▲' : '▼'} <span>{r.texte}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function lireCoursEtp() {
  try { return JSON.parse(localStorage.getItem('sn-etp')) || {}; } catch { return {}; }
}

const euros = v => `${v.toFixed(3).replace('.', ',')} €`;
const PRODUITS = [
  { cle: 'long', nom: '3QQQ', detail: 'long x3', levier: LEVIER },
  { cle: 'short', nom: '3QSS', detail: 'short x3', levier: -LEVIER },
];

// Cours Trade Republic saisi une fois, puis suivi avec le QQQ x3 (hors effet euro/dollar)
function coursEstime(saisie, prixQqq, levier) {
  if (!saisie?.cours || !saisie.qqq) return null;
  return saisie.cours * (1 + levier * (prixQqq / saisie.qqq - 1));
}

function PanneauSortie({ res }) {
  const [horizon, setHorizon] = useState(0);
  const [etp, setEtp] = useState(lireCoursEtp);
  const [brouillon, setBrouillon] = useState({});
  const saisir = (cle, texte) => {
    setBrouillon(b => ({ ...b, [cle]: texte }));
    const cours = parseFloat(texte.replace(',', '.'));
    if (!(cours > 0)) return;
    const nouveau = {
      ...etp,
      [cle]: { cours, qqq: res.prix, heure: new Date().toLocaleTimeString('fr-FR').slice(0, 5) },
    };
    setEtp(nouveau);
    try { localStorage.setItem('sn-etp', JSON.stringify(nouveau)); } catch { /* sans stockage */ }
  };

  const h = res.sorties[horizon];
  const sens = res.score >= SEUIL ? 'long' : res.score <= -SEUIL ? 'short' : null;
  // Le produit du signal en premier
  const produits = sens === 'short' ? [...PRODUITS].reverse() : PRODUITS;

  return (
    <div className="sn-sortie">
      <h3>Achat / vente sur Trade Republic</h3>
      <div className="sn-onglets">
        {res.sorties.map((s, i) => (
          <button key={s.id} className={i === horizon ? 'actif' : ''} onClick={() => setHorizon(i)}>
            {s.nom}
          </button>
        ))}
      </div>

      {produits.map(p => {
        const achat = coursEstime(etp[p.cle], res.prix, p.levier);
        const niv = h[p.cle];
        const lignes = [
          ['Vente objectif 1', niv.obj1],
          ['Vente objectif 2', niv.obj2],
          ['Stop (vente si ça tourne)', niv.stop],
        ];
        return (
          <div key={p.cle} className={`sn-position${sens === p.cle ? ' signal' : ''}`}>
            <div className="sn-position-titre">
              <span>
                {p.nom} <small>({p.detail})</small>
                {sens === p.cle && <em> ← signal</em>}
              </span>
              <input
                inputMode="decimal" placeholder="cours TR en €"
                value={brouillon[p.cle] ?? (etp[p.cle]?.cours ? String(etp[p.cle].cours).replace('.', ',') : '')}
                onChange={e => saisir(p.cle, e.target.value)}
              />
            </div>
            <table className="sn-table">
              <thead><tr><th /><th>Prix</th><th>%</th><th>QQQ</th></tr></thead>
              <tbody>
                <tr className="sn-achat">
                  <td>Achat</td>
                  <td>{achat ? euros(achat) : '—'}</td>
                  <td />
                  <td>{res.prix.toFixed(2)}</td>
                </tr>
                {lignes.map(([nom, niveau]) => {
                  const variation = p.levier * (niveau / res.prix - 1) * 100;
                  return (
                    <tr key={nom}>
                      <td>{nom}</td>
                      <td>{achat ? euros(achat * (1 + variation / 100)) : '—'}</td>
                      <td className={couleur(variation)}>{pct(variation)}</td>
                      <td>{niveau.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!achat && <div className="sn-aide">Entre le cours affiché sur Trade Republic pour avoir les prix en €.</div>}
            {achat && etp[p.cle].qqq !== res.prix && (
              <div className="sn-aide">
                Cours estimé : saisi à {etp[p.cle].heure} ({euros(etp[p.cle].cours)}), suivi avec le QQQ x3.
              </div>
            )}
          </div>
        );
      })}
      <p className="sn-note">
        Méthode classique : moitié à l'objectif 1 puis stop remonté au prix d'achat, reste à
        l'objectif 2. Ordres limite / stop à placer chez Trade Republic.
        ATR = {h.atr.toFixed(2)} pts ({(h.atr / res.prix * 100).toFixed(2)} % du QQQ).
      </p>
    </div>
  );
}

function Histogramme({ gaps }) {
  const bornes = Array.from({ length: 40 }, (_, i) => -10 + i * 0.5);
  const comptes = bornes.map(b => gaps.filter(g => {
    const x = Math.max(-10, Math.min(9.99, g * LEVIER));
    return x >= b && x < b + 0.5;
  }).length);
  const max = Math.max(...comptes, 1);
  return (
    <div className="sn-histo">
      <div className="sn-graph-titre">Nuits du 3QQQ ≈ (situations similaires, n={gaps.length})</div>
      <div className="sn-histo-barres">
        {comptes.map((n, i) => (
          <div key={i} title={`${bornes[i]} % à ${bornes[i] + 0.5} % : ${n}`}
            style={{ height: `${(n / max) * 100}%`, background: bornes[i] >= 0 ? VERT : ROUGE }} />
        ))}
      </div>
      <div className="sn-histo-axe"><span>-10 %</span><span>0</span><span>+10 %</span></div>
    </div>
  );
}

function PanneauNuit({ nuit }) {
  const { sim: s, tout: t } = nuit;
  const coul = nuit.sens > 0 ? VERT : nuit.sens < 0 ? ROUGE : JAUNE;
  const lignes = [
    ['Nuits analysées', s.n, t.n, v => v],
    ['Ouverture en hausse', s.hausse, t.hausse, v => `${v.toFixed(0)} %`],
    ['Gap moyen QQQ', s.moyenne, t.moyenne, v => pct(v)],
    ['Gap moyen 3QQQ ≈', s.moyenne * LEVIER, t.moyenne * LEVIER, v => pct(v)],
    ['Gap moyen 3QSS ≈', -s.moyenne * LEVIER, -t.moyenne * LEVIER, v => pct(v)],
    ['Chute > 1 % (3QQQ -3 %)', s.chute1, t.chute1, v => `${v.toFixed(0)} %`],
    ['Envol > 1 % (3QSS -3 %)', s.envol1, t.envol1, v => `${v.toFixed(0)} %`],
    ['Pire nuit 3QQQ ≈', s.pire * LEVIER, t.pire * LEVIER, v => pct(v, 1)],
    ['Pire nuit 3QSS ≈', -s.meilleur * LEVIER, -t.meilleur * LEVIER, v => pct(v, 1)],
  ];
  return (
    <section className="sn-panneau sn-nuit">
      <h2>Cette nuit</h2>
      <div className="sn-decision" style={{ color: coul }}>{nuit.verdict}</div>
      <div className="sn-info">Situation : {nuit.situation}</div>
      <table className="sn-table">
        <thead><tr><th /><th>similaires</th><th>toutes</th></tr></thead>
        <tbody>
          {lignes.map(([nom, a, b, f]) => (
            <tr key={nom}><td>{nom}</td><td>{f(a)}</td><td>{f(b)}</td></tr>
          ))}
        </tbody>
      </table>
      {nuit.risques.map(r => <div key={r} className="sn-risque">⚠ {r}</div>)}
      <Histogramme gaps={nuit.gapsSim} />
      <p className="sn-note">
        Gap = écart entre la clôture US (22h) et l'ouverture (15h30), sur 5 ans de QQQ. Sur Trade Republic (7h30–23h) tu peux encore sortir jusqu'à 23h, et dès 7h30 le cours suit les futures Nasdaq : ces chiffres sont donc le pire cas.
      </p>
    </section>
  );
}

export default function ScalperApp() {
  const [cles, setCles] = useState(lireCles);
  const [reglages, setReglages] = useState(!lireCles().twelve);
  const [donnees, setDonnees] = useState(null);
  const [res, setRes] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [auto, setAuto] = useState(false);
  const [maj, setMaj] = useState('');

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const titre = document.title;
    document.title = 'Scalper Nasdaq';
    return () => { meta.remove(); document.title = titre; };
  }, []);

  const lancer = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      const d = await chargerTout(cles);
      setDonnees(d);
      setRes(analyser(d));
      setMaj(new Date().toLocaleTimeString('fr-FR'));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, [cles]);

  useEffect(() => {
    if (!auto) return undefined;
    const id = setInterval(lancer, ACTUALISATION_MS);
    return () => clearInterval(id);
  }, [auto, lancer]);

  const graphJour = useMemo(() => {
    if (!donnees) return null;
    const e20 = ema(donnees.jour.map(b => b.close), 20);
    const e50 = ema(donnees.jour.map(b => b.close), 50);
    const n = 126; // 6 mois
    return {
      bougies: donnees.jour.slice(-n),
      lignes: [
        { nom: 'Moy. 20 j', couleur: JAUNE, valeurs: e20.slice(-n) },
        { nom: 'Moy. 50 j', couleur: BLEU, valeurs: e50.slice(-n) },
      ],
    };
  }, [donnees]);

  const graphIntra = useMemo(() => {
    if (!res) return null;
    const ij = res.intraJour;
    const c = ij.map(b => b.close);
    return {
      bougies: ij,
      lignes: [
        { nom: 'VWAP', couleur: '#e67e22', valeurs: vwapCumule(ij) },
        { nom: 'EMA 9', couleur: JAUNE, valeurs: ema(c, 9) },
        { nom: 'EMA 21', couleur: BLEU, valeurs: ema(c, 21) },
      ],
    };
  }, [res]);

  const validerCles = c => {
    enregistrerCles(c);
    setCles(c);
    setReglages(false);
  };

  return (
    <div className="sn-page">
      <header className="sn-entete">
        <button className="sn-bouton" onClick={lancer} disabled={chargement || !cles.twelve}>
          {chargement ? '…' : 'ANALYSER'}
        </button>
        <label className="sn-auto">
          <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} />
          Actualiser chaque minute
        </label>
        <button className="sn-lien" onClick={() => setReglages(r => !r)}>Clés d'API</button>
      </header>

      {reglages && <FormulaireCles cles={cles} onValider={validerCles} />}
      {erreur && <div className="sn-erreur">Erreur : {erreur}</div>}
      {!res && !reglages && !erreur && <p className="sn-info">Appuie sur ANALYSER.</p>}

      {res && (
        <div className="sn-grille">
          <PanneauSignal res={res} maj={maj} marcheOuvert={donnees.marcheOuvert} />
          <PanneauNuit nuit={res.nuit} />
          <div className="sn-graphs">
            <Graphique titre={`${TICKER} journalier (6 mois)`} {...graphJour} />
            <Graphique
              titre={`${TICKER} séance du ${res.dateSeance.slice(8)}/${res.dateSeance.slice(5, 7)}`
                + ` (5 min, heure de Paris)  ${pct(res.perfs[0].qqq)}`}
              intraday {...graphIntra} />
          </div>
        </div>
      )}

      <p className="sn-note">
        3QQQ / 3QSS ≈ estimés à partir du QQQ (x3 recomposé chaque jour), hors effet euro/dollar.
        Indicateurs techniques, pas un conseil financier.
      </p>
    </div>
  );
}
