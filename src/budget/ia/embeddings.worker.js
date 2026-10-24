// Calcule les embeddings dans un Web Worker pour ne pas figer l'interface
import { pipeline } from '@huggingface/transformers';

const MODELE = 'Xenova/multilingual-e5-small';
let extracteur = null;

self.onmessage = async ({ data: { id, textes } }) => {
  try {
    extracteur ??= pipeline('feature-extraction', MODELE, {
      dtype: 'q8',
      progress_callback: (p) => self.postMessage({ type: 'progression', ...p }),
    });
    const modele = await extracteur;
    const vecteurs = [];
    for (let i = 0; i < textes.length; i += 32) {
      const lot = textes.slice(i, i + 32).map((t) => `query: ${t}`);
      const sortie = await modele(lot, { pooling: 'mean', normalize: true });
      vecteurs.push(...sortie.tolist());
    }
    self.postMessage({ id, type: 'resultat', vecteurs });
  } catch (e) {
    extracteur = null;
    self.postMessage({ id, type: 'erreur', message: e.message });
  }
};
