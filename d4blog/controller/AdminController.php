<?php

require_once("./model/AdminRepository.php");

class AdminController {

    public function __construct(private readonly AdminRepository $adminRepository) {

    }


    function getAllUsers () {
        $request = $this->adminRepository->getAllUser();
        if (!$request){
            throw new Exception("La liste des utilisateurs n'a pas pu être affichée.");
            exit();
        };
        require("./view/User/adminView.php");        
    }

    function promoteAdmin($id){
        $result = $this->adminRepository->changeRank("admin",$id);
        if ($result ===0){
            throw new Exception("Cet utilisateur n'a pas pu être promu au rang d'admin. Veuillez contacter l'administrateur du site.");
        } else {
            successMessage("Cet utilisateur a maintenant le rang : admin ");                    
        }     
    }
    function demoteUser($id){
        $result = $this->adminRepository->changeRank("user",$id);
        if ($result ===0){
            throw new Exception("Cet utilisateur n'a pas pu être rétrogradé au rang de user. Veuillez contacter l'administrateur du site.");
        } else {
            successMessage("Cet utilisateur à maintenant le rang : user ");                    
        }  
    }

    function deleteUser($id){
        $result = $this->adminRepository->deleteUser($id);
        if ($result === 0){
            throw new Exception("Cet utilisateur n'a pas pu être supprimé de la base de donnée. Veuillez contacter l'administrateur du site.");
        } else {
            successMessage("Cet utilisateur a été supprimé de la base de donnée.");                    
        }  
    }

    function eraseUser($id){
        $this->adminRepository->eraseUser($id);
        $result = $this->deleteUser($id);
        if ($result === 0){
            throw new Exception("Une erreur a eu lieu, lors de la suppression de cet utilisateur ou de son contenu. Veuillez contacter l'administrateur du site.");
        } else {
            successMessage("Cet utilisateur et ses contributions ont été supprimées de la base de donnée.");                    
        }  
    }



}