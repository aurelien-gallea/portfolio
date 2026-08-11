<?php
session_start();
require_once('./controller/controller.php');
require_once("./controller/ArticleController.php");
require_once("./controller/ProjectController.php");
require_once("./controller/UserController.php");
require_once('./controller/ProfileController.php');
require_once("./controller/AdminController.php");
require_once("./controller/contactController.php");

try {       
    if (!empty($_GET["page"])) {
        $project = new ProjectController(new ProjectRepository);
        $user = new UsersController(new UsersRepository);
        $article = new ArticleController(new ArticleRepository);
        $profile = new ProfileController(new ProfileRepository);
        $admin = new AdminController(new AdminRepository);
        $contact = new ContactController();
            switch ($_GET["page"]) {
                case 'home':                    
                    $project->home(); 
                    break;
                case "createProject" :
                    // verifions si l'utilisateur est admin
                    if ($user->isAdmin() == 1){
                        // Upload de l'image et recuperation du nom dans la variabel $img                   
                        if (!empty($_FILES["img"])){                
                            $img=$project->uploadImage();
                        } 
                        // insertion des données du projet dans la BDD "projects"
                        if (!empty($_POST["title"] ) && !empty($_POST["content"]) ){                               
                            $project->addProject(htmlspecialchars($_POST["title"]),htmlspecialchars($_POST["content"]),$img);
                        } else {          
                            // affice la vue CreateProjectView
                            $project->createProject();                
                        }    
                    }  else {
                    throw new Exception("Vous n'avez pas les droits requis pour réaliser cette action. Veuillez contactez un administrateur");
                    } 
                    break;
                case "updateBddProject" :
                    if ($user->isAdmin() == 1){ 
                        // Upload de l'image et recuperation du nom dans la variabel $img                          
                        if (!empty($_FILES["img"]["size"] && !$_FILES["img"]["size"] == 0)){                              
                            $img=$project->uploadImage();                                  
                        } 
                        // si aucun nouvelle image n'est proposé, on récupere le nom de l'image déja présente.
                        if ($img == ""){                
                            $img= $_SESSION["img"];
                        } 
                        // remplacement dans la table projects des informations modifié par l'utilisateur.
                        $project->updateBddProject(htmlspecialchars($_POST["title"]),htmlspecialchars($_POST["content"]), $_SESSION["Project_id"],$img);
                    }  else {
                        throw new Exception("Vous n'avez pas les droits requis pour réaliser cette action. Veuillez contactez un administrateur");
                    }
                    break;   
                case 'new-article':
                    if(isset($_SESSION['id'])) {
                        if (!empty($_POST['title']) && !empty($_POST['content'])) {                           
                            $article->addArticle( htmlspecialchars($_POST['title']),htmlspecialchars($_POST['content']), $_SESSION['id']);
                        } 
                        $article->newArticleForm();                        
                    } else {
                        redirect('index.php?page=articles');                        
                    }
                    break;
                case "articles":                    
                    $article->articles();
                    break;
                case "article":                    
                    if (!empty($_POST['article'])) {
                        // on récupère l'id de l'article pour afficher la bonne page et les bons commentaires
                        $id_article = (int)htmlspecialchars($_POST['article']); // on le retransforme en int
                        $_SESSION['id_article'] = $id_article;
                    }
                    if (!isset($_SESSION['id_article'])) {        
                        redirect('index.php?page=articles'); //accesible uniquement avec un $_SESSION['id_article'] défini
                    }
                    
                    if (!empty($_POST['content'])) {
                        $content = htmlspecialchars($_POST['content']);
                        // on ajoute un commentaire, en récuperant au passage les supers globales 
                        //de SESSION -> ['id_article'] et ['id'] (c'est l'utilisateur connecté)
                        // car nos variables se perdent lors du routing
                        // successMessage("contenue mis a jour");
                        $article->addCommentarie($content, $_SESSION['id_article'], $_SESSION['id']);
                     
                    } else if (!empty($_POST['delete-art'])) {                        
                        $article->eraseArticle( htmlspecialchars($_POST['delete-art']));
                        redirect("index.php?page=articles");
                    } else if (!empty($_POST['delete-com'])) {                       
                        $article->eraseCommentarie(htmlspecialchars($_POST['delete-com']));
                        $article->article($_SESSION['id_article']);
                    } else if (!empty($_POST['update-com']) && !empty($_POST['content-com'])) {
                        $newContent = htmlspecialchars($_POST['content-com']);
                        $id_com = htmlspecialchars($_POST['update-com']);
                        $article->updateCom($newContent, $id_com);
                        $article->article($_SESSION['id_article']);
                    }
                    else {
                        $article->article($_SESSION['id_article']);
                    }        
                    break;
                case "up-article":
                    $id_article = $_SESSION['id_article'];            
                    if (!empty($_POST['title']) && !empty($_POST['content'])) {                        
                        $article->modifyArticle(htmlspecialchars($_POST['title']), htmlspecialchars($_POST['content']), $id_article);
                    } else {     
                        $article->upArticleForm($id_article);    
                    } 
                    break;
                case "profil":
                    if(isset($_SESSION['id'])) {                
                        if (isset($_POST["changeEmail"])&& !empty($_POST["email"]) && !empty($_POST["password"]) ){
                            $user->updateEmail(htmlspecialchars($_POST["password"]),htmlspecialchars($_POST["email"]),$_SESSION['id']);
                        }
                        if (isset($_POST["changePassword"])&& !empty($_POST["pass1"]) && !empty($_POST["pass2"]) && !empty($_POST["pass3"]) ){
                            $user->updatePassword(htmlspecialchars($_POST["pass1"]),htmlspecialchars($_POST["pass2"]),htmlspecialchars($_POST["pass3"]),$_SESSION['id']);
                        }                     
                        $profile->getMyContent($_SESSION['id']);        
                    } else {
                        redirect("index.php");
                    }
                    break;
                case 'inscription':
                    if (!empty($_POST["login"]) && !empty($_POST["email"]) && !empty($_POST["password"]) && !empty($_POST["password_two"])){
                        // L'adresse email est-elle correcte ?
                        $email=htmlspecialchars( $_POST["email"]);                
                        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                            errorMessage("Votre adresse email est invalide");
                            redirect("index.php?page=inscription");                          
                        }                
                        // L'email n'est pas deja enregistrer ? 
                        if (!$user->avalaibleEmail($email) == 1){
                            errorMessage("Cette adresse email est deja enregistré. Merci d\'en saisir une nouvelle.");
                            redirect('?page=inscription');                            
                        }
                        
                        // Les passwords correspond t'il ?
                        if ($_POST["password"] === $_POST["password_two"]){
                            $password = htmlspecialchars($_POST["password"]); 
                        } else {
                            errorMessage("Les 2 mots de passe ne correspondent pas");
                            redirect("?page=inscription");                            
                        }
                        // login libre.
                        $login=htmlspecialchars($_POST["login"]);               
                        if (!$user->avalaibleLogin($login) == 1 ){        
                            errorMessage("Le login n\'est pas disponible. Merci d\'en saisir un nouveau.");           
                            redirect('?page=inscription');                           
                        }
                                       
                        $user->addUser($login,$password,$email) ;              
                    }                                
                    $user->register();
                    break;
                case "connect" :
                    if(!empty($_POST["login"]) && !empty($_POST['password']))  {
                        $user->connectUser(htmlspecialchars($_POST["login"]),htmlspecialchars($_POST['password']));
                    }         
                    $user->connection();
                    break;
                case "logout":
                    $user->logout();
                    break;
                case "admin" :
                    if ($user->isAdmin() == 1){ 
                        if (!empty($_POST["promote"])){
                            $admin->promoteAdmin(htmlspecialchars($_POST["promote"]));
                        }
                        if (!empty($_POST["demote"])){
                            $admin->demoteUser(htmlspecialchars($_POST["demote"]));
                        }
                        if (!empty($_POST["delete"])){
                            $admin->deleteUser(htmlspecialchars($_POST["delete"]));
                        }
                        if (!empty($_POST["erase"])){
                            $admin->eraseUser(htmlspecialchars($_POST["erase"]));
                        }
                        $admin->getAllUsers();
                    }  else {
                        throw new Exception("Vous n'avez pas les droits requis pour réaliser cette action. Veuillez contactez un administrateur");
                    }    
                    break;
                case "contact":
                    $contact->showTeam();
                    break;
                default:
                    throw new Exception("Cette page n'existe pas");
                    break;
            }
        } else {
            $project = new ProjectController(new ProjectRepository);
            $project->home(); 
        } 
} catch (Exception $e) {
    $error = $e->getMessage();
    require("./view/errorView.php");
}
