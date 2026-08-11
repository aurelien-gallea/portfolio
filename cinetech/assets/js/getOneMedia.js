import apiKey from "./apiKey.js";
export const getOneMedia = (mediaType, idMedia) => {
    const myContainer = document.querySelector("#myContainer");
    const title = document.querySelector(".param");
    const notFindImg = "./assets/images/not-find.jpg";
    const srcImg = "https://image.tmdb.org/t/p/original";
    // recuperer le media
    fetch(`https://api.themoviedb.org/3/${mediaType}/${idMedia}?api_key=${apiKey}&language=fr-FR`)
        .then((response) => response.json())
        .then((data) => {
        mediaType === "movie" ? title.textContent = data.title : title.textContent = data.name;
        const myDiv2 = document.createElement("div");
        const myCard = document.createElement("div");
        const resume = document.createElement("div");
        const getDateToFrench = (date) => new Date(date).toLocaleDateString("fr-FR");
        myCard.classList.add("card", "border-0", "bg-info");
        myCard.style.minWidth = "200px";
        myCard.style.maxWidth = "500px";
        myCard.innerHTML = `
                      
                      
                      
                      ${!data.poster_path
            ? !data.profile_path
                ? `<div><img class="img-fluid card-img-top" src=${notFindImg} alt="not found image"></div>`
                : `<div><img class="img-fluid card-img-top" src=${srcImg + data.profile_path} alt="not found image"></div>`
            : `<div><img class="img-fluid card-img-top" src=${srcImg + data.poster_path} alt="not found image"></div>`}
                      
                      
                      
                      ${!data.overview
            ? '<div class="card-footer bg-black"><span class="badge fs-4 text-end ">Popularité : ' +
                data.popularity.toFixed(0) +
                "</span></div>"
            : '<div class="card-footer bg-black"><span class="badge fs-4 text-end "> Score : <span>' +
                data.vote_average.toFixed(1) +
                "</span></span></div>"}
                  
                  `;
        let arrayGenres = [];
        for (const key in data.genres) {
            arrayGenres.push(data.genres[key].name);
        }
        let arrayNetworks = [];
        for (const key in data.networks) {
            arrayNetworks.push(data.networks[key].name);
        }
        let arrayProductions = [];
        for (const key in data.production_companies) {
            arrayProductions.push(data.production_companies[key].name);
        }
        if (mediaType !== "person") {
            resume.innerHTML += `<div><b>Genres : </b>${arrayGenres.join(", ")}</div>`;
            if (mediaType === "movie") {
                resume.innerHTML += `<div><b>Durée : </b>${data.runtime} min</div>`;
                resume.innerHTML += `<div><b>date de sortie : </b>${getDateToFrench(data.release_date)}</div>`;
            }
            if (mediaType === "tv") {
                resume.innerHTML += `<div><b>date de sortie 1er épisode: </b>${getDateToFrench(data.first_air_date)}</div>`;
                resume.innerHTML += `<div><b>date de sortie dernier épisode: </b>${getDateToFrench(data.last_episode_to_air.air_date)}</div>`;
                resume.innerHTML += `<div><b>Nb de saisons : </b>${data.number_of_seasons}</div>`;
                resume.innerHTML += `<div><b>Nb d'épisodes : </b>${data.number_of_episodes}</div>`;
            }
            resume.innerHTML += `<div class="my-3"><b>Résumé : </b>${data.overview.length === 0 ? "désolé aucun résumé n'est disponible !" : data.overview}`;
            arrayProductions.length === 0 ? null : resume.innerHTML += `<div><b>Production : </b>${arrayProductions.join(', ')}`;
        }
        if (mediaType === "person") {
            resume.innerHTML += `<div class="mb-3"><b>Biographie : </b>${data.biography}`;
            resume.innerHTML += `<div><b>Date de naissance : </b>${getDateToFrench(data.birthday)}`;
            data.deathday !== null ? resume.innerHTML += `<div><b>Décès : </b>${getDateToFrench(data.deathday)}` : null;
        }
        resume.innerHTML += `<div><b>Popularité : </b>${data.popularity.toFixed(0)}</div>`;
        if (mediaType === "tv") {
            resume.innerHTML += `<div><b>Distribué par : </b>${arrayNetworks.join(', ')}</div>`;
            resume.innerHTML += `<div><b>En production : </b>${data.in_production ? "Oui" : "Non"}</div>`;
        }
        if (mediaType === "movie") {
            let profit = data.revenue - data.budget;
            const numberToMillion = (myNumber) => myNumber >= 1000000 || myNumber <= 1000000 && myNumber < 0 ? (myNumber / 1000000).toFixed(2) + " millions" : myNumber;
            data.budget === 0 ? null : resume.innerHTML += `<div><b>Budget : </b>${numberToMillion(data.budget)} $</div>`;
            data.revenue === 0 || data.budget === 0 ? null : resume.innerHTML += `<div><b>Profit : </b>${profit === 0 ? "inconnu" : numberToMillion(profit) + " $"} </div>`;
        }
        myDiv2.classList.add("d-flex", "gap-3", "flex-column", "flex-md-row");
        resume.classList.add("col-lg-8", "border", "border-secondary", "rounded", "p-3");
        // appel
        myDiv2.append(myCard, resume);
        myContainer.append(myDiv2);
    })
        .catch(error => {
        console.log(error);
        myContainer.innerHTML = "<h1>404 cette page n'existe pas</h1>";
    });
};
