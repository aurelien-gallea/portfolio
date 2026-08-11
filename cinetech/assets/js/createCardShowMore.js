export const createCardShowMore = (status) => {
    // on créé une carte qui sera ajouté à la fin des autres pour créer un interaction supplémentaire
    const cardShowMore = document.createElement("div");
    cardShowMore.classList.add("card", "justify-content-enter", "align-items-center", "bg-black");
    cardShowMore.style.cursor = "pointer";
    cardShowMore.style.minWidth = "200px";
    cardShowMore.innerHTML += '<div><img class="img-fluid" src="./assets/images/show-more.jpg"></div>';
    cardShowMore.id = status;
    return cardShowMore;
};
