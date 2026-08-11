<?php
    // verifion si une requete à bien eue lieu
    if (isset($request)){
        // on recupere les données du projets
        $project = $request->fetch();     
        $_SESSION["Project_id"]  = $project["id"];
        $_SESSION['img'] = $project["img"];
    }else {
       exit();
    }    
    // definition des variables
    $title = "Editer votre Projet";
    $form = '<form class="form" method="post" enctype="multipart/form-data" action="index.php?page=updateBddProject" > ' ;   
    $button = '<button class="btn btn-primary mb-3" type="submit" name="updateBddId" id="updateBddId"  value="'.$project["id"].'" >Modifier</button>';
    // Appel de la formProjectView

    ob_start();
    require_once("formProjectView.php");
    $content = ob_get_clean();
    // Appel de base.php
    require_once("./view/base.php");
?>