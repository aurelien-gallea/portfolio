<?php

require_once("./classes/DBmanager.php");
class FavoritesManager extends DBManager
{
    const TABLE_NAME = "favorites";


    public function checkMedia($url)
    {
        $id_mediaType = '';
        if (strpos($url, 'movie')) {
            $id_mediaType = 'id_movie';
        } else if (strpos($url, 'serie')) {
            $id_mediaType = 'id_serie';
        } else if (strpos($url, 'actor')) {
            $id_mediaType = 'id_actor';
        } else {
            header('location:login.php?error=1&message=Impossible d\'ajouter aux favoris, merci de contacter un administrateur.');
            exit();
        }
        return $id_mediaType;
    }

    public function getAllFavorites()
    {
        $requete = $this->getAll($this::TABLE_NAME);
        return $requete;
    }

    public function alreadyFavorite($id_user, $url, $id_content)
    {
        $id_mediaType = $this->checkMedia($url);
        $bdd = $this->connection();
        $req = $bdd->prepare('SELECT * FROM ' . $this::TABLE_NAME . ' WHERE id_user= ? AND ' . $id_mediaType . '= ? ');
        $req->execute([$id_user, $id_content]);
        return $req->rowCount();
    }
    public function addFavorite($id_user, $url, $id_content)
    {

        $id_mediaType = $this->checkMedia($url);
        // connection BDD
        $bdd = $this->connection();
        // ajout de l'utilisateur
        $req = $bdd->prepare('INSERT INTO ' . $this::TABLE_NAME . ' (id_user, ' . $id_mediaType . ') VALUES (?,?)');
        $req->execute([$id_user, $id_content]);
        return $req;
    }
    public function removeFavorite($id_user, $url, $id_content)
    {
        $id_mediaType = $this->checkMedia($url);
        // connection BDD
        $bdd = $this->connection();
        // ajout de l'utilisateur
        $req = $bdd->prepare('DELETE FROM ' . $this::TABLE_NAME . ' WHERE id_user= ? AND ' . $id_mediaType . '= ? ');
        $req->execute([$id_user, $id_content]);
        return $req;
    }
}
