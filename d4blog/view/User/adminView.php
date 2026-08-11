<?php
$title = "Administration";

ob_start();

?>
<div class="my-5 fs-7" >
    <h2 class="mt-3"> Utilisateurs </h1>
    <div class="table-responsive">
        <table class="table table-sm table-bordered border-danger align-middle mt-3 text-center ">
        
        <tr class="table-success h5">
            <th>
                Login
            </th>
            <th >
                Email
            </th>
            <th>
                Rang
            </th>
            <th>
                action
            </th>
        </tr>

<?php
    // Liste des utilisateurs

    while ($res = $request->fetch()){ 

?>
        
            <tr class="bg-color2">
                <td class="text-truncate " title="<?= $res["login"]?>">
                    <?= $res["login"]?>
                </td>
                <td class="text-truncate " title="<?= $res["email"]?>">
                    <?= $res["email"]?>
                </td>
                <td>
                    <?= $res["rank"]?>
                </td>
                <td>
                    <div class="dropdown">
                        <button id="Admin"class="btn btn-primary" type="button"data-bs-toggle="dropdown">
                            <span class="d-none d-md-block">Actions</span>
                            <span class="d-md-none">+</span>                        
                        </button>

                        <div class="dropdown-menu"aria-labbeledby="Admin">
                            <!-- Passer admin -->
                                
                            <form  method="POST"  action="index.php?page=admin">
                                <button  class="dropdown-item btn" type="submit" name="promote" id="promote" value="<?= $res["id"] ?>" data-bs-toggle="tooltip" data-bs-placement="top" title="Modifie le rang au grade 'administrateur'."  >Promouvoir</button>
                            </form> 
                                                
                            <!-- Passer user -->                      
                            <form  method="POST"  action="index.php?page=admin">
                                <button class="dropdown-item btn" type="submit" name="demote" id="demote" value="<?= $res["id"]?>" data-bs-toggle="tooltip" data-bs-placement="top" title="Modifie le rang au grade 'user'." >Utilisateur</button>
                            </form>                       
                            
                            <!-- Supprimer l'utilisateur de la base de donnée -->
                            <form method="POST"  action="index.php?page=admin">
                                <button  class="dropdown-item btn"type="submit" name="delete" id="delete" value="<?= $res["id"] ?>"  data-bs-toggle="tooltip" data-bs-placement="top" title="Supprimer l'utilisateur de la base de donnée mais garde ses contributions" >Supprimer</button>
                            </form>                    
                            <!-- Supprimer toute les contributions de l'utilisateur de la base de donnée -->
                            <form method="POST"  action="index.php?page=admin">
                                <button  class="dropdown-item btn" type="submit" name="erase" id="erase" value="<?= $res["id"] ?>" data-bs-toggle="tooltip" data-bs-placement="top" title="Supprimer l'utilisateur de la base de donnée ainsi que ses contributions"  >Effacer</button>
                            </form>
                        </div> 
                    </div>        
            
                </td>
            </tr>
            
<?php
} 
?>

    </table>
</div>
</div>
<?php
$content = ob_get_clean();
require('./view/base.php');