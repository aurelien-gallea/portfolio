import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Loader2, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import { SCHEMA, promptExtraction, PROMPT_REPONSE, executer } from './analyse';
import { euros } from '../donnees';

const bouton = 'inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 px-3 py-2 text-sm font-medium transition-colors';

const SUGGESTIONS = [
  'Combien ai-je dépensé en courses ce mois-ci ?',
  'Compare mes dépenses des 6 derniers mois',
  'Mes plus grosses dépenses ce mois-ci',
  'Où puis-je économiser ?',
];

const HORS_SUJET = 'Je ne réponds qu\'aux questions sur votre budget : dépenses, revenus, catégories, plafonds… Essayez par exemple « Où puis-je économiser ? ».';

// Qwen3 préfixe ses réponses d'un bloc <think></think> (vide quand la réflexion est désactivée)
const sansReflexion = (texte) => texte.replace(/<think>[\s\S]*?(<\/think>|$)/, '').trim();

// Moteur partagé entre deux ouvertures du panneau
let moteur = null;

async function choisirModele() {
  if (!navigator.gpu) return null;
  const adaptateur = await navigator.gpu.requestAdapter().catch(() => null);
  if (!adaptateur) return null;
  return adaptateur.features.has('shader-f16') ? 'Qwen3-1.7B-q4f16_1-MLC' : 'Qwen3-1.7B-q4f32_1-MLC';
}

