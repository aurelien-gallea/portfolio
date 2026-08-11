<?php

class DBManager {

    protected function connection () {
        try {
            $bdd = new PDO('mysql:host=localhost:3306;dbname=aurelien-gallea_cinetech;charset=utf8', 'cinetech', '63idyZ?19');
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