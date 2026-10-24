// Le modèle de langage tourne dans un Web Worker (WebGPU) pour garder l'interface fluide
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

const gestionnaire = new WebWorkerMLCEngineHandler();
self.onmessage = (message) => gestionnaire.onmessage(message);
