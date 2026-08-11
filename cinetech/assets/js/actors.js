import search from "./search.js";
import { getMedia } from "./getMedia.js";
import { BtnBackMenu } from "./BtnBackMenu.js";
//fonction du header
search("multi", 1);
let mediaType;
let status;
let count = 20;
if (window.location.href.includes("search")) {
    const btnContainer = document.body.querySelector("#btnContainer");
    if (window.location.href.includes("popular")) {
        getMedia((mediaType = "person"), (status = "popular"), count, "Acteurs populaires", true);
    }
    btnContainer.append(BtnBackMenu(`actors`));
}
else {
    getMedia((mediaType = "person"), (status = "popular"), 5, "Acteurs Populaires");
}
