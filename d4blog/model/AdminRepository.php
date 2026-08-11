<?php

require_once("./model/DataBaseManager.php");


class AdminRepository extends DBManager {   

    const TABLE_NAME = "users";
    public function getAllUser() {
        $requete = $this->getAll($this::TABLE_NAME);
        return $requete;
    }

    public function changeRank($rank,$id){
        $bdd = $this->connection();
        $request = $bdd->prepare("UPDATE ".$this::TABLE_NAME." SET `rank` = ? WHERE id = ? ");
        $request->execute([$rank,$id]);
        return $request->rowCount();
    }

    public function deleteUser($id){
        $bdd = $this->connection();
        $request = $bdd->prepare("DELETE FROM ".$this::TABLE_NAME." WHERE id = ? ");
        $request->execute([$id]);
        return $request->rowCount();
    }

    public function eraseUser($id){
        $bdd = $this->connection();
        $tables = ["articles","commentaries","projects"];
        foreach ($tables as $table) {
            $request = $bdd->prepare("DELETE FROM ".$table." WHERE id_user = ? ");
            $request->execute([$id]);                                      
        }        
    }




}