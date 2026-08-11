<?php
$title = "Contact";

ob_start();

?>
<div class="my-3 my-md-7 text-center"> 

    <h1>Contacter un membre de l'équipe:</h1>
</div>
<div class="m-3 m-md-7 d-flex flex-column flex-sm-row justify-content-center align-items-center mx-auto gap-5">
    <div class="bg-color2 d-flex flex-column align-items-center rounded pb-2">
        <img width="200" class="clip-photo" src="./public/assets/images/pascal.jfif" alt="pascal en photo" title="pascal en photo">
        <h2>Pascal</h2>
        <div class="d-flex gap-3">
            <a href="https://github.com/pascalloria/" target="_blank"><i class="fa-brands fa-github fs-4"></i></a>
            <a href="https://www.linkedin.com/in/pascal-loria/" target="_blank"><i class="fa-brands fa-linkedin fs-4"></i></a>
            <a href="mailto:dev.pascalloria@gmail.com?subject=demande de renseignements&body=Bonjour je vous contacte,"><i class="fa-solid fa-envelope fs-4"></i></a> <!-- attention il faut changer ton mail -->
        </div>

    </div>
    <div class="bg-color2 d-flex flex-column align-items-center rounded pb-2">
        <img width="200" class="clip-photo" src="./public/assets/images/aurelien.jpg" alt="aurélien en photo" title="aurélien en photo">
        <h2>Aurélien</h2>
        <div class="d-flex gap-3">
            <a href="https://github.com/aurelien-gallea/" target="_blank"><i class="fa-brands fa-github fs-4"></i></a>
            <a href="https://www.linkedin.com/in/aurelien-gallea" target="_blank"><i class="fa-brands fa-linkedin fs-4"></i></a>
            <a href="mailto:aurelien.gallea@gmail.com?subject=demande de renseignements&body=Bonjour je vous contacte,"><i class="fa-solid fa-envelope fs-4"></i></a>
        </div>

    </div>
</div>




<?php
$content = ob_get_clean();
require('./view/base.php');