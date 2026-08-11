function clearMessage(){
    let alerts = document.querySelectorAll(".alert");
    alerts.forEach((alert)=> {
        alert.remove();
    })
};

setTimeout(clearMessage,"5000");
    