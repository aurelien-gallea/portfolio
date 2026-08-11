<?php
if (!empty($_SESSION["id"])) {
    $user = Checker::getLoginAndRank($_SESSION["id"]);
}
$title = "Accueil";
ob_start();
?>
<div class="my-5">

    <h1> Dernieres Actualités </h1>
<?php 
    if (isset($_GET["success"])){
    if ($_GET["success"] == 1) { ?>

        <p class="card m-2 p-1 bg-success d-inline-block"><?=$_GET["message"] ?></p>  
<?php }
}      

while ($project = $requete->fetch()) {
		$author = Checker::getAuthor("projects", $project['id_user']);
		$likes = new ProjectController(new ProjectRepository);
		$like = $likes->getNumberLike($project["id"])
				
?>
<div class="card mt-4">
			<div class="card-header h2">
					<b><?= $project['title'] ?></b>
			</div>
			<div class="card-header  d-flex flex-column justify-content-between">
					<div class="mb-2 fs-5">
							Ecrit par : <span class="fw-bold <?= Checker::colorMyRank($author['rank']) ?>"><?= $author['login'] ?></span>
					</div>
					<i class="fs-7"><?= DateToFr::dateFR($project['date']) ?></i>
			</div>
				<?php if (!empty($project["img"])) { ?>

                <div class="item-center"><img class="w-100 mx-auto" src="./public/src/img/<?= $project["img"] ?>" alt="Image of project"></div>
         <?php } ?>
      <div class="card-body">
            <p class="card-text"> <?=htmlspecialchars_decode($project["content"]) ?></p>                   
            
        </div>          

        <div class="card-footer">
            <div class="row justify-content-between">
                <div class="col-8 col-md-4 text-center">
                    <!-- Gestion des likes -->
                    <form class="col" method="get" action="index.php?" > 
                        <!-- verifions si l'utilisateur est connecté -->
                        <?php if (!empty($_SESSION["id"])){
                            // verifions si l'utilisateur à deja posté un like ou non sur ce projet
                            $res = $likes->checkIdUser($project["id"],$_SESSION["id"]);
                            if ($res === 0){ ?>
                                <!-- Si l'utilisateur est connecté et n'a pas deja poster un like affiche un pouce vers le haut et un click => creer un like dasn la table des likes -->
                                <span>Likes : <?=$like ?> </span><button class="btn ms-1" type="submit" name="like" id="like" value="<?= $project["id"] ?>"> <span class="ms-1 fa-regular fa-thumbs-up"></span></button>
                        <?php  } else { ?>
                                <!-- Si l'utilisateur est connecté et a deja poster un like affiche un pouce vers le bas et un click => supprimer le like dans la table des likes -->
                                <span>Likes : <?=$like ?> </span><button  class="btn ms-1"  type="submit" name="dislike" id="dislike" value="<?= $project["id"] ?>"><span class="ms-1 fa-regular fa-thumbs-down"></span></button>
                        <?php }} else { ?> 
                                <!-- Si l'utilisateur n'est pas connécé affiche seulement le nombre de like -->
                                <span>Likes : <?=$like ?> </span>
                            <?php }  ?>                                              
                    </form > 
                </div>
                
                <!-- reserver a l'admin -->
                <?php if (!empty($user['rank'])){
									if ($user['rank'] == "admin"){ ?> 
                
                
                <form class="col-2 col-md-4 " method="get" action="index.php" >    
                    <div class="dropstart">
                        <!-- Bouton -->
                        <button id="myButton" class="btn float-end" type="button" data-bs-toggle="dropdown">
                            <i class="fa-sharp fa-solid fa-gear" data-bs-toggle="tooltip" data-bs-placement="top" title="Modifier/Supprimer"></i>
                        </button>
                        <!-- Les éléments du menu -->
                        <ul class="dropdown-menu p-0" aria-labbeledby="myButton" >
                             <button class="btn btn-warning border border-bottom-5 rounded-0 rounded-top w-100 " type="submit" name="updateId" id="updateId" value="<?= $project["id"] ?>" ><i class="fa-solid fa-pen me-1"></i>Modifier</button>
                            <button class="btn btn-primary border rounded-0 rounded-bottom w-100" type="submit" name="deleteId" id="updateId" value="<?= $project["id"] ?>" ><i class="fa-solid fa-circle-xmark me-1"></i>Supprimer</button>
                        </ul>
                    </div> 
                </form>
            <?php } }?>
            </div>          
        </div> 
    </div>  
 
<?php   
}if (!empty($user['rank'])){
if ($user['rank'] == "admin"){
?>    
    <p> <a class="btn btn-primary mt-3" href="index.php?page=createProject">Creer une Actualité</a></p>
</div> 

<?php }}
$content = ob_get_clean();
require_once("./view/base.php");
?>
