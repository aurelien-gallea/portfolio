<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="style2.css" />
    <title>Météo Locale</title>
  </head>
  <body class="">
    <header>
      <div id="flex-header">
        <span>Aurelien Gallea</span>
        <nav>
          <ul>
            <li><a href="index.php"> Accueil</a></li>
            <li>
              <a
                href="mailto:aurelien.gallea@gmail.com?subject=demande de renseignements&body=je vous contacte car je souhaite realiser :"
                >Contactez-moi</a
              >
            </li>
          </ul>
        </nav>
      </div>
    </header>
    <div class="container grow mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <!-- Titre -->
          <h1 class="text-center mt-5">Météo</h1>

          <!-- Ville / Temperature -->
          <div class="text-center">
            <span id="ville">paris</span>

            <div id="temperature">
              <span id="temperature_label"> xx.x </span> °C
            </div>
          </div>
        </div>
      </div>

      <div class="row justify-content-center">
        <div class="col-md-8 text-center">
          <!-- Changer de ville -->
          <div
            id="changer"
            class="mt-2 text-center p-3 text-white font-weight-bold text-uppercase d-inline-block"
          >
            Changer de ville
          </div>
        </div>
      </div>
    </div>
    <footer>
      <span>2022 © Aurelien Gallea</span>
    </footer>
    <script src="appli-meteo.js"></script>
  </body>
</html>
