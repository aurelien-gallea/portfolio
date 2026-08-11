<?php
require_once("./model/DataBaseManager.php");


class ProjectRepository extends DBManager {

    const TABLE_NAME = "projects";
    const TABLE_LIKES = "likes";

    public function getAllProject() {
        $requete = $this->getAll($this::TABLE_NAME);
        return $requete;
    }


    public function addProject($title,$content,$id_user,$img,$date){
        $bdd = $this->connection();
        $requete = $bdd->prepare("INSERT INTO ".$this::TABLE_NAME."(title,content,id_user,img,`date`) VALUES (?,?,?,?,?)");
        $result = $requete->execute([$title,$content,$id_user,$img,$date]);
        return $result;        
    }

    public function deleteProject ($id) {
        $bdd = $this->connection();        
        $requete = $bdd->prepare("DELETE FROM ".$this::TABLE_NAME." WHERE id = ? ");
        $requete->execute([$id]);
        return $requete->rowCount();
    }


    public function updateProject($id){
        $bdd = $this->connection();  
        $requete = $bdd->prepare("SELECT * FROM ".$this::TABLE_NAME." WHERE id= ?");
        $requete->execute([$id]);
        return $requete;
    }

    public function updateProjectBdd ($title,$content,$id,$img) {
        $bdd = $this->connection();         
        $requete = $bdd->prepare("UPDATE ".$this::TABLE_NAME." SET title = ?, content =?, img=? WHERE id = ? ");
        $requete->execute([$title,$content,$img,$id]);
        return $requete->rowCount();
    }

    // Gestion des likes 

    public function addLikes ($id_project,$id_user){
        $bdd =$this->connection();
        $requete = $bdd->prepare("INSERT INTO ".$this::TABLE_LIKES."(id_project,id_user) VALUES (?,?)");
        $requete->execute([$id_project,$id_user]);   
        return $requete->rowCount(); 
    }

    public function getNumberLike ($id){
        $bdd = $this->connection();
        $request = $bdd->prepare ("SELECT * FROM ".$this::TABLE_LIKES." WHERE id_project = ?");
        $request->execute([$id]);
        return $request->rowCount();
    }

    public function checkIdUser ($id_project,$id_user){
        $bdd = $this->connection();
        $request = $bdd->prepare ("SELECT * FROM ".$this::TABLE_LIKES." WHERE id_project = ? AND id_user= ?");
        $request->execute([$id_project,$id_user]);
        return $request->rowCount();
    }

    public function removeLikes ($id_project,$id_user){
        $bdd =$this->connection();
        $requete = $bdd->prepare("DELETE FROM ".$this::TABLE_LIKES." WHERE id_project = ? AND id_user= ?");
        $requete->execute([$id_project,$id_user]);   
        return $requete->rowCount(); 
    }



}