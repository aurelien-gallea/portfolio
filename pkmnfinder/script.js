const id = document.querySelector("#id");
const nom = document.querySelector("#nom");
const select = document.querySelector("select");
const btn = document.querySelector("#filtrer");
const p = document.createElement("p");
const field = document.querySelector("#card-field");
const div = document.createElement("div");

function creerCarte() {}

btn.addEventListener("click", (e) => {
  e.preventDefault();
  field.innerHTML = "";
  jsonValueKey("pkmn.json", id.value, nom.value, select.value);
});

function jsonValueKey(url, id, nom, select) {
  fetch(url)
    .then((response) => response.json())
    .then((response) => {
      for (const key in response) {
        function createCard() {
          const div = document.createElement("div");
          div.classList.add(
            "bg-white",
            "mx-auto",
            "rounded",
            "w-full",
            "md-2/4",
            "p-4"
          );
          div.innerHTML = `<div class="flex justify-between"><span>N°: ${response[key].number}</span>  <span> ${response[key].name} </span></div>`;
          div.innerHTML += `<div> <span>type : ${response[key].types}</span> </div>`;
          div.innerHTML += `<div class="py-4"><img class="w-2/4 mx-auto" src="${response[key].image}"></img></div>`;
          div.innerHTML += `<div> <h4>Résistances:</h4>  <small class="break-all">${response[key].Résistances}</small></div>`;
          div.innerHTML += `<div> <h4>Faiblesses :</h4> <small>${response[key].Faiblesses}</small></div>`;
          field.append(div);
        }
        nom = nom.charAt(0).toUpperCase() + nom.slice(1);
        if (response[key].number == id) {
          // par id
          createCard();
        }

        if (response[key].name.includes(nom) && nom.length >= 1) {
          
          createCard();
        }

        if (response[key].types.includes(select)) {
          // par type
          createCard();
        }
      }
    })
    .catch((error) => console.log(error));
}
