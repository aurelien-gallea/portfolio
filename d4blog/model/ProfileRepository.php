<?php

require_once('./model/DataBaseManager.php');

class ProfileRepository extends DBmanager
{

public function getAllContentFromUser($table, $id_user) {
        $bdd = $this->connection();
        $request = $bdd->query('SELECT * FROM ' .$table.' WHERE id_user= '.$id_user);
        
        return $request;
    }



public function getAllInfosFromTable($table, $id) {
    $bdd = $this->connection();
        $request = $bdd->query('SELECT * FROM ' .$table.' WHERE id= '.$id);
        
        return $request;
}

}