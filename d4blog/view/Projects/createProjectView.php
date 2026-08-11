<?php
    // definition des variables
    $title = "Creer votre Actu";
    $button = '<button class="btn btn-primary mb-3" type="submit"  >Creer le projet </button>';
    $form= '<form class="form" method="post" enctype="multipart/form-data" action="index.php?page=createProject">' ;   
    $project= array("title"=>"" ,"content"=>"","id_user"=>"","img"=>"");
    // Appel de la formProjectView
    ob_start();
    require_once("formProjectView.php");
    $content = ob_get_clean();
    // Appel de base.php
    require_once("./view/base.php");
?>