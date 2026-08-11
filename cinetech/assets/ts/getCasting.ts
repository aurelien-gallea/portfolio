import apiKey from "./apiKey.js";

export const getCasting = (mediaType: string, myId: string,  myTitle : string): void => {
    
    const myContainer = document.querySelector("#myContainer") as HTMLDivElement;
    const title = document.createElement("h2") as HTMLHeadingElement;
    const alert = document.createElement('div') as HTMLDivElement;
    
    const srcImg: string = "https://image.tmdb.org/t/p/original";
    const notFindImg: string = "./assets/images/not-find.jpg";

    // personnalisation
    title.classList.add("my-5", "align-self-start", "container");
    title.textContent = myTitle;
    const myDiv3 = document.createElement("div");
    myDiv3.classList.add("d-flex", "w-100", "overflow-auto", "gap-2", "rounded");
    
  
    
       
    
    fetch(`https://api.themoviedb.org/3/${mediaType}/${myId}/credits?api_key=${apiKey}`)
    .then(response => response.json())
    .then((data) => {
          if(data.cast.length === 0) {
            alert.classList.add("alert", "alert-warning", "text-center", "my-5");
            alert.innerHTML = 'Aucun casting trouvé !';
            myDiv3.classList.remove("w-100");
            myDiv3.append(alert);
          } else {
       
      for (const key in data.cast) {
        
          
          // création d'une carte pour chaque contenu
          const myCardCast = document.createElement("a") as HTMLAnchorElement;
          
          myCardCast.classList.add("card", "mb-3", "justify-content-between", "bg-black", "nav-link");
          myCardCast.style.minWidth = "180px";
            myCardCast.style.maxWidth = "180px";
        myCardCast.id = data.cast[key].id;

        
        myCardCast.href = "actors.php?id=" + myCardCast.id;
        
        !data.cast[key].profile_path ? myCardCast.innerHTML += `<div><img class="img-fluid card-img-top" src=${notFindImg} alt="not found image"></div>`
                        : myCardCast.innerHTML += `<div><img class="img-fluid card-img-top" src=${
                            srcImg + data.cast[key].profile_path
                          } alt="${data.cast[key].name}"></div>`
        
        myCardCast.innerHTML += `<div class="card-footer text-truncate text-bg-black">${data.cast[key].name}</div>`;

        // myCardCast.innerHTML +=      '<div class="card-footer "><span class="fw-bold fs-6 text-end text-black">Popularité :'  +
        // data.cast[key].popularity.toFixed(0) +
        // "</span></div>";
                            
        // on ajoute la carte dans la div parente
        myDiv3.append(myCardCast);
      
    }
         
}
     // appel
   
        myContainer.append(title, myDiv3);
      })
      .catch(error => console.log(error));
    }
    