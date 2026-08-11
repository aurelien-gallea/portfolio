<nav class="navbar  navbar-expand-lg">
    <div class="navbar-brand">
        <span class="text-color2 h3"> Diablo 4 Blog</span>
    </div><!-- Le bouton s'affichera en petit écran -->
    <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#monMenuDeroulant">
        <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="monMenuDeroulant">
        <ul class="navbar-nav">
            <li class="nav-item">
                <a href="index.php?page=home" class="nav-link active text-color2"><i class="fa-solid fa-house"></i></i> Accueil</a>
            </li>
            <li class="nav-item">
                <a href="index.php?page=articles" class="nav-link text-color2"><i class="fa-solid fa-newspaper"></i> Articles</a>
            </li>
            <?php if(isset($_SESSION['id'])) { ?>
            <li class="nav-item">
                <a href="index.php?page=new-article" class="nav-link text-color2"><i class="fa-solid fa-pen-to-square"></i> créer article</a>
            </li>
                <?php }?>

            <?php if (!empty($_SESSION["id"])) { ?>
                <li class="nav-item">
                    <a href="index.php?page=profil" class="nav-link text-color2"><i class="fa-regular fa-id-badge me-1"></i> Profil</a>
                </li>
                <li class="nav-item">
                    <a href="index.php?page=logout" class="nav-link text-color2"><i class="fa-solid fa-moon me-1"></i> Déconnection</a>
                </li>
            <?php } else { ?>
                <li class="nav-item">
                    <a href="index.php?page=connect" class="nav-link text-color2"><i class="fa-solid fa-plug me-1"></i>Connection</a>
                </li>                           
            <?php
            } ?>
            <li class="nav-item">
                <a href="index.php?page=contact" class="nav-link text-color2"><i class="fa-solid fa-user me-1"></i> Contact</a>
            </li>
            <?php if(isset($_SESSION['id']) && $me['rank'] == 'admin') { ?>
                <li class="nav-item">
                    <a href="index.php?page=admin" class="nav-link text-color2"><i class="fa-regular fa-file-lines me-1"></i> admin</a>
                </li>
            <?php }?>      
        </ul>
    </div>
</nav>

