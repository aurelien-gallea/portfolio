import apiKey from "./apiKey.js";
export const getVideo = (mediaType : string, idMedia: string) : void => {
    const myContainer = document.querySelector("#myContainer") as HTMLDivElement;
    fetch(`https://api.themoviedb.org/3/${mediaType}/${idMedia}/videos?api_key=${apiKey}&language=fr-FR`)
    .then(response => response.json())
    .then(data => {
        
        const videoDiv = document.createElement("div") as HTMLDivElement;

        if (data.results.length > 0) {
            const idVideo = data.results[0].key;
            videoDiv.classList.add("ratio", "ratio-16x9", "mt-5");
            videoDiv.innerHTML = `<iframe width="1120" height="630" src="https://www.youtube.com/embed/${idVideo}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
            
        } else {
            videoDiv.innerHTML = "<h3>aucune vidéo disponible</h3>";
        }
        myContainer.append(videoDiv);
    })
    .catch(error => console.log(error));
    

    
}