<?php

require_once("./classes/DBmanager.php");
class UserManager extends DBManager
{
    const TABLE_NAME = "users";
   

    // methodes
    public function avalaibleLogin($login){
        $bdd = $this->connection();
        $requete = $bdd->prepare("SELECT * FROM ".$this::TABLE_NAME." WHERE login = ? ");
        $requete->execute([$login]);
        return $requete->rowCount();       
    }

    public function avalaibleEmail($email){
        $bdd = $this->connection();
        $requete = $bdd->prepare("SELECT * FROM ".$this::TABLE_NAME." WHERE email = ? ");
        $requete->execute([$email]);
        return $requete->rowCount();       
    }

    public function signUp($login, $password, $email)
    {
        // connection BDD
        $bdd = $this->connection();
        // ajout de l'utilisateur
        $req = $bdd->prepare('INSERT INTO '.$this::TABLE_NAME.' (login, password, email) VALUES (?,?,?)');
        $req->execute([$login, $password, $email]);
        return $req;
    }
    
    public function signIn($login, $password) {

        // conection bdd
        $bdd = $this->connection();
        // connexion de l'utilisateur
        $signIn = $bdd->prepare("SELECT * FROM ".$this::TABLE_NAME." WHERE login= ? AND password= ?");
        $signIn->execute([$login,$password]);
        
        $isRegistered = $signIn->fetch();

    if (!empty($isRegistered['id'])) {
        $_SESSION["id"]=$isRegistered["id"];            
        $_SESSION["login"]=$isRegistered["login"];
        // successMessage("Vous êtes connecté.");
        header("location:index.php");
        exit;                
    } else {
        header('location:login.php?error=1&message=Nom d\'utilisateur ou mot de passe incorrect. Veuillez réessayer.');
        exit;
    }
        
    }

}