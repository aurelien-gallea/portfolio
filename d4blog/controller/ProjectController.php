<?php

require_once("./model/ProjectRepository.php");
require_once("./controller/ImageManager.php");
 



class ProjectController {
    
    public function __construct (private readonly ProjectRepository $projectRepository) {}

    // private $projectRepository = new ProjectRepository;

    function home() {       
        //Model        
        $requete = $this->projectRepository->getAllProject();
        $likes = [];
        if (!$requete){
            throw new Exception("Les projets n'ont pas pu être affichés.");
            exit();
        } 
        // suppression du Projet
        if (!empty($_GET["deleteId"])){            
            $this->deleteProject($_GET["deleteId"]);
        // modification du Projet
        } else if (!empty($_GET["updateId"])){             
            $this->updateProject($_GET["updateId"]);            
        } 
        // ajout d'un like
        else if (!empty($_GET["like"]) && !empty($_SESSION["id"])){
            $this->addLikes($_GET["like"],$_SESSION["id"]);
        }
        // suppression d'un like 
        else if (!empty($_GET["dislike"]) && !empty($_SESSION["id"])){
            $this->removeLikes($_GET["dislike"],$_SESSION["id"]);
        }             
        // view 
        require("./view/Projects/projectsView.php");  
    }

    function createProject() {
        //View
        require ("./view/Projects/createProjectView.php");
    }

    function uploadImage(){
        $image = new ImageManager;
        $result = $image->uploadImg();
        return $result;   
    }

    function addProject($title,$content,$img) {
        // Model
        if (!empty($_SESSION["id"])){
            $id_user = $_SESSION["id"];
            $date = date('Y/m/d H:i:s');
            $result = $this->projectRepository->addProject($title,$content,$id_user,$img, $date);   
            if (!$result){
                throw new Exception("Le projet ne peut pas être créé pour le moment, si l'erreur persiste merci de contacter l'administrateur."); 
                exit();         
            } else {
                successMessage("Le projet a bien été créé.");
                redirect("index.php?page=home");                
            }   
        }        
       
    }

    function deleteProject ($id) {
        $result = $this->projectRepository->deleteProject($id);    
        if ($result === 0 ){            
            throw new Exception("Le projet ne peut pas être supprimé pour le moment, si l'erreur persiste merci de contacter l'administrateur.");  
        } else {
            successMessage("Le projet a bien été supprimé.");
            redirect("index.php?page=home");  
        }
    }

    function updateProject ($id){ 
        // Model 
        $request = $this->projectRepository->updateProject($id);        
        // View
        require ("./view/Projects/updateProjectView.php");
    }  

    function updateBddProject ($title,$content,$id,$img){
        
        $result = $this->projectRepository->updateProjectBdd($title,$content,$id,$img);
        if ($result ===0){
            throw new Exception("La modification du projet a échoué. Veuiller contacter l'administrateur du site.");
        } else {
            successMessage("La modification a été effectuée avec succès.");
            redirect("index.php?");           
        }     
    }

    function addLikes($id_project,$id_users){
       
        $result = $this->projectRepository->addLikes($id_project,$id_users);
        redirect("index.php");
        if ($result === 0){
            throw new Exception("Le like n'a pas pu être pris en compte. Veuiller contacter l'administrateur du site.");
        }  
    }

    function removeLikes($id_project,$id_users){
        $result = $this->projectRepository->removeLikes($id_project,$id_users);
        redirect("index.php");
        if ($result === 0){
            throw new Exception("Le like n'a pas pu être supprimé en compte. Veuiller contacter l'administrateur du site.");
        }  
    }
    function getNumberlike($id_project){
        $like = $this->projectRepository->getNumberLike($id_project);
        return $like;
    }

    function checkIdUser ($id_project,$id_user){
        $request = $this->projectRepository->checkIdUser($id_project,$id_user);
        return $request;
    }
}