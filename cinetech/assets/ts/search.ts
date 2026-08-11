import apiKey from "./apiKey.js";

// rechercher ----------
const form = document.querySelector("#searchForm") as HTMLFormElement;
const searchBar = document.querySelector("#searchBar") as HTMLInputElement;
const button: HTMLInputElement = document.querySelector(
  "#button"
) as HTMLInputElement;
const title = document.querySelector("h1") as HTMLHeadingElement;
const myContainer = document.querySelector("#myContainer") as HTMLDivElement;
const srcImg: string = "https://image.tmdb.org/t/p/w300";
const notFindImg: string = "./assets/images/not-find.jpg";

let mediaType: "tv" | "movie" | "person" | "multi";

const findSomething = (mediaType: string, page: number) => {
  let range: number; // avoir
  const myContainer = document.querySelector("#myContainer") as HTMLDivElement;
  const notFindImg: string = "./assets/images/not-find.jpg";
  const srcImg: string = "https://image.tmdb.org/t/p/original";
  fetch(
    `https://api.themoviedb.org/3/search/${mediaType}?api_key=${apiKey}&query=${searchBar.value}`
  )
    .then((response) => response.json())
    .then((data) => {
      

      for (const key in data.results) {
        let newMediaType = data.results[key].media_type;
        let idMedia = data.results[key].id;
        
        fetch(
          `https://api.themoviedb.org/3/${newMediaType}/${idMedia}?api_key=${apiKey}&query=${searchBar.value}&language=fr-FR&page=${page}`
        )
          .then((response) => response.json())
          .then((data) => {
            
            const myDiv2 = document.createElement("div");
            const myCard = document.createElement("a") as HTMLAnchorElement;
  
            myCard.classList.add("card", "justify-content-between", "bg-black", "nav-link");
            myCard.style.minWidth = "180px";
            myCard.style.maxWidth = "180px";
            myCard.id = data.id;
            let title: string = "";
            if (newMediaType === "movie") {
                myCard.href = "movies.php?id=" + myCard.id;
                title = data.title;
              } else if (newMediaType === "tv") {
                myCard.href = "series.php?id=" + myCard.id;
                title = data.name;
              } else if (newMediaType === "trending/movie"){
                myCard.href = "movies.php?id=" + myCard.id;
                title = data.title;
              } else if (newMediaType === "person") {
                myCard.href = "actors.php?id=" + myCard.id;
                title = data.name;
            }

            myCard.innerHTML += `
                      
                      
                      <div class="text-center fs-5 py-2"><span >${title}</span></div>
                      ${
                        !data.poster_path
                          ? !data.profile_path
                            ? `<div><img class="img-fluid card-img-top" src=${notFindImg} alt="not found image"></div>`
                            : `<div><img class="img-fluid card-img-top" src=${
                                srcImg + data.profile_path
                              } alt="not found image"></div>`
                          : `<div><img class="img-fluid card-img-top" src=${
                              srcImg + data.poster_path
                            } alt="not found image"></div>`
                      }
                      
                      
                      
                      ${
                        !data.overview &&
                        data.media_type !== "person"
                          ? '<div class="card-footer text-bg-black"><span class="fw-bold fs-6 text-end">Popularité :' +
                            data.popularity.toFixed(0) +
                            "</span></div>"
                          : '<div class="card-footer text-bg-black"><span class="fw-bold fs-6 text-end"> Score : <span>' +
                            data.vote_average.toFixed(1) +
                            "</span></span></div>"
                      }
                  
                  `;

            myDiv2.classList.add(
              "d-flex",
              "gap-3",
              "flex-column",
              "flex-md-row"
            );
            
            // appel
            myDiv2.append(myCard);
            myContainer.append(myDiv2);
          })
          .catch((error) => {
            console.log(error);
            // myContainer.innerHTML = "<h1>404 cette page n'existe pas</h1>";
          });
      }
    });
};

// On autorise le formulaire qu'avec un minimum de 3 caractères
searchBar.addEventListener("keyup", () => {
  if (searchBar.value.length <2) {
      searchBar.placeholder = "2 caractères minimum...";
      searchBar.classList.add("text-danger");
      button.style.cursor = "not-allowed";
      button.classList.remove("orange");
      
    } else {
      button.style.cursor = "pointer";
      searchBar.classList.remove('text-danger', "bg-black");
      button.classList.add("orange");

      
    }
})
// on annule le formulaire pour pouvoir valider via entrer et empecher la redirection
form.addEventListener('submit', (e)=> e.preventDefault());

button.addEventListener("click", () => {
        if(searchBar.value.length >= 2) {
          myContainer.innerHTML = "";
          findSomething("multi", 1);
          title.textContent = "Résultats pour : " + searchBar.value;
          
        } else {
          searchBar.classList.add("bg-black");
          searchBar.value ="";
        }
      });
export default findSomething;
