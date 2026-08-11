const searchBar = document.querySelector("#searchBar");
const found = document.querySelectorAll(".found");
const selectDate = document.querySelector('#selectDate');
const filterDate = document.querySelector('#filterDate');

// notre belle barre de recherche
searchBar.addEventListener('keyup', () => {
    
    // on fait apparaître le résutat de notre recherche
    for (let i = 0; i < found.length; i++) {
      const result = found[i];
      // j'ai remplacé textContent par innerHTML, car je voulais avoir accès à la date de modification dans le tooltip
      let word = result.innerHTML.toLowerCase(); 
      
      if(word.includes(searchBar.value.toLowerCase()))  {
        
        result.classList.remove("d-none");
      } else {
        result.classList.add("d-none");

      }   
    }   
  });

// notre option de selection dans la barre de recherche 
selectDate.addEventListener('change', () => {

  filterDate.innerHTML="";
  // c'est parti pour les boucles

  if (selectDate.value === "asc") {
    // comme par défaut on affiche les articles par du plus récent au plus ancien on boucle à l'envers dans ce cas là, et puis j'aime bien boucler à l'envers !

    for (let j = found.length-1; j >= 0 ; j--) {
      filterDate.appendChild(found[j]);  
    }
    
  } else { 
    
    for (let j = 0; j < found.length; j++) {
      filterDate.appendChild(found[j]);   
    }
    
  }

});