// on doit afficher le text de la bdd avec sa reelle casse

const bloc  = document.querySelector('#text-art');
bloc.innerHTML = "<p>" + bloc.innerHTML.split("\n").join("<br>") + "</p>";

// on peut aussi utiliser style="white-space: pre-line, mais c'est moche !"

// rip script partit trop tôt