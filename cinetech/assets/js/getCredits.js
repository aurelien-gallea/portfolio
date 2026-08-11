import apiKey from "./apiKey.js";
export const getCredits = (myId, credits, nbOfPage, myTitle) => {
    const myContainer = document.querySelector("#myContainer");
    const title = document.createElement("h2");
    const alert = document.createElement('div');
    const srcImg = "https://image.tmdb.org/t/p/original";
    const notFindImg = "./assets/images/not-find.jpg";
    // personnalisation
    title.classList.add("my-5", "align-self-start", "container");
    title.textContent = myTitle;
    const myDiv2 = document.createElement("div");
    myDiv2.classList.add("d-flex", "w-100", "overflow-auto", "gap-2", "rounded");
    for (let i = 1; i <= nbOfPage; i++) {
        fetch(`https://api.themoviedb.org/3/person/${myId}/${credits}?api_key=${apiKey}&language=fr-FR&page=${i}`)
            .then(response => response.json())
            .then((data) => {
            if (data.cast.length === 0) {
                alert.classList.add("alert", "alert-warning", "text-center", "my-5");
                alert.innerHTML = 'Aucun contenu similaire trouvé !';
                myDiv2.classList.remove("w-100");
                myDiv2.append(alert);
            }
            else {
                for (const key in data.cast) {
                    // création d'une carte pour chaque contenu
                    const myCard = document.createElement("a");
                    myCard.classList.add("card", "mb-3", "justify-content-between", "bg-black", "nav-link");
                    myCard.style.minWidth = "180px";
                    myCard.style.maxWidth = "180px";
                    myCard.id = data.cast[key].id;
                    if (credits === "movie_credits") {
                        myCard.href = "movies.php?id=" + myCard.id;
                    }
                    else if (credits === "tv_credits") {
                        myCard.href = "series.php?id=" + myCard.id;
                    }
                    myCard.innerHTML += `
                  
                  
                  
                  ${!data.cast[key].poster_path
                        ? !data.cast[key].profile_path
                            ? `<div><img class="img-fluid card-img-top" src=${notFindImg} alt="not found image"></div>`
                            : `<div><img class="img-fluid card-img-top" src=${srcImg + data.cast[key].profile_path} alt="not found image"></div>`
                        : `<div><img class="img-fluid card-img-top" src=${srcImg + data.cast[key].poster_path} alt="not found image"></div>`}
                  
                  
                  ${data.cast[key].overview &&
                        data.cast[key].media_type === "movie"
                        ? '<div class="card-footer text-bg-black"><span class="fw-bold fs-6 text-end">Popularité : ' +
                            data.cast[key].popularity.toFixed(0) +
                            "</span></div>"
                        : '<div class="card-footer text-bg-black"><span class="fw-bold fs-6 text-end"> Score : <span>' +
                            data.cast[key].vote_average.toFixed(1) +
                            "</span></span></div>"}
              
              `;
                    // on ajoute la carte dans la div parente
                    myDiv2.append(myCard);
                }
            }
            // appel
            myContainer.append(title, myDiv2);
        })
            .catch(error => console.log(error));
    }
};
