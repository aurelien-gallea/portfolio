
<?php

require_once("./model/DataBaseManager.php");


class UsersRepository extends DBManager {   

    const TABLE_NAME = "users";
    public function getAllUser() {
        $requete = $this->getAll($this::TABLE_NAME);
        return $requete;
    }

    public function addUserBdd($login,$password,$email,$rank="user"){

        $bdd = $this->connection();
        $requete = $bdd->prepare("INSERT INTO ".$this::TABLE_NAME." (login, password, email,`rank`) VALUES (?,?,?,?)");      
        $requete->execute([$login,$password,$email,$rank]);
        return $requete;
    }

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

    public function connectUser($login, $password){
        $bdd = $this-> connection();
        $requete = $bdd->prepare("SELECT * FROM ".$this::TABLE_NAME." WHERE login= ? and password= ?");
        $requete->execute([$login,$password]);
        return $requete;
    }

    public function updateEmail ($email,$id){
        $bdd = $this->connection();         
        $requete = $bdd->prepare("UPDATE ".$this::TABLE_NAME." SET email = ?  WHERE id = ? ");
        $requete->execute([$email,$id]);
        return $requete->rowCount();
    }
    public function updatePassword ($newPassword,$id){
        $bdd = $this->connection();         
        $requete = $bdd->prepare("UPDATE ".$this::TABLE_NAME." SET password = ?  WHERE id = ? ");
        $requete->execute([$newPassword,$id]);
        return $requete->rowCount();
    }

    public function checkPassword ( $password,$id){
        $bdd = $this->connection();
        $request = $bdd->prepare("SELECT * from ".$this::TABLE_NAME." WHERE password= ? and id= ? ");
        $request->execute([$password,$id]);
        return $request;
    }
    
 }
