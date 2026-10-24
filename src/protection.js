// Repère les copies du portfolio remises en ligne ailleurs que sur le site d'origine
const SITE_ORIGINAL = 'https://aurelien-gallea.github.io/portfolio/';
const HOTES_AUTORISES = ['aurelien-gallea.github.io', 'localhost', '127.0.0.1', '[::1]', ''];
// Sujet ntfy.sh (gratuit, sans compte) : s'abonner à https://ntfy.sh/<sujet> pour recevoir les alertes
const SUJET_ALERTE = 'portfolio-ag-hn3jie2chrpnwk';
const CLE_ALERTE = 'portfolio-copie-signalee';

// Prévient l'auteur une fois par navigateur ; seul le nom de domaine est envoyé, rien sur le visiteur
function signaler(hote) {
  try {
    if (localStorage.getItem(CLE_ALERTE) === hote) return;
    localStorage.setItem(CLE_ALERTE, hote);
  } catch {
    // stockage indisponible : on signale quand même
  }
  fetch(`https://ntfy.sh/${SUJET_ALERTE}`, {
    method: 'POST',
    mode: 'no-cors',
    body: `Copie du portfolio détectée sur ${hote}`,
  }).catch(() => {});
}

function afficherBandeau() {
  const bandeau = document.createElement('div');
  bandeau.setAttribute('role', 'alert');
  bandeau.style.cssText = [
    'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:2147483647',
    'padding:12px 16px', 'background:#b91c1c', 'color:#fff', 'text-align:center',
    'font:14px/1.4 system-ui,sans-serif', 'box-shadow:0 -4px 16px rgba(0,0,0,.4)',
  ].join(';');
  bandeau.append('Copie non autorisée de ce site. L\'original est sur ');
  const lien = document.createElement('a');
  lien.href = SITE_ORIGINAL;
  lien.textContent = 'aurelien-gallea.github.io/portfolio';
  lien.style.cssText = 'color:#fff;font-weight:700;text-decoration:underline';
  bandeau.append(lien, '.');
  document.body.append(bandeau);
}

export function surveillerCopies(hote = location.hostname) {
  if (HOTES_AUTORISES.includes(hote)) return false;
  afficherBandeau();
  signaler(hote);
  return true;
}
