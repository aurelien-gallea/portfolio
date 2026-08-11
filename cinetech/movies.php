<?php session_start() ?>
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="./assets/css/defaults.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="./assets/images/favicon.ico" rel="icon" type="image/x-icon" />
    <title>Films | Cinetech</title>
</head>

<body class="text-bg-info">

    <?php require_once("./src/header.php");
    if (!empty($_GET["id"])) { ?>
        <main class="mainContent flex-grow-1">
            <h1 id="<?= $_GET["id"] ?>" class="param my-5 text-center"></h1>
            <div id="btnContainer" class="container d-flex justify-content-between my-4 flex-wrap gap-3">
                <?php require_once("./src/isFavorite.php"); ?>
            </div>
            <div id="myContainer" class="container d-flex flex-column align-items-center gap-3">
            </div>

            <div class="container d-flex justify-content-center my-5">


            </div>
        </main>
        <?php require_once("./src/footer.php"); ?>
        <script type="module" src="./assets/js/myChoice.js"></script>
    <?php } else { ?>
        <main class="mainContent flex-grow-1">

            <h1 class="text-center my-5">Les films</h1>
            <div id="btnContainer" class="container d-flex justify-content-center my-4 flex-wrap gap-3"></div>

            <div id="myContainer" class="d-flex justify-content-center flex-wrap gap-3 mx-3"></div>



            </div>
        </main>
        <?php require_once("./src/footer.php"); ?>
        <script type="module" src="./assets/js/movies.js"></script>
    <?php } ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+jjXkk+Q2h455rYXK/7HAuoJl+0I4" crossorigin="anonymous"></script>



</body>

</html>