const text = document.querySelector('.showMe');
const btnCom = document.querySelector('#btnCom');
const div = document.querySelector('.showHidden');

// on cache / montre les commentaires

btnCom.addEventListener('click', () => {
    div.classList.toggle('d-none');
    if (text.textContent == 'Cacher') {
        text.textContent= 'Afficher';
    } else {
        text.textContent= 'Cacher';
    }
});

