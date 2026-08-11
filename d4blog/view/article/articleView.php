<?php
$title = "Article";

ob_start();
?>

<div class="my-5">
    <!-- on va se servir de l'id utilisateur pour afficher ou non la roue cranté pour pouvoir modifier le contenu dont on est l'auteur -->
    <?php
    if (isset($_SESSION['id'])) {
        $user = Checker::getLoginAndRank($_SESSION['id']); // si c'est un admin, il peut tout modifier
    }
    while ($article = $request->fetch()) {
        $author = Checker::getAuthor("articles", $article['id_user']); // on recupère le nom des auteurs pour les afficher


    ?>
        <div class="card  mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <!-- le titre de l'article -->
                <h1 class="text-break"><?= $article['title'] ?></h1>
                <div>
                    <!-- ici notre fonction pour afficher ou non la roue cranté: model/Options et view/optionsView  -->
                    <?php if (isset($_SESSION['id'])) echo $gear->controls($article['id_user'], $article['id'], $article['content'], $user['rank'], true); ?>
                </div>
            </div>
            <div class="card-header d-flex flex-column justify-content-between">
                <div class="mb-2 fs-5">écrit par : <span class=" fw-bold <?= Checker::colorMyRank($author['rank']) ?>"><?= $author['login'] ?></span>
                    <?php if ($article['date'] != $article['edit_date']) { ?>
                        <span class="badge bg-primary mx-1" data-bs-toggle="tooltip" data-bs-placement="right" title="<?= DateToFr::dateFR($article['edit_date']) ?>">Mis à jour</span>

                    <?php  } ?>
                </div>
                <span class="fs-7"><?= DateToFr::dateFR($article['date']) ?> </span>
                
            </div>
            <div class="card-body">
                <!-- on affiche le contenu de l'article -->
                <div id="text-art" class="text-break"><?= htmlspecialchars_decode($article['content']) ?> </div> <!-- On part du principe que SEULS LES ADMINS peuvent poster un article -->
            </div>
            <div class="card-footer d-flex justify-content-center align-items-center">

                <div class="text-bg-warning rounded-pill" data-bs-toggle="tooltip" data-bs-placement="top" title="commentaires">
                    <div id="btnCom" class="btn rounded-pill py-2 px-4 btn-outline-light  border border-2 border-warning">

                        
                            <small class="showMe me-2">Afficher</small><span><?= Checker::articleGotComs($article['id']) ?></span><i class="mx-2 fa-regular fa-comment"></i>
                        
                    </div>
                </div>


            </div>

        </div>
        <div class="showHidden d-none mb-5">
        <?php }

    while ($commentaries = $coms->fetch()) {

        $authorCom = Checker::getAuthor("commentaries", $commentaries['id_user']);

        ?>

            <div class="card col-md-8 col-lg-10 mx-auto mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <p>
                        <span class="fs-5 <?= Checker::colorMyRank($authorCom['rank']) ?> text-break"><?= $authorCom['login'] ?></span>
                        <span class="ms-1 fs-7"><?= DateToFr::dateFR($commentaries['date']) ?></span>
                        <?php if ($commentaries['date'] != $commentaries['edit_date']) { ?>
                            <span class="badge bg-primary ms-1" data-bs-toggle="tooltip" data-bs-placement="right" title="<?= DateToFr::dateFR($commentaries['edit_date']) ?>"> Modifié</span>
                        <?php } ?>
                    </p>

                    <div class="z-3">
                        <?php if (isset($_SESSION['id'])) echo $gear->controls($commentaries['id_user'], $commentaries['id'], $commentaries['content'], $user['rank']); ?>
                    </div>
                </div>
                <div class="card-body">

                    <p class="text-break"><?= $commentaries['content'] ?> </p>
                </div>

            </div>
        <?php } ?>

        </div>
        <div>
            <?php if (isset($_SESSION['id'])) { ?>
                <div class="d-flex justify-content-end align-items-center mb-5 me-2 me-md-5">
                    <div id="bubble" class="btn rounded-pill border border-3 border-primary  p-3 text-white  bg-color4 " data-bs-toggle="tooltip" data-bs-placement="top" title="Ouvrir">
                        <i class="fa-solid fa-comments fs-4"></i>
                    </div>
                </div>
                <form class="form" method="post" action="index.php?page=article">

                    <div id="messenger" class="d-none d-flex flex-column fixed-bottom mb-md-2 rounded col-md-8 col-lg-10 mx-auto bg-color4 pb-2 px-1 px-md-4 rounded-md-top border border-3 border-primary">
                        <div class=" d-flex justify-content-between align-items-center my-2 ">
                            <div id="title-messenger" class="text-danger ms-2">
                                <h5> Votre meilleur commentaire</h5>
                            </div>
                            <div class="bg-color4 rounded-pill border border-primary ">
                                <button id="closeMessenger" type="button" class="btn btn-close btn-close-white  btn-outline-color2 p-2 rounded-pill fs-4"></button>
                            </div>

                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <!-- utilisation d'un input pour un meilleur UX p/r a un textarea -->
                            <input type="text" id="com" class="btn-outline-primary form-control rounded-pill " name="content" id="content" maxlength="1024" placeholder="Votre commentaire...">

                            <div id="comBtn" class="bg-black  rounded-pill border-0">
                                <button class="btn rounded-pill border border-primary p-2 btn-outline-color2" name="addCom" type="submit"><i class="fa-solid fa-paper-plane text-danger me-1"></i></button>
                            </div>
                        </div>
                        <div id="countCom" class="ms-2 p-0 text-white">1024 caractères restants.</div>
                    </div>
                </form>
            <?php } else { ?>
                <div class=" col-md-8 col-lg-10 mx-auto ">
                    <div class="p-2  d-flex justify-content-center align-items-center gap-3 flex-wrap">
                        <span class="text-color2 fs-5">Vous devez être connecté pour pouvoir répondre:</span> 
                        <a href="index.php?page=connect" class="btn border btn-primary mx-2 rounded-pill px-4">Se Connecter</a>
                    </div>
                </div>
            <?php } ?>
        </div>

</div>

<?php
$content = ob_get_clean();
ob_start(); ?>
<script src="./public/assets/js/showHidden.js"></script>
<!-- <script src="assets/js/textFormatKeeper.js"></script>  Nous avons pris la décision de passer à Tiny donc ce script n'est plus utile, je le laisse juste pour la correction, il sera dégagé à terme -->
<?php if (isset($_SESSION['id'])) { ?>
    <script src="./public/assets/js/counterCom.js"></script>
    <script src="./public/assets/js/commentManager.js"></script>
<?php }
$script = ob_get_clean();
require('./view/base.php');
