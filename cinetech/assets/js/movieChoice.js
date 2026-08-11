import search from "./search.js";
import { getSimilar } from "./getSimilarMedia.js";
import { getOneMedia } from './getOneMedia.js';
import { BtnBackMenu, BtnBack } from './BtnBackMenu.js';
import { getVideo } from "./getVideo.js";
//fonction du header
search("/search/movie");
//  on recupère l'id du film/serie
const getId = () => window.location.href.split("=")[1];
let direction = "";
let mediaType = "";
if (window.location.href.includes("series")) {
    direction = "series";
    mediaType = "tv";
}
if (window.location.href.includes("movies")) {
    direction = "movies";
    mediaType = "movie";
}
document.body.querySelector("#btnContainer")?.prepend(BtnBackMenu(direction), BtnBack());
getOneMedia(mediaType, getId());
// l'affichages des suggestions + liens
setTimeout(() => getVideo(mediaType, getId()), 200);
setTimeout(() => {
    getSimilar(mediaType, getId(), 3, "Vous pourriez aimer");
}, 400);
