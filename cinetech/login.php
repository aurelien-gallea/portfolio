<?php
session_start();

require_once('classes/UserManager.php');
require_once('classes/Security.php');
require_once('classes/Verify.php');

    //  Connection -------------------------------------------
if (isset($_POST["signIn"]) && !empty($_POST['login']) && !empty($_POST['pass'])) {
    echo($_POST["login"]);
    
    // protection des variables
    $login   = htmlspecialchars($_POST['login']);
    $pass    = htmlspecialchars($_POST['pass']);

    // on chiffre le mdp
    $pass = Security::hash($pass);
    $user = new UserManager();
    $user->signIn($login, $pass);
    
}
    // inscription -------------------------------------------
else if(isset($_POST["signUp"]) && !empty($_POST['login1']) && !empty($_POST['pass1']) && !empty($_POST['pass2']) &&!empty($_POST['mail'])) {
    if ($_POST['pass1'] == $_POST['pass2']) {

        // protection des variables
        $login1   = htmlspecialchars($_POST['login1']);
        $pass1    = htmlspecialchars($_POST['pass1']);
        $email    = htmlspecialchars($_POST['mail']);


        // verifications du mail (au cas où l'utilisateur change le type de l'input)
        if(!Verify::verifySyntax($email)) {
            header('location:login.php?error=1&message=merci de rentrer un email valide !');
            exit();
        }
        

        $user = new UserManager();

        // doublon login
        if($user->avalaibleLogin($login1) !== 0) {
            header('location:login.php?error=1&message=Identifiant déjà existant !');
            exit();
        }

        // doublon mail
        if($user->avalaibleEmail($email) !== 0) {
            header('location:login.php?error=1&message=adresse email déjà utilisée !');
            exit();
        }

        // on chiffre le mdp
        $pass1 = Security::hash($pass1);
                
        // on ajoute l'utilisateur
        $user->signUp($login1, $pass1, $email);

        // on le connecte tout de suite (sinon on l'aurait redirigé sur la meme page)
        // redirection intégré dans la méthode signIn
        $user->signIn($login1, $pass1);
           
    } else {
        header('location:login.php?error=1&message=merci de rentrer des mots de passe indentiques');
        exit();
    }
}

?>

<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="./assets/css/defaults.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="./assets/images/favicon.ico" rel="icon" type="image/x-icon" />
    <title>Connexion/inscription | Cinetech</title>
</head>

<body class="text-bg-info">

    <?php require_once("./src/header.php"); ?>


    <main class="mainContent flex-grow-1">
    <section id="signIn">
<!-- connexion -->
        <h1 class="text-center my-5">Connexion</h1>
        <div id="myContainer" class="d-flex justify-content-center flex-wrap gap-3 mx-3">


            <form  class="d-flex flex-column justify-content-center gap-4 mt-5" action="login.php" method="post">
                <div class="input-group gap-2">
                    <label class="input-group-text rounded-circle" for="login"><i class="fa-solid fa-user"></i></label>
                    <input class="form-control rounded-pill" required type="text" name="login" id="login" placeholder="Identifiant">
                </div>
                <div class="input-group rounded-pill gap-2">
                    <label class="input-group-text rounded-circle" for="pass"><i class="fa-solid fa-lock"></i></label>
                    <input class="form-control rounded-pill" required type="password" name="pass" id="pass" placeholder="Mot de passe">
                </div>

                <div>
                    <button class="btn btn-primary rounded-pill w-100 mt-2" name="signIn" type="submit">Connexion</button>
                </div>

                <div class="text-white d-flex align-items-center justify-content-center">
                    <span>Nouveau membre ?
                        <span class="ms-2 text-primary btnToggler pointer">Inscription</span>
                    </span>
                </div>

            </form>
        </div>
    </section>
    <section id="signUp" class="d-none">
<!-- inscription -->
        <h1 class="text-center my-5">Inscription</h1>
        <div id="myContainer" class="d-flex justify-content-center flex-wrap gap-3 mx-3">


            <form class="d-flex flex-column justify-content-center gap-2 mt-5" action="login.php" method="post">
                <div class="input-group gap-2">
                    <label class="input-group-text rounded-circle" for="login1"><i id="loginIcon" class="fa-solid fa-user"></i></label>
                    <input class="form-control rounded-pill" required minlength="3" type="text" name="login1" id="login1" placeholder="Identifiant">
                </div>
                <div class="mx-2">

                    <small id="errorLogin1"><i class="fa-solid fa-check"></i> 3 caractères minimum </small>
                </div>
                <div class="input-group gap-2">
                    <label class="input-group-text rounded-circle" for="mail"><i id="mailIcon" class="fa-solid fa-envelope"></i></label>
                    <input class="form-control rounded-pill" required  type="email" name="mail" id="mail" placeholder="Email">
                </div>
                <div class="mx-2">

                    <small id="errorMail"><i class="fa-solid fa-check"></i> adresse email valide </small>
                </div>
                <div class="input-group rounded-pill gap-2">
                    <label class="input-group-text rounded-circle" for="pass1"><i id="passIcon1" class="fa-solid fa-lock"></i></label>
                    <input class="form-control rounded-pill" required minlength="8" type="password" name="pass1" id="pass1" placeholder="Mot de passe">
                </div>
                <div class="input-group rounded-pill gap-2">
                    <label class="input-group-text rounded-circle" for="pass2"><i id="passIcon2" class="fa-solid fa-lock"></i></label>
                    <input class="form-control rounded-pill" required minlength="8" type="password" name="pass2" id="pass2" placeholder="Confirmation MDP">
                </div>
                <div class="d-flex flex-column mx-2">

                    <small id="errorPass1"><i class="fa-solid fa-check"></i> 8 caractères minimum, 1 Majuscule et 1 caractère spécial</small>
                    <small id="errorPass2"><i class="fa-solid fa-check"></i> mots de passe identiques</small>
                </div>



                <div>
                    <button id="subscribe" class="btn btn-primary rounded-pill w-100 " name="signUp" type="submit">Inscription</button>
                </div>


                <div class="text-white d-flex align-items-center justify-content-center">
                    <span>Déjà membre ?
                        <span class="ms-2 text-primary btnToggler pointer">Connexion</span>
                    </span>
                </div>
            </form>
        </div>

    </section>
    <?php
    if (isset($_GET['error']) && !empty($_GET['message'])) {
        echo '<p class="mt-5 alert alert-warning col-10 col-md-5 mx-auto text-center">' . htmlspecialchars($_GET['message']) . '</p>';
    }
    ?>
    </main>
    <?php require_once("./src/footer.php"); ?>



    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+jjXkk+Q2h455rYXK/7HAuoJl+0I4" crossorigin="anonymous"></script>
    <script src="./assets/js/handleFormToggler.js"></script>


</body>

</html>