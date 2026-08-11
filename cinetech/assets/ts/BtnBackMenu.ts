export const BtnBackMenu = (to : string): HTMLAnchorElement => {
  const btnBackM = document.createElement("a") as HTMLAnchorElement;
  btnBackM.classList.add(
    "btn",
    "btn-outline-secondary",
    "px-3",
    "py-2",
    "nav-link"
  );
  // on met l'affichage du text du bouton en français
  let nameFr : string= "";
  // to === "movies" ? nameFr = "Films": nameFr = "Séries";
  switch (to) {
    case "movies":
      nameFr = "Films";
      break;
    case "series":
      nameFr = "Séries";
      break
    case "actors":
      nameFr = "Acteurs";
      break;
    default:
      break;
  }
  btnBackM.textContent = `Retour au menu : ${nameFr}`;
  btnBackM.addEventListener("click", () => window.location.href = `./${to}.php`);

  return btnBackM;
};

export const BtnBack = (): HTMLButtonElement => {
  const btn = document.createElement("button") as HTMLButtonElement;
  btn.classList.add("btn", "btn-outline-light","border-0",  "orange",  "px-3", "py-2");
  btn.textContent = "Revenir";
  btn.addEventListener("click", () => window.history.back());
  return btn;
}