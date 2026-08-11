import search from "./search.js";
import { getMedia } from "./getMedia.js";
import { BtnBackMenu } from "./BtnBackMenu.js";
//fonction du header
search("multi", 1);
let mediaType;
let status;
let count = 10;
if (window.location.href.includes("search")) {
    const btnContainer = document.body.querySelector("#btnContainer");
    if (window.location.href.includes("popular")) {
        getMedia((mediaType = "tv"), (status = "popular"), count, "Séries populaires", true);
    }
    else if (window.location.href.includes("top_rated")) {
        getMedia((mediaType = "tv"), (status = "top_rated"), count, "Séries cultes", true);
    }
    else if (window.location.href.includes("airing_today")) {
        getMedia((mediaType = "tv"), (status = "airing_today"), count, "Aujourd'hui", true);
    }
    else if (window.location.href.includes("on_the_air")) {
        getMedia((mediaType = "tv"), (status = "on_the_air"), count, "En ce moment", true);
    }
    btnContainer.append(BtnBackMenu(`series`));
}
else {
    getMedia((mediaType = "tv"), (status = "top_rated"), 5, "Séries cultes");
    getMedia((mediaType = "tv"), (status = "popular"), 5, "Séries Populaires");
    getMedia((mediaType = "tv"), (status = "airing_today"), 5, "Aujourd'hui");
    getMedia((mediaType = "tv"), (status = "on_the_air"), 5, "En ce moment");
}
