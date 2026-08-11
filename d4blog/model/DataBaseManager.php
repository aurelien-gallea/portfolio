<?php

class DBManager {

    protected function connection () {
        try {
            $bdd = new PDO('mysql:host=localhost:3306;dbname=aurelien-gallea_d4b;charset=utf8', 'aurelien-d4b', '@azertyuiopml83');
        }catch(Exception $e) {
            throw new Exception ('Erreur : '.$e->getMessage());
        }
        return $bdd;
    }

    protected function getAll ($table) {  
        $bdd= $this->connection();
        $requete = $bdd->query('SELECT * FROM '.$table);
        return $requete;
        
    }
    
}