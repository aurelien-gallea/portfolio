<?php

$title = "Modifier votre Article";

ob_start();
?>
<div class="mt-5">

    <?php
    while ($article = $request->fetch()) { ?>
        <h1> Modification d'article </h1>
        <form class="form" method="post" action="index.php?page=up-article">

            <p>
                <label class="form-label text-color2" for="title">Titre</label>
                <input required class="form-control" type="text" id="title" name="title" placeholder="Votre titre" maxlength="80" value="<?= $article['title'] ?>">
            </p>
            <div id="editor">

                <p>
                    <label class="form-label text-color2" for="content">Texte</label>
                    <textarea required class="form-control" name="content" id="mycontent" cols="30" rows="10" maxlength="10000"><?= $article['content'] ?></textarea>
                </p>
            </div>
            <div class="d-flex justify-content-between">
                <a class="btn btn-outline-color2 mt-3 text-center" href="index.php?page=articles">Annuler</a>
                <button class="btn btn-primary mt-3 text-center" type="submit">Valider</button>
            </div>
        </form>
</div>

<?php }
    $content = ob_get_clean();
    require('./view/base.php');

?>