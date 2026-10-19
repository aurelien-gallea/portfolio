import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const VERT = '#2ecc71', ROUGE = '#e74c3c';

const heureParis = t => new Date(t * 1000).toLocaleTimeString('fr-FR',
  { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });

/**
 * bougies : [{ time, open, high, low, close }], lignes : [{ couleur, valeurs, nom }]
 * (valeurs alignées sur les bougies). intraday : heures affichées en heure de Paris.
 */
export default function Graphique({ titre, bougies, lignes, intraday }) {
  const conteneur = useRef(null);
  const graph = useRef(null);

  useEffect(() => {
    const chart = createChart(conteneur.current, {
      autoSize: true,
      layout: { background: { color: '#1b1b1b' }, textColor: '#888' },
      grid: { vertLines: { color: '#262626' }, horzLines: { color: '#262626' } },
      rightPriceScale: { borderColor: '#333' },
      timeScale: {
        borderColor: '#333',
        timeVisible: intraday,
        ...(intraday && { tickMarkFormatter: heureParis }),
      },
      ...(intraday && { localization: { timeFormatter: heureParis } }),
    });
    graph.current = {
      chart,
      bougies: chart.addCandlestickSeries({
        upColor: VERT, downColor: ROUGE, borderVisible: false,
        wickUpColor: VERT, wickDownColor: ROUGE,
      }),
      lignes: [],
    };
    return () => chart.remove();
  }, [intraday]);

  useEffect(() => {
    const g = graph.current;
    if (!g || !bougies.length) return;
    const temps = b => intraday
      ? Math.floor(b.time.getTime() / 1000)
      : b.time.toISOString().slice(0, 10);
    g.bougies.setData(bougies.map(b => ({ ...b, time: temps(b) })));

    g.lignes.forEach(s => g.chart.removeSeries(s));
    g.lignes = lignes.map(l => {
      const s = g.chart.addLineSeries({
        color: l.couleur, lineWidth: 1, priceLineVisible: false,
        lastValueVisible: false, crosshairMarkerVisible: false, title: l.nom,
      });
      s.setData(l.valeurs.map((v, i) => ({ time: temps(bougies[i]), value: v })));
      return s;
    });
    g.chart.timeScale().fitContent();
  }, [bougies, lignes, intraday]);

  return (
    <div className="sn-graph">
      <div className="sn-graph-titre">{titre}</div>
      <div ref={conteneur} className="sn-graph-zone" />
    </div>
  );
}
