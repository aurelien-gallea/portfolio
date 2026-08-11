// les blocks pour modifier email et mot de passe
block1 = document.getElementById('block1');
block2 = document.getElementById('block2');

// les boutons pour passer d'un block a l'autres show/hidden
toggleB1 = document.querySelector('#toggle-block1');
toggleB2 = document.querySelector('#toggle-block2');

function showHidden(btn) {
    btn.addEventListener('click', () => {
        block1.classList.toggle('d-none');
        block2.classList.toggle('d-none');
    });
}

showHidden(toggleB1);
showHidden(toggleB2);