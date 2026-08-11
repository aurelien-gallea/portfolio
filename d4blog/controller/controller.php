
<?php


    require_once('./model/Checker.php');
    require_once('./model/DateFr.php');
   

    function successMessage($message) {
        $_SESSION['success'] = $message;       
    }
     function errorMessage($message) {
        $_SESSION['error'] = $message;
        
    }

    function clearMessage() {        
        unset($_SESSION['success']);
        unset($_SESSION['error']);
    }    

    function redirect($path) {
        header('location:'.$path);
        exit();
    }



 