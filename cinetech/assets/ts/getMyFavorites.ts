import apiKey from "./apiKey.js";
import search from "./search.js";
//fonction du header
search("multi",1);

const myContainer = document.querySelector("#myContainer") as HTMLDivElement;
const notFindImg: string = "./assets/images/not-find.jpg";
const srcImg: string = "https://image.tmdb.org/t/p/w300";

let arrayMovie: number[] = [];
let arraySerie: number[] = [];
let arrayActor: number[] = [];

async function getAllFavorites() {
  fetch("./src/myFavorites.php")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      for (const key in data) {
        if (data[key].id_movie !== null) {
          arrayMovie.push(data[key].id_movie);
        } else if (data[key].id_serie !== null) {
          arraySerie.push(data[key].id_serie);
        } else if (data[key].id_actor !== null) {
          arrayActor.push(data[key].id_actor);
        }
      }
      // appel des fonctions pour creer les cartes, o nveut un order film / séries / acteurs
      arrayMovie.length !== 0 ? getList("movie", arrayMovie, "Films que vous aimez") : null;
      arraySerie.length !== 0 ? setTimeout(()=>getList("tv", arraySerie, "Séries que vous aimez") ,300)  : null;
      arrayActor.length !== 0 ? setTimeout(()=>getList("person", arrayActor, "Acteurs que vous aimez") ,600)  : null;
    })
    .catch((error) => console.log(error));
}

const getList = (mediaType: string, arrayIdMedia: number[], myTitle : string): void => {
  
  // creation
  const title = document.createElement("h2") as HTMLHeadingElement;

  // personnalisation
  title.classList.add("my-2", "align-self-start", "container");
  title.textContent = myTitle;
  const myDiv2 = document.createElement("div") as HTMLDivElement;
  myDiv2.classList.add("d-flex", "w-100", "overflow-auto", "gap-2", "rounded");
  
  // recuperer les medias du tableau et creer les cartes
  arrayIdMedia.forEach(idMedia => {
    console.log(idMedia);
    fetch(
      `https://api.themoviedb.org/3/${mediaType}/${idMedia}?api_key=${apiKey}&language=fr-FR`
      ).then((response) => response.json())
      .then((data) => {
        console.log(data);
        
          
            const myCard = document.createElement("a") as HTMLAnchorElement;
            myCard.classList.add("card", "mb-3", "justify-content-between", "bg-black", "nav-link");
            myCard.style.minWidth = "180px";
            myCard.style.maxWidth = "180px";
            myCard.id = data.id;
            
            if (mediaType === "movie") {
                myCard.href = "movies.php?id=" + myCard.id;
            } else if (mediaType === "tv") {
                myCard.href = "series.php?id=" + myCard.id;
            } else if (mediaType === "trending/movie"){
                myCard.href = "movies.php?id=" + myCard.id;
              } else if (mediaType === "person") {
              myCard.href = "actors.php?id=" + myCard.id;

            }

            // le titre de la carte pour l'accésibilité
            let titleOrName : string = '';
            mediaType !== 'movie' ? titleOrName = data.name : titleOrName = data.title;

            myCard.innerHTML += `
                      
                      
                      
                      ${
                        !data.poster_path
                          ? !data.profile_path
                            ? `<div><img class="img-fluid card-img-top" src=${notFindImg} alt="not found image"></div>`
                            : `<div><img class="img-fluid card-img-top" src=${
                                srcImg + data.profile_path
                              } alt="affiche : ${titleOrName}"></div>`
                          : `<div><img class="img-fluid card-img-top" src=${
                              srcImg + data.poster_path
                            } alt="affiche : ${titleOrName}"></div>`
                      }
                      
                      
                      
                      ${
                        !data.overview
                          ? '<div class="card-footer text-bg-black text-truncate"><span class="fw-bold fs-6 text-end">'
                           + data.name +  "</span></div>"
                          : '<div class="card-footer text-bg-black"><span class="fw-bold fs-6 text-end "> Score : <span>' +
                            data.vote_average.toFixed(1) +
                            "</span></span></div>"
                      }
                  
                  `;
  
            // appel
            myDiv2.append(myCard);
            
          // }
        
        // appel
        myContainer.append(title, myDiv2);        
        
      })
      .catch(error =>console.log(error));
      
  });
};

getAllFavorites();