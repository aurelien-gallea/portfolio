<?php

    class ImageManager {

        public function uploadImg(){ 
            
            if (isset($_FILES["img"]) && $_FILES["img"]["error"] === 0) {
                // image limité a 3MO
                if ($_FILES["img"]["size"] < 3000000){                   
                    $informationsImage = pathinfo($_FILES["img"]["name"]);
                    $extensionImage = $informationsImage["extension"];
                    $extensionArray = ["png","gif","jpg","jpeg","webp"];

                    if (in_array($extensionImage,$extensionArray)){
                        $img = time().rand().rand().'.'.$extensionImage;
                        move_uploaded_file($_FILES["img"]["tmp_name"],"./public/src/img/".$img);
                        return $img;                            
                    };                
                } else {                                    
                    throw new Exception("La taille de l'image ne doit pas dépasser 3 Mo");
                };            
            } else {
                throw new Exception("Une erreur e eu lieux : Error n° ".$_FILES["img"]["error"]);
            }             
        }
    }
