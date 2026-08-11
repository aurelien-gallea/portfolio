<form class="form" method="post" action="index.php?page=article">

    <!-- Dropdown (liste déroulante) -->
    <div class="dropstart">
        <!-- Bouton -->
        <button id="myButton-<?php echo $isArticle ? "art-" : "com-";echo $id_artOrCom ?>" class="btn" type="button" data-bs-toggle="dropdown">
            <i class="fa-sharp fa-solid fa-gear" data-bs-toggle="tooltip" data-bs-placement="top" title="Modifier"></i>
        </button>

        <!-- Les éléments du menu -->
        <ul class="dropdown-menu p-0" aria-labbeledby="myButton-<?php echo $isArticle ? "art-" : "com-";echo $id_artOrCom ?>" >
            <?php if ($isArticle === true) { ?> 
                <li><a class="btn btn-warning border border-bottom-5 rounded-0 rounded-top w-100" href="index.php?page=up-article"><i class="fa-solid fa-pen me-1"></i> Editer</a></li>
            <?php } else { ?>

                <li><button type="button" class="update btn btn-warning border border-bottom-5 rounded-0 rounded-top w-100 " data-bs-toggle="modal" data-bs-target="#update-com-<?= $id_artOrCom ?>"><i class="fa-solid fa-pen me-1"></i>Editer</button></li>
            <?php } ?>
            <li>
                <button type="button" class="btn btn-primary border rounded-0 rounded-bottom w-100" data-bs-toggle="modal" data-bs-target="#delete-<?php echo $isArticle ? "art-" : "com-";echo $id_artOrCom ?>">
                <i class="fa-solid fa-circle-xmark me-1"></i> Supprimer
                </button>
            </li>

        </ul>
    </div>
    <?php if (!$isArticle) { ?>
        <!-- Modale modification-->
        <div class="modal fade" id="update-com-<?= $id_artOrCom ?>" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">

                    <!-- Header -->
                    <div class="modal-header">
                        <h5 class="modal-title">Modifier commentaire :</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal">
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="modal-body">
                        <textarea class="comUp form-control" name="content-com" rows="7" maxlength="1024"><?= $content ?></textarea>
                    </div>

                    <!-- Footer -->
                    <div class="modal-footer">
                        <span class="countComUp "></span>
                        <button type="button" class="btn btn-outline-warning" data-bs-dismiss="modal">Fermer</button>
                        <button type="submit" class="comUpBtn btn btn-primary" name="update-com" value="<?= $id_artOrCom ?>">Modifier</button>
                    </div>

                </div>
            </div>
        </div>
    <?php } ?>
    <!-- Modale suppression-->
    <div class="modal fade" id="delete-<?php echo $isArticle ? "art-" : "com-";
                                        echo $id_artOrCom ?>" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">

                <!-- Header -->
                <div class="modal-header">
                    <h5 class="modal-title">Supprimer ?</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal">
                    </button>
                </div>

                <!-- Body -->
                <div class="modal-body">
                    <p class="m-0">Etes-vous sûr de vous ?</p>
                </div>

                <!-- Footer -->
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-warning" data-bs-dismiss="modal">Fermer</button>
                    <button type="submit" name="delete-<?php echo $isArticle ? "art" : "com"; ?>" value="<?= $id_artOrCom ?>" class="btn btn-primary">Supprimer</button>

                </div>

            </div>
        </div>
    </div>
</form>