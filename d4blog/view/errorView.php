<?php
$title = "Erreur";
ob_start(); ?> 
    <div class="my-5 text-center">
        <h1>OUPS !</h1>
        <p><?=$error ?></p>
    </div>
<?php 
$content = ob_get_clean();
require_once("base.php");
?>


    