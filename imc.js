const resultNumber = document.querySelector("#resultNumber");
const inputHeight = document.querySelector('#height');
const inputWeight = document.querySelector('#weight');
const form = document.querySelector("form");
const btn = document.querySelector("#btn");


resultNumber.classList.add('p-3', 'rounded');

function calculateBMI(y, x) {

  BMI = (y / Math.pow(x / 100, 2)).toFixed(2);
  
  if (BMI < 18.5) {
    resultNumber.textContent = BMI + " : Maigreur";
    resultNumber.classList.add('bg-sky-600');
  } else if (BMI < 24.9) {
    resultNumber.textContent = BMI + " : Poids Normal";
    resultNumber.classList.add('bg-emerald-500');
  } else if (BMI < 29.9) {
    resultNumber.textContent = BMI + " : Surpoids";
    resultNumber.classList.add('bg-amber-400');
  } else if (BMI < 34.9) {
    resultNumber.textContent = BMI + " : Obésité modéré";
    resultNumber.classList.add('bg-orange-500');
  } else if (BMI < 39.9) {
    resultNumber.textContent = BMI + " : Obésité sévère";
    resultNumber.classList.add('bg-red-500');
  } else {
    resultNumber.textContent = BMI + " : Obésité Morbide";
    resultNumber.classList.add('bg-red-900');
  }
  console.log(BMI);
}


inputHeight.addEventListener('keyup', () => {
    if (isNaN(Number(inputHeight.value))) {

      btn.disabled = true;
      btn.textContent = "utilisez UNIQUEMENT des nombres !";
      btn.classList.add('bg-red-500');
     
    } else {
      btn.disabled =false;
      btn.textContent = "Valider les infos";
      btn.classList.remove('bg-red-500');
    }
    console.log(typeof(inputHeight.value));
});

inputWeight.addEventListener('keyup', () => {
  if (isNaN(Number(inputWeight.value))) {

      btn.disabled = true;
      btn.textContent = "utilisez UNIQUEMENT des nombres !";
      btn.classList.add('bg-red-500');
    
    } else {
      btn.disabled =false;
      btn.textContent = "Valider les infos";
      btn.classList.remove('bg-red-500');
    }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let height = inputHeight.value;
  let weight = inputWeight.value;

  resultNumber.removeAttribute('class');
  resultNumber.classList.add('p-3', 'text-white', 'rounded');

  if (height == "" || weight == "") {
    resultNumber.textContent = "Alors ?! On a peur joli(e) coeur ?";
    resultNumber.classList.add('bg-pink-500');
  } else if (height < 54.6) {
    resultNumber.textContent = "L' homme, le plus petit du monde mesure 54.6cm";
    resultNumber.classList.add('bg-fuchsia-700');
  } else if (height > 251) {
    resultNumber.textContent = "L' homme, le plus grand du monde mesure 2,51m";
    resultNumber.classList.add('bg-fuchsia-700');
  } else {
   
    calculateBMI(weight, height);
  }
});
