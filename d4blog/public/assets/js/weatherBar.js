// station météo geolocalisé
const weather = document.querySelector("#weather");
let city="marseille";
const today = new Date();
const time = today.getHours();
const month = today.getMonth()+1;
const a = "253664b";
const b = "278f0a6";
// en vrai si y'a une méthode pour mieux cacher sa clé je prends
function takeWeather(city) {
    const url =
      "https://api.openweathermap.org/data/2.5/weather?q=" + city + " &appid=" + a + b + "f775da23d9d38db076&units=metric";
      fetchIsGood(url);
      
}

function fetchIsGood(url) {
     // creer requete
  fetch(url)
  .then((response) => response.json())
  .then((response) => {
    const temp = response.main.temp;
    const humidity = response.main.humidity;
    const sky = response.weather[0].description;

    // notre affichage de la temperature
    weather.innerHTML = '<span class="me-1">' + response.name +  ": " + temp.toFixed(1) + " °C </span>";

    // on affiche une icone en fonction du ciel
    if (sky.includes("clear")) {
      // heure d'hiver 
      if (month < 4 || month >= 11 ) {

          if(time >= 7 && time <= 18) {
              weather.innerHTML += ' <i class="fa-solid fa-sun text-primary"></i>';
          } else {
              weather.innerHTML += ' <i class="fa-solid fa-moon text-primary"></i>';
          }
         
      } else { // heure d'été
          if(time >= 7 && time <= 21) {
              weather.innerHTML += ' <i class="fa-solid fa-sun text-primary"></i>';
          } else {
              weather.innerHTML += ' <i class="fa-solid fa-moon text-primary"></i>';
          }
         
      }
    }
    else if (humidity > 75) {
      weather.innerHTML += ' <i class="fa-solid fa-cloud-rain text-primary"></i>';
    }
    else if (sky.includes("mist")) {
      weather.innerHTML += ' <i class="fa-solid fa-smog text-primary"></i>';
    }
    else if (sky.includes("cloud")) {
      weather.innerHTML += ' <i class="fa-solid fa-cloud text-primary"></i>';
    }
  });
}
// si l'utilisateur est geolocalisé on utilise sa position
if('geolocation' in navigator) {
    navigator.geolocation.watchPosition((position) => {
        const url = 'https://api.openweathermap.org/data/2.5/weather?lon='+ position.coords.longitude+ '&lat=' + position.coords.latitude +  '&appid=' + a + b +'f775da23d9d38db076&units=metric';
        fetchIsGood(url);
    }, options);

    var options = {
    enableHighAccuracy: true
    }
} 
// sinon il est à marseille par défaut (et franchement ça aurait pu être pire)
takeWeather(city);