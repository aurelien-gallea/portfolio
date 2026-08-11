<?php 

// on récupère tout de suite le login et le rang de l'utilisateur connecté pour l'affichage
if(isset($_SESSION['id'])) $me = Checker::getLoginAndRank($_SESSION['id']); 
?>
<!DOCTYPE html>
<html lang="fr">

<head>
<title><?= $title ?></title>
    <meta property="og:type" content="website"/>
    <meta charset="UTF-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	<meta property="og:type" content="website" />
    <meta property="og:title" content="Diablo 4 Blog" />
	<meta property="og:url" content="https://aurelien-gallea.students-laplateforme.io/d4blog" />  
    <meta property="og:description" content="Réalisé en duo, ce blog a pour thème diablo 4. N'hésitez pas a partager vos impressions en commentaires."/>
    <meta property="og:image" content="https://aurelien-gallea.students-laplateforme.io/d4blog/public/assets/images/diablo.jpg" />
    <!-- Twitter -->
    <!-- <meta property="twitter:card" content="summary_large_image"/>
    <meta property="twitter:url" content="https://aurelien-gallea.students-laplateforme.io/d4blog"/>
    <meta property="twitter:title" content="Diablo 4 Blog"/>
    <meta property="twitter:description" content="Réalisé en duo, ce blog a pour thème diablo 4. N'hésitez pas a partager vos impressions en commentaires."/>
    <meta property="twitter:image" content="https://aurelien-gallea.students-laplateforme.io/d4blog/public/assets/images/diablo.jpg"/> -->
    <link href="./public/assets/images/favicon.ico" rel="icon" type="image/x-icon" >
    <link rel="stylesheet" href="./public/design/default.css">
    <script src="https://kit.fontawesome.com/2847cc80c5.js" crossorigin="anonymous"></script>
    <script src="https://cdn.tiny.cloud/1/1g48gaaql5ca7z1e9yqi7giffrh0oxu7twzzdx3c9t0wbwvv/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
    <script>
      tinymce.init({
        selector: '#mycontent'      
        
      });
    </script>
</head>

<body class="d-flex flex-column">

    <header class="bg-color1">
        <div class="container">
            <?php require_once("./view/navbar.php") ?>
        </div>
        <?php if (isset($_SESSION['id'])) {
            
             ?>
            <div class="bg-color4">
                <div class="container d-flex justify-content-around align-items-center flex-wrap text-color2">
                    <div>

                        
                        <img src="./public/assets/images/favicon.ico" alt="icone de tete de diablo" title="icone avec la tête de diablo">
                        <span class="<?= Checker::colorMyRank($me['rank']) ?> fs-5 align-middle"><?= $me['login'] ?></span>
                    </div>
                    <div>
                        <!-- pour le fun un petit score de participation -->
                        <span><i class="fa-solid fa-trophy text-primary"></i> Mon score : <?= Checker::getMyScore($_SESSION['id']) ?></span>
                    </div>
                    <div id="weather">

                    </div>
                </div>
            </div>
        <?php } ?>
    </header>
    <?php if (isset($_SESSION['success'])) { ?>
        <div class="alert alert-primary position-absolute  mt-7 start-50 translate-middle w-100 container-md text-center"><?= $_SESSION["success"] ?></div>

    <?php clearMessage();    
        }
       
    ?>

    <?php if (isset($_SESSION['error'])) { ?>
        <div class="alert alert-primary position-absolute  mt-7 start-50 translate-middle w-100 container-md text-center"><?= $_SESSION["error"] ?></div>
    <?php clearMessage() ;
        }
        
    ?>


    <section class="flex-grow-1">
        <div class="container">
            <?= $content ?>
        </div>
    </section>



    <footer >
        <hr class="border border-primary border-3">
        <div class="container">
            <p class="text-primary">&copy; Mistrall et Eclat <i>@2023</i></p>
        </div>


    </footer>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
    <script src="./public/assets/js/enableTooltips.js"></script>
    <script src="./public/assets/js/clearMessage.js"></script>

    <?php if (isset($_SESSION['id'])) { ?>
        <script src="./public/assets/js/weatherBar.js"></script>
    <?php }
    if (isset($script)) {
        echo $script;
    }

    ?>

</body>