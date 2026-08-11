<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
	<link rel="shortcut icon" href="./faviconpika.ico" type="image/x-icon">
<link rel="icon" href="./faviconpika.ico" type="image/x-icon">
    <title>Pkmn Finder</title>
</head>
<body class="bg-zinc-900 ">
    <h1 class="text-3xl text-center m-5 text-red-900">Pokemon Finder</h1>
    <p class="container mx-auto text-center text-white">utiliser les champs ci dessous pour retrouver un pokémon de la 1ere génération. <br> Vous pouvez le rechercher par: numéro , nom, ou par type.</p>
    <form action="index.html" class="container mx-auto flex flex-col items-center gap-3 m-8 bg-red-900 sm:w-3/4 p-6 sm:rounded">
        <input class="rounded-md p-2 text-md w-full sm:w-3/4 md:w-1/2" type="text" name="id" id="id" placeholder="numéro Pokedex">
        <input class="rounded-md p-2 text-md w-full sm:w-3/4 md:w-1/2" type="text" name="nom" id="nom" placeholder="nom complet/incomplet">
        <select class="rounded-md p-2 text-md w-full sm:w-3/4 md:w-1/2">
            <option value=""><b>Aucun type<b></option>
            <option value="Plante">Plante</option>
            <option value="Poison">Poison</option>
            <option value="Feu">Feu</option>
            <option value="Vol">Vol</option>
            <option value="Eau">Eau</option>
            <option value="Insecte">Insecte</option>
            <option value="Normal">Normal</option>
            <option value="Electrique">Electrique</option>
            <option value="Sol">Sol</option>
            <option value="Fée">Fée</option>
            <option value="Combat">Combat</option>
            <option value="Psy">Psy</option>
            <option value="Roche">Roche</option>
            <option value="Acier">Acier</option>
            <option value="Spectre">Spectre</option>
            <option value="Glace">Glace</option>
            <option value="Dragon">Dragon</option>
        </select>
        <button id="filtrer" class="text-white py-2 px-4 border hover:bg-blue-500 rounded-xl">Filtrer</button>
    </form>
    <div id="card-field" class="container mx-auto grid gap-6 justify-center md:grid-cols-2 lg:grid-cols-3"></div>
    <script src="script.js"></script>
</body>
</html>