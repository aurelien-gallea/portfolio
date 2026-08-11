const bubble = document.querySelector('#bubble');
const messenger = document.querySelector('#messenger');
const titleMessenger = document.querySelector('#title-messenger');
const closeMessenger = document.querySelector('#closeMessenger');
const inputCom = document.querySelector('#com');

function toggleNone(btn) {

    btn.addEventListener('click', () => {
        bubble.classList.toggle('d-none');
        messenger.classList.toggle('d-none');
        // je veux vraiment que ça soit mobile-friendly
        inputCom.focus();
        inputCom.value = "";
        
    });
    
}
toggleNone(bubble);
toggleNone(closeMessenger);