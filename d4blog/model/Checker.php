<?php
require_once("DataBaseManager.php");

class Checker extends DBManager
{

  public  static function getAuthor($table, $id_user)
  {
    $bdd = new DBManager;
    $request = $bdd->connection();
    $result = $request->query(' SELECT users.login, users.rank FROM users INNER JOIN ' . $table . ' ON users.id = ' . $id_user);
    $author = $result->fetch(PDO::FETCH_ASSOC);

    // cette verification nous sert à la fois pour donner le nom de l'auteur, et gerer un utilisateur supprimé, mais aussi l'associer à notre code couleur (voir colorMyRank plus bas)
    if (!$author) {
      return $author = ["login" => "Auteur inconnu", 'rank' => "null"];
    } else {
      return $author;
    }
  }

  public static function articleGotComs($id_article)
  {
    $bdd = new DBManager;
    $request = $bdd->connection();
    $result = $request->query('SELECT * FROM commentaries WHERE id_article= ' . $id_article);
    $count = $result->rowCount();

    return $count;
  }

  // la fonction suivante sert a verifier la présence d'un admin
  public static function getLoginAndRank($id)
  {
    $bdd = new Checker;
    $log = $bdd->connection();
    $user = $log->query("SELECT login, `rank` FROM users WHERE id=$id");
    $result = $user->fetch();
    return $result;
  }

  public static function colorMyRank($rank)
  {
    if ($rank === 'admin') {
      return 'text-color1'; 
    } else if ($rank === 'user') {
      return 'text-color3';
    } else {
      return 'text-color2';
    }
  }

  public static function getMyScore($id_user) {
    
    $bdd = new Checker;
    $req = $bdd->connection();
    $coms = $req->query("SELECT * FROM commentaries WHERE id_user = $id_user");
    $result1 = $coms->rowCount() * 10;
    
    $bdd2 = new Checker;
    $req2 = $bdd2->connection();
    $arts = $req2->query("SELECT * FROM articles WHERE id_user = $id_user");
    $result2 = $arts->rowCount() * 50;

    $result = $result1 + $result2;
    return $result;
  }

}
