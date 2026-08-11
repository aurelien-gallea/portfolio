"use strict";
// le btn qui fait apparaître la bonne div
const btnToggler = document.querySelectorAll(".btnToggler");
// les 2 formulaires
const signInForm = document.querySelector("#signIn");
const signUpForm = document.querySelector("#signUp");
// formulaire d'inscription ------------------
const loginIcon = document.querySelector("#loginIcon");
const mailIcon = document.querySelector("#mailIcon");
const passIcon1 = document.querySelector("#passIcon1");
const passIcon2 = document.querySelector("#passIcon2");
const login1 = document.querySelector("#login1");
const mail = document.querySelector("#mail");
const pass1 = document.querySelector("#pass1");
const pass2 = document.querySelector("#pass2");
const regexPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
const regexMail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/;
const errorLogin1 = document.querySelector("#errorLogin1");
const errorMail = document.querySelector("#errorMail");
const errorPass1 = document.querySelector("#errorPass1");
const errorPass2 = document.querySelector("#errorPass2");
const subscribe = document.querySelector("#subscribe");
// apparition/dispartion de la div
btnToggler.forEach((myToggler) => {
    myToggler.addEventListener("click", () => {
        signInForm.classList.toggle("d-none");
        signUpForm.classList.toggle("d-none");
    });
});
// -------------------- inscription -------------------------------------
// notre fonction de gestion des couleurs pour guider l'utilisateur
const colorStatus = (input, iconColor, errorMessage) => {
    input.addEventListener("keyup", () => {
        let myCondition = null;
        // on evite de trop se repeter
        switch (input) {
            case login1:
                myCondition = login1.value.length >= 3;
                break;
            case mail:
                myCondition = regexMail.test(mail.value);
                break;
            case pass1:
                myCondition = regexPass.test(pass1.value);
                break;
            case pass2:
                myCondition =
                    regexPass.test(pass2.value) && pass1.value === pass2.value;
                break;
            default:
                break;
        }
        if (myCondition) {
            iconColor.classList.add("text-success");
            errorMessage.classList.add("text-success");
            iconColor.classList.remove("text-danger");
            errorMessage.classList.remove("text-danger");
        }
        else {
            iconColor.classList.add("text-danger");
            errorMessage.classList.add("text-danger");
            iconColor.classList.remove("text-success");
            errorMessage.classList.remove("text-success");
        }
    });
};
colorStatus(login1, loginIcon, errorLogin1);
colorStatus(mail, mailIcon, errorMail);
colorStatus(pass1, passIcon1, errorPass1);
colorStatus(pass2, passIcon2, errorPass2);
// activation // désactivation du formulaire
signUpForm.addEventListener("keyup", (e) => {
    if (login1.value.length < 3 ||
        !regexPass.test(pass1.value) ||
        !regexPass.test(pass2.value) ||
        pass2.value !== pass1.value) {
        e.preventDefault();
        subscribe.style.cursor = "not-allowed";
        subscribe.classList.add("bg-white");
    }
    else {
        subscribe.style.cursor = "pointer";
        subscribe.classList.remove("bg-white");
    }
});
// a enlever une fois le back codé ----------------------------------------------------------------------------------------
const fonctionAenleverUneFoisLeBackCode = (form) => {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("cette fonctionnalité est en cours de création.");
    });
};
// fonctionAenleverUneFoisLeBackCode(signUpForm);
// fonctionAenleverUneFoisLeBackCode(signInForm);
// fin de la suppression ------------------------------------------------------------------------------------------------------
// -------------------------- connexion -------------------------------
