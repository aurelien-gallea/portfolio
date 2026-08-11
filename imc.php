<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta property="og:title" content="Mon portfolio v1" />
    <meta
      property="og:description"
      content="Retrouver mon portfolio réalisé dans le cadre de ma reconversion dans le web"
    />
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="style.css" />
    <link rel="shortcut icon" href="image/favicon.png" />
    <title>Aurelien Gallea | Portfolio v.1</title>
  </head>
  <body class="flex flex-col min-h-screen">
    <section>
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
    </section>
    <section class="flex-grow">
      <div
        class="mx-auto my-16 flex flex-col items-center bg-green-500"
      >
        <h1 class="text-2xl my-6 text-white ">Calculateur d'IMC</h1>
        <form id="imc" class="flex flex-col justify-center items-center gap-6">
          <div class="flex items-center px-6">
            <div class="bg-stone-100 p-3 border-r rounded-l">
              <label for="height"
                ><img
                  class="h-6"
                  src="./image/la-taille.png"
                  alt="la taille"
              /></label>
            </div>
            <div>
              <input
                id="height"
                type="text"
                class="heightBMI rounded-r text-xl p-3 h-12 w-full"
                placeholder="votre taille en cm"
              />
            </div>
          </div>
          <div class="flex items-center px-6">
			  <div class="bg-stone-100 rounded-l p-2 border-r ">
              <label for="weight"
                ><img class="h-8" src="./image/poids.png" alt="le poids"
              /></label>
            </div>
            <div>
              <input
                id="weight"
                type="text"
                class="weightBMI rounded-r text-xl p-3 h-12 w-full"
                placeholder="votre poids en kg"
              />
            </div>
          </div>
			<div class="flex items-center px-6">
          <button id="btn" class=" border p-3 text-white rounded hover:bg-white hover:text-stone-900">Valider les infos</button>
			</div>
        </form>
        <div class="m-5">
          <p id="resultNumber">0</p>
        </div>
      </div>
    </section>

    <section id="contact">
      <h3>Contact</h3>
      <h4>Alors on travaille ensemble ?</h4>
      <a
        href="mailto:aurelien.gallea@gmail.com?subject=prise de contact&body=je vous contacte"
        >Envoyer un email</a
      >
    </section>
    <footer id="footloose">
      <span>2022 © Aurelien Gallea</span>
    </footer>
    <script src="imc.js"></script>
  </body>
</html>
