<!-- gerer l'affichage conditionnel avec la table favoris -->
<?php if (!empty($_GET['id']) && !empty($_SESSION['id'])) {
                    $id_user = $_SESSION['id'];
                    $url = $_SERVER['REQUEST_URI'];
                    $id_content = $_GET['id'];
                    $newFavorite = new FavoritesManager();
                    
                    // double verif pour eviter d'avoir des doublons en cas de refresh de la page
                    if (isset($_POST['addFavorite']) && $newFavorite->alreadyFavorite($id_user, $url, $id_content) === 0) {
                        $newFavorite->addFavorite($id_user, $url, $id_content);
                    } else if (isset($_POST['removeFavorite'])) {
                        $newFavorite->removeFavorite($id_user, $url, $id_content);
                    }
                    
                    if ($newFavorite->alreadyFavorite($id_user, $url, $id_content) === 0) {?>
                <form action="<?=$url?>" method="post">
                    <button type="submit" name="addFavorite" class="btn btn-outline-primary d-flex align-items-center gap-1" title="Ajouter aux favoris"><i class="fa-solid fa-star fs-3"></i> Ajouter</button>
                </form>
                <?php } else { ?> 
                <form action="<?=$url?>" method="post">
                    <button type="submit" name="removeFavorite" class="btn btn-outline-primary d-flex align-items-center gap-1" title="Retirer des favoris"><i class="fa-regular fa-star fs-3"></i> Retirer</button>
                </form>
<?php }} ?>