<?php
    session_start(); // initialiser
    session_unset(); // desactiver
    session_destroy(); //detruire
    
    header('location: ../index.php');
    exit();