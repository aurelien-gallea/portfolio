import React from 'react';
import { Download, Upload, Trash2, Plus, ShieldCheck, FileSpreadsheet, Save, Lightbulb, Sparkles, RotateCcw } from 'lucide-react';

function Section({ icone: Icone, titre, children }) {
  return (
    <section className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
        <Icone size={16} />
      </span>
      <div className="min-w-0 space-y-1.5 text-sm text-gray-300">
        <h4 className="m-0 text-sm font-semibold text-white">{titre}</h4>
        {children}
      </div>
    </section>
  );
}

const Bouton = ({ icone: Icone, children }) => (
  <span className="mx-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-white/10 px-1.5 py-0.5 text-xs text-white">
    <Icone size={12} /> {children}
  </span>
);

// Mode d'emploi : ce que fait l'appli, où vont les données, et comment importer ses relevés
export default function Guide({ exemple, onImporter, onRevoirExemple }) {
  return (
    <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
      <Section icone={ShieldCheck} titre="Vos données restent chez vous">
        <p className="m-0">
          Tout est enregistré <strong>uniquement dans ce navigateur</strong>, sur cet appareil : rien n'est envoyé sur un serveur, il n'y a pas de compte.
        </p>
        <p className="m-0 text-gray-400">
          Conséquence : sur un autre appareil ou un autre navigateur, vous ne retrouverez pas votre budget, et vider les données de navigation l'efface.
          Pensez à faire régulièrement une <Bouton icone={Save}>Sauvegarde</Bouton>.
        </p>
      </Section>

      <Section icone={FileSpreadsheet} titre="1. Récupérer le relevé de votre banque">
        <p className="m-0">
          Dans l'espace client de votre banque (sur ordinateur, c'est souvent plus simple), ouvrez votre compte, puis cherchez
          « Télécharger », « Exporter » ou « Historique des opérations », et choisissez le format <strong>CSV</strong>.
          Si seul le format Excel est proposé, ouvrez-le puis « Enregistrer sous » au format CSV.
        </p>
        <p className="m-0 text-gray-400">
          Sont compris : une colonne date (05/10/2026 ou 2026-10-05), un libellé, et soit un montant (négatif pour une dépense), soit deux colonnes débit et crédit.
          Les colonnes sont aussi reconnues à leur contenu quand leur nom est inhabituel ou absent, et les fichiers en UTF-8 comme en Windows-1252 sont acceptés.
        </p>
      </Section>

      <Section icone={Upload} titre="2. L'importer">
        <p className="m-0">
          Cliquez sur <Bouton icone={Upload}>Importer</Bouton> et choisissez le fichier.
          {exemple
            ? ' Au premier import, les données d\'exemple sont remplacées par votre relevé.'
            : ' Les opérations sont ajoutées à celles déjà présentes.'}
        </p>
        <p className="m-0 text-gray-400">
          Vous pouvez importer chaque mois le nouveau relevé, même s'il chevauche le précédent : les opérations déjà présentes sont ignorées.
          Les catégories sont devinées à partir du libellé et des catégories de votre banque, et vous pouvez les corriger en cliquant sur le crayon d'une opération.
          Les virements entre vos comptes et vers votre épargne sont écartés : ce ne sont ni des dépenses ni des revenus.
        </p>
        {exemple && (
          <button type="button" onClick={onImporter} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-orange-500 px-3 py-2 text-sm font-medium text-black hover:bg-orange-400">
            <Upload size={15} /> Importer mon relevé
          </button>
        )}
      </Section>

      <Section icone={Plus} titre="Ou saisir à la main">
        <p className="m-0">Le bouton <Bouton icone={Plus}>Ajouter</Bouton> de la liste des opérations permet de saisir une dépense ou un revenu.</p>
      </Section>

      <Section icone={Lightbulb} titre="Ce que l'appli fait pour vous">
        <ul className="m-0 list-disc space-y-1 pl-4">
          <li><strong>Pistes pour alléger votre budget</strong> : vos postes comparés aux repères français, et votre loyer au loyer moyen de votre commune (renseignez « Mon logement »).</li>
          <li><strong>Scanner d'abonnements</strong> : prélèvements récurrents et opérations classées en « Abonnements », hausses de prix, économie si vous résiliez. Les contrats d'énergie et d'assurance sont mis à part, avec des comparateurs ; la croix retire ce qui n'est pas un abonnement.</li>
          <li><strong>Plafonds mensuels</strong> par catégorie, et clic sur une catégorie pour ne voir que ses opérations.</li>
          <li><strong>Assistant IA</strong> (bouton en bas à droite) : questions en langage naturel, avec un modèle qui tourne lui aussi dans votre navigateur.</li>
        </ul>
      </Section>

      <Section icone={Download} titre="Les boutons du haut">
        <ul className="m-0 list-none space-y-1.5 p-0">
          <li><Bouton icone={Download}>CSV</Bouton> exporte vos opérations pour Excel ou LibreOffice.</li>
          <li><Bouton icone={Save}>Sauvegarde</Bouton> télécharge un fichier .json avec tout votre budget (opérations, plafonds, profil).</li>
          <li><Bouton icone={Upload}>Importer</Bouton> accepte un relevé CSV (ajout) ou une sauvegarde .json (<strong>remplace tout</strong>, pour la restaurer ou changer d'appareil).</li>
          <li><Bouton icone={Trash2}>&nbsp;</Bouton> efface tout pour repartir d'un budget vide.</li>
        </ul>
      </Section>

      <Section icone={exemple ? Sparkles : RotateCcw} titre="Données d'exemple">
        <p className="m-0">
          {exemple
            ? 'Vous voyez actuellement des données fictives, pour découvrir l\'appli. Elles disparaissent dès que vous importez un relevé ou commencez votre budget.'
            : 'Envie de revoir l\'exemple ? Il remplacera vos données : faites une sauvegarde avant.'}
        </p>
        {!exemple && (
          <button type="button" onClick={onRevoirExemple} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10">
            <RotateCcw size={15} /> Revoir les données d'exemple
          </button>
        )}
      </Section>
    </div>
  );
}
