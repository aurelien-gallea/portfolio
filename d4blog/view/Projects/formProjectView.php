
<div class="mt-5 text-center">
    <h2> Actualité </h2>
    <div class="mt-3 mx-auto w-50-md ">    
        <!-- le contenu de $formform evolue selon que ce soit une creation ou une modification -->
        <?= $form ?>

            <p>
                <label class="form-label" for="title"><h3>Titre :</h3></label>
                <input class="form-control-sm" type="text" id="title" name="title" value="<?= $project["title"] ?>" placeholder="Votre titre">
            </p>
            <p>
                <label class="form-label" for="img"><h3>Image :</h3> </label>
                <div class="row  gy-3 justify-content-center align-items-center"> 
                <!-- Si il existe une image associé l'afficher -->
                <?php if (!empty($project["img"])) { ?>
                    <img class="w-25 col-12 col-md-6  " src="./public/src/img/<?=$project["img"] ?>" alt="Image of project">
                <?php } ?>
                    <p class="col-12 col-md-6">                    
                        <input class="form-control " type="file" id="img" name="img" value="<?= $project["img"] ?>" placeholder="Votre titre">
                    </p>
                </div>
            </p>
            <div id="editor">
            <p>
                <label class="form-label text-color2" for="content">Texte</label>
                <textarea  class="form-control" name="content" id="mycontent" cols="30" rows="10" maxlength="10000"><?= $project["content"] ?></textarea>
            </p>    
        </div>
                <!-- <p>
                    <label  class="form-label" for="content"><h3>Texte :</h3></label>
                    <textarea class="form-control" name="content" id="content" cols="50" rows="10"><?= $project["content"] ?></textarea>
                </p>                -->
          
            <!-- le contenu de $button evolue selon que ce soit une creation ou une modification -->
            <?= $button ?>
        </form> 
    </div>      
</div>
   