function Barres({ titre, barres }) {
  const max = Math.max(...barres.map((b) => b.valeur), 1);
  return (
    <div className="mt-3 space-y-1.5 rounded-xl bg-black/30 p-3">
      <div className="mb-2 text-xs font-medium text-gray-400">{titre}</div>
      {barres.map((b, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0 truncate text-gray-400" title={b.nom}>{b.nom}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full" style={{ width: `${(b.valeur / max) * 100}%`, background: b.couleur ?? '#f97316' }} />
          </div>
          <span className="w-20 shrink-0 text-right tabular-nums text-gray-300">{euros(b.valeur)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Assistant({ donnees, onFermer }) {
  const [etat, setEtat] = useState(moteur ? 'pret' : 'verification');
  const [modele, setModele] = useState(null);
  const [dejaTelecharge, setDejaTelecharge] = useState(false);
  const [progression, setProgression] = useState({ ratio: 0, texte: '' });
  const [messages, setMessages] = useState([]);
  const [saisie, setSaisie] = useState('');
  const [occupe, setOccupe] = useState(false);
  const fil = useRef(null);

  useEffect(() => {
    if (moteur) return;
    (async () => {
      const id = await choisirModele();
      if (!id) return setEtat('incompatible');
      setModele(id);
      const { hasModelInCache } = await import('@mlc-ai/web-llm');
      setDejaTelecharge(await hasModelInCache(id).catch(() => false));
      setEtat('a-charger');
    })();
  }, []);

  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const charger = async () => {
    setEtat('chargement');
    try {
      const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm');
      moteur = await CreateWebWorkerMLCEngine(
        new Worker(new URL('./llm.worker.js', import.meta.url), { type: 'module' }),
        modele,
        { initProgressCallback: ({ progress, text }) => setProgression({ ratio: progress, texte: text }) },
      );
      setEtat('pret');
    } catch (e) {
      setProgression({ ratio: 0, texte: e.message });
      setEtat('erreur');
    }
  };

  const majDernier = (champs) =>
    setMessages((m) => [...m.slice(0, -1), { ...m.at(-1), ...champs }]);

  const demander = async (question) => {
    question = question.trim();
    if (!question || occupe) return;
    setSaisie('');
    setOccupe(true);
    setMessages((m) => [...m, { role: 'user', texte: question }, { role: 'assistant', texte: '', etape: 'Analyse de la question…' }]);

    try {
      // 1. Le modèle traduit la question en requête structurée (sortie contrainte par le schéma)
      const extraction = await moteur.chat.completions.create({
        messages: [
          { role: 'system', content: promptExtraction(donnees.transactions) },
          { role: 'user', content: `Q : ${question}` },
        ],
        temperature: 0,
        max_tokens: 200,
        response_format: { type: 'json_object', schema: JSON.stringify(SCHEMA) },
        extra_body: { enable_thinking: false },
      });
      let requete;
      try {
        requete = JSON.parse(sansReflexion(extraction.choices[0].message.content));
      } catch {
        majDernier({ texte: 'Je n\'ai pas bien compris la question. Pouvez-vous la reformuler, en précisant la période ou la catégorie ?', etape: null });
        return;
      }

      // 2. L'application calcule les chiffres exacts
      const resultat = executer(requete, donnees);
      if (!resultat.faits) {
        majDernier({ texte: HORS_SUJET, etape: null });
        return;
      }
      majDernier({ resultat, requete, etape: 'Rédaction de la réponse…' });

      // 3. Le modèle rédige la réponse à partir des faits, en streaming
      const flux = await moteur.chat.completions.create({
        messages: [
          { role: 'system', content: PROMPT_REPONSE },
          { role: 'user', content: `Question de l'utilisateur : ${question}\n\nFaits calculés par l'application :\n${resultat.faits}` },
        ],
        temperature: 0.3,
        max_tokens: 300,
        stream: true,
        extra_body: { enable_thinking: false },
      });
      let texte = '';
      for await (const morceau of flux) {
        texte += morceau.choices[0]?.delta?.content ?? '';
        majDernier({ texte: sansReflexion(texte), etape: null });
      }
    } catch (e) {
      majDernier({ texte: `Désolé, une erreur est survenue : ${e.message}`, etape: null });
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex h-[85vh] flex-col rounded-t-3xl border border-white/10 bg-[#141416] shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[640px] sm:max-h-[calc(100vh-3rem)] sm:w-[420px] sm:rounded-3xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <h3 className="m-0 flex items-center gap-2 text-base font-semibold"><Sparkles size={18} className="text-orange-400" /> Assistant IA</h3>
          <p className="m-0 mt-0.5 flex items-center gap-1 text-xs text-emerald-400"><ShieldCheck size={12} /> 100 % local : rien ne quitte votre navigateur</p>
        </div>
        <button type="button" onClick={onFermer} className={`${bouton} bg-transparent p-1 text-gray-400 hover:text-white`} aria-label="Fermer l'assistant">
          <X size={20} />
        </button>
      </div>

      {etat !== 'pret' ? (
        <div className="flex flex-1 flex-col justify-center gap-4 p-6 text-sm text-gray-300">
          {etat === 'verification' && <p className="m-0 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Vérification de la compatibilité…</p>}

          {etat === 'incompatible' && (
            <>
              <Cpu size={32} className="text-gray-500" />
              <p className="m-0">Votre navigateur ne prend pas en charge <strong>WebGPU</strong>, nécessaire pour faire tourner un modèle de langage en local.</p>
              <p className="m-0 text-gray-500">Essayez un Chrome ou un Edge récent sur ordinateur. La catégorisation automatique, elle, fonctionne partout.</p>
            </>
          )}

          {etat === 'a-charger' && (
            <>
              <p className="m-0">Posez vos questions en langage naturel : « Combien m'ont coûté les restaurants depuis août ? », « Où puis-je économiser ? »…</p>
              <p className="m-0 text-gray-500">
                Le modèle <strong className="text-gray-300">Qwen3 1.7B</strong> s'exécute sur votre carte graphique via WebGPU.
                {dejaTelecharge ? ' Il est déjà dans le cache de votre navigateur.' : ' Il faut le télécharger une seule fois (≈ 1 Go), puis il reste en cache.'}
              </p>
              <button type="button" onClick={charger} className={`${bouton} justify-center bg-orange-500 text-black hover:bg-orange-400`}>
                <Sparkles size={16} /> {dejaTelecharge ? "Démarrer l'assistant" : 'Télécharger et démarrer'}
              </button>
            </>
          )}

          {(etat === 'chargement' || etat === 'erreur') && (
            <>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${Math.max(progression.ratio * 100, 3)}%` }} />
              </div>
              <p className={`m-0 break-words text-xs ${etat === 'erreur' ? 'text-red-400' : 'text-gray-500'}`}>{progression.texte}</p>
              {etat === 'erreur' && (
                <button type="button" onClick={charger} className={`${bouton} justify-center bg-white/5 text-gray-300 hover:bg-white/10`}>Réessayer</button>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <div ref={fil} className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="m-0 text-sm text-gray-400">Que voulez-vous savoir sur votre budget ?</p>
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => demander(s)} className={`${bouton} w-full bg-white/5 text-left text-gray-300 hover:bg-white/10`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              m.role === 'user' ? (
                <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-orange-500 px-4 py-2.5 text-sm text-black">{m.texte}</div>
              ) : (
                <div key={i} className="max-w-[95%] text-sm text-gray-200">
                  {m.etape && <p className="m-0 flex items-center gap-2 text-gray-500"><Loader2 size={14} className="animate-spin" /> {m.etape}</p>}
                  {m.texte && <p className="m-0 whitespace-pre-wrap leading-relaxed">{m.texte}</p>}
                  {m.resultat?.barres.length > 0 && <Barres titre={m.resultat.titre} barres={m.resultat.barres} />}
                  {m.requete && (
                    <details className="mt-2 text-xs text-gray-600">
                      <summary className="cursor-pointer">Requête générée par le modèle</summary>
                      <pre className="mt-1 overflow-x-auto rounded-lg bg-black/40 p-2 text-gray-400">{JSON.stringify(m.requete, null, 2)}</pre>
                    </details>
                  )}
                </div>
              )
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); demander(saisie); }} className="flex gap-2 border-t border-white/[0.06] p-3">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-orange-500/60"
              placeholder="Posez une question…"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              disabled={occupe}
            />
            <button type="submit" disabled={occupe || !saisie.trim()} className={`${bouton} bg-orange-500 text-black hover:bg-orange-400 disabled:opacity-40`} aria-label="Envoyer">
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
