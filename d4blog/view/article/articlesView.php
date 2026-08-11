<?php
$title = "Articles";


ob_start();
?>
<div class="my-5">

    <h1>Articles</h1>
    <div class="d-flex flex-column flex-lg-row align-items-center justify-content-around py-4 gap-3">
        <div class="flex-grow-1">
            <p class="text-color2 fs-5 mb-0 ">Voici la liste des Articles, cliquez sur "voir plus" pour y accéder :</p>
        </div>
        <div class="input-group  maxW-input border border-3 bg-warning border-primary">
            <label for="searchBar" class="input-group-text text-bg-warning border-0"><i class="fa-solid fa-magnifying-glass"></i></label>
            <input id="searchBar" class="form-control form-control my-2 rounded-pill border-0" type="text" placeholder="Rechercher un article : mots, auteur...">
            <select name="selectDate" id="selectDate" class="input-group-text text-bg-warning border-0 p-0">
                <option class="align-middle" selected>Trier par :</option>
                <option class="align-middle" value="asc">Plus Ancien</option>
                <option class="align-middle" value="desc">Plus Récent</option>
            </select>
        </div>
    </div>
    <form action="index.php?page=article" method="post">
        <!-- le contenu que l'on va trier -->
        <div id="filterDate">
            <?php
            while ($articles = $request->fetch()) {
                $author = Checker::getAuthor("articles", $articles['id_user']);
            ?>

                <div class="found">

                    <div class="card  mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h2 class="text-truncate"><?= $articles['title'] ?></h2>

                        </div>
                        <div>
                            <div class="card-header d-flex flex-column justify-content-between">
                                <div class="mb-2 fs-5">écrit par : <span class=" fw-bold <?= Checker::colorMyRank($author['rank']) ?>"><?= $author['login'] ?></span>
                                    <?php if ($articles['date'] != $articles['edit_date']) { ?>
                                        <span class="badge bg-primary mx-1" data-bs-toggle="tooltip" data-bs-placement="right" title="<?= DateToFr::dateFR($articles['edit_date']) ?>">Mis à jour</span>

                                    <?php  } ?>
                                </div>
                                <span class="fs-7"><?= DateToFr::dateFR($articles['date']) ?> </span>
                            </div>
                        </div>
                        <div class="card-body text-truncate">

                            <div class="vh-10"><?= htmlspecialchars_decode($articles['content']) ?> </div>
                        </div>
                        <div class="card-footer d-flex align-items-center justify-content-end gap-4">
                            <div class="checkCom" data-bs-toggle="tooltip" data-bs-placement="top" title="commentaires">
                                <?= Checker::articleGotComs($articles['id']) ?><i class="mx-2 fa-regular fa-comment"></i>
                            </div>
                        </div>
                        <div class="card-footer d-flex align-items-center justify-content-center">

                            <div class="text-bg-warning rounded-pill border border-2 border-warning">
                                <button class="btn btn-outline-light rounded-pill  px-5 px-sm-7" type="submit" value="<?= $articles['id'] ?>" name="article">Voir plus</button>
                            </div>
                        </div>
                    </div>
                </div>
            <?php
            }
            ?>
        </div>

    </form>

</div>

<?php
$content = ob_get_clean();
ob_start(); ?>
<script src="./public/assets/js/finder.js"></script>
<?php
$script = ob_get_clean();
require('./view/base.php');
