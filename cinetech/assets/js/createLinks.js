export const createLinks = (pageName) => {
    setTimeout(() => {
        const newTarget = document.querySelectorAll(".card");
        for (let i = 0; i < newTarget.length; i++) {
            newTarget[i].addEventListener('click', () => window.location.href = "./" + pageName + ".php?id=" + newTarget[i].id);
        }
    }, 500);
};
