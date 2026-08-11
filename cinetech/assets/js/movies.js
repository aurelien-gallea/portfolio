import search from "./search.js";
import { getMedia } from "./getMedia.js";
import { BtnBackMenu } from './BtnBackMenu.js';
//fonction du header
search("multi", 1);
let mediaType;
let status;
const myChoice = (status) => {
    let title;
    if (status === "upcoming") {
        title = "En ce moment";
    }
    else if (status === "popular") {
        title = "Populaires";
    }
    else if (status === "top_rated") {
        title = "Les films cultes";
    }
    else {
        title = "On en parle";
    }
    return title;
};
// nombre de pages de résultats affichés en cas de clique sur la carte "voir plus"
let count = 15;
if (window.location.href.includes("search")) {
    document.body.querySelector("#btnContainer")?.prepend(BtnBackMenu("movies"));
    if (window.location.href.includes("upcoming")) {
        getMedia((mediaType = "movie"), (status = "upcoming"), count, myChoice(status), true);
    }
    else if (window.location.href.includes("popular")) {
        getMedia((mediaType = "movie"), (status = "popular"), count, myChoice(status), true);
    }
    else if (window.location.href.includes("top_rated")) {
        getMedia((mediaType = "movie"), (status = "top_rated"), count, myChoice(status), true);
    }
    else {
        getMedia((mediaType = "movie"), (status = "week"), count, myChoice(status), true);
    }
}
else {
    getMedia((mediaType = "movie"), (status = "upcoming"), 5, myChoice(status));
    getMedia((mediaType = "movie"), (status = "popular"), 5, myChoice(status));
    getMedia((mediaType = "movie"), (status = "top_rated"), 5, myChoice(status));
    getMedia((mediaType = "trending/movie"), (status = "week"), 5, myChoice(status));
}
