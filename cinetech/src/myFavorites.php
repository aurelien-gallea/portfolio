<?php
session_start();

try {
    $bdd = new PDO('mysql:host=localhost:3306;dbname=aurelien-gallea_cinetech;charset=utf8', 'cinetech', '63idyZ?19');
} catch (Exception $e) {
    die('Erreur : ' . $e->getMessage());
}

// on prépare 
$favoritesStatement = $bdd->prepare('SELECT * FROM favorites WHERE id_user=?');
$favoritesStatement->execute([$_SESSION['id']]);

// on fetch
$favoritesList = $favoritesStatement->fetchAll(PDO::FETCH_ASSOC);
    


//sortie en json
print json_encode($favoritesList);