import apiKey from "./apiKey.js";
export const getMedia = (mediaType, status, nbOfPages, myTitle, hiddenCardShowMore = false) => {
    // creation
    const myContainer = document.querySelector("#myContainer");
    const srcImg = "https://image.tmdb.org/t/p/w300";
    const notFindImg = "./assets/images/not-find.jpg";
    const title = document.createElement("h2");
    // personnalisation
    title.classList.add("my-2", "align-self-start", "container");
    title.textContent = myTitle;
    const myDiv2 = document.createElement("div");
    myDiv2.classList.add("d-flex", "w-100", "overflow-auto", "gap-2", "rounded");
    const cardShowMore = document.createElement("a");
    // on créé une carte qui sera ajouté à la fin des autres pour créer un interaction supplémentaire
    cardShowMore.classList.add("card", "mb-3", "nav-link", "justify-content-enter", "align-items-center", "bg-black");
    cardShowMore.style.minWidth = "180px";
    cardShowMore.style.maxWidth = "180px";
    cardShowMore.innerHTML += '<div><img class="img-fluid" src="./assets/images/show-more.jpg"></div>';
    // on cache la carte si on en a pas besoin
    hiddenCardShowMore ? cardShowMore.style.display = "none" : "";
    for (let i = 1; i <= nbOfPages; i++) {
        fetch(`https://api.themoviedb.org/3/${mediaType}/${status}?api_key=${apiKey}&language=fr-FR&page=${i}`)
            .then((response) => response.json())
            .then((data) => {
            for (const key in data.results) {
                // if (data.results[key].vote_count >= 10) {
                const myCard = document.createElement("a");
                myCard.classList.add("card", "mb-3", "justify-content-between", "bg-black", "nav-link");
                myCard.style.minWidth = "180px";
                myCard.style.maxWidth = "180px";
                myCard.id = data.results[key].id;
                if (mediaType === "movie") {
                    myCard.href = "movies.php?id=" + myCard.id;
                }
                else if (mediaType === "tv") {
                    myCard.href = "series.php?id=" + myCard.id;
                }
                else if (mediaType === "trending/movie") {
                    myCard.href = "movies.php?id=" + myCard.id;
                }
                else if (mediaType === "person") {
                    myCard.href = "actors.php?id=" + myCard.id;
                }
                myCard.innerHTML += `
                      
                      
                      
                      ${!data.results[key].poster_path
                    ? !data.results[key].profile_path
                        ? `<div><img class="img-fluid card-img-top" src=${notFindImg} alt="not found image"></div>`
                        : `<div><img class="img-fluid card-img-top" src=${srcImg + data.results[key].profile_path} alt="not found image"></div>`
                    : `<div><img class="img-fluid card-img-top" src=${srcImg + data.results[key].poster_path} alt="not found image"></div>`}
                      
                      
                      
                      ${!data.results[key].overview && mediaType === "person"
                    ? '<div class="card-footer text-bg-black text-truncate"><span class="fw-bold fs-6 text-end">'
                        + data.results[key].name + "</span></div>"
                    : '<div class="card-footer text-bg-black"><span class="fw-bold fs-6 text-end "> Score : <span>' +
                        data.results[key].vote_average.toFixed(1) +
                        "</span></span></div>"}
                  
                  `;
                // appel
                myDiv2.append(myCard);
                // }
            }
            // appel
            //  une fois remplie on appel enfin notre carte d'interaction
            cardShowMore.id = status;
            if (mediaType === "movie") {
                cardShowMore.href = "movies.php?search=" + cardShowMore.id;
            }
            else if (mediaType === "tv") {
                cardShowMore.href = "series.php?search=" + cardShowMore.id;
            }
            else if (mediaType === "trending/movie") {
                cardShowMore.href = "movies.php?search=" + cardShowMore.id;
            }
            else if (mediaType === "person") {
                cardShowMore.href = "actors.php?search=" + cardShowMore.id;
            }
            myDiv2.append(cardShowMore);
            myContainer.append(title, myDiv2);
        })
            .catch(error => console.log(error));
    }
};
