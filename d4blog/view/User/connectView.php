<?php
    $title = "Connection";
    ob_start();
?>

   
    <div class="d-flex justify-content-center align-items-center containerCenter">    
        <?php 
            if (isset($_GET["success"])){
            if ($_GET["success"] == 1) { ?>

                <p class="card m-2 p-1 bg-success d-inline-block"><?=$_GET["message"] ?></p>  
            
        <?php }
        } 
        if (isset($_GET["error"])){
            if ($_GET["error"] == 1) { ?>

                <p class="card m-2 p-1 bg-danger d-inline-block"><?=$_GET["message"] ?></p>  

        <?php }
        }
        ?>
        
            <div class="card p-3 bg-color2"> 
                <!-- En-tête de la carte -->
                <div class="card-header">
                    <div class="card-title h2 text-center"> Connection </div>
                </div>

                <!-- Corps -->
                <div class="card-body ">
                    <form  class="form text-center " method="post" action=".?page=connect">
                        <p class="row align-items-center justify-content-center">
                            <label class="label col-4 fw-bold d-none d-md-block " for="login">Login :</label>
                            <input class="form-control-sm col-8" type="text" name="login" id="login" placeholder="Entrer votre pseudo" required >
                        </p>      
                        <p class="row align-items-center justify-content-center">
                            <label class="label col-4 fw-bold d-none d-md-block" for="password">Mot de passe :</label>
                            <input class="form-control-sm col-8" type="password" name="password" id="password" placeholder="Entrer votre mot de passe" required>
                        </p>
                        <button class="btn text-bg-dark rounded-3 px-3 py-2 " type="submit">Se connecter</button>  
                    </form>
                </div>
                <!-- Pied -->
                <div class="card-footer p-0">            
                    <div class="row justify-content-between flex-wrap text-center">
                        <p class="col-12 col-md-5"><a href="index.php?page=contact"><i>Mot de passe oublié ?</i></a></p>
                        <p class="col-12 col-md-5">Pas encore membre ? <a href="index.php?page=inscription"><i>inscrivez-vous</i></a></p>
                    </div>                    
                </div>
            </div>
        
    </div>

   
<?php 
$content = ob_get_clean();
require_once("./view/base.php");
?>
