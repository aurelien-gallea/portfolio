<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Si besoin pour le dev
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once('classes/UserManager.php');
require_once('classes/Security.php');
require_once('classes/Verify.php');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? ($_GET['action'] ?? '');

if ($action === 'login') {
    $login = htmlspecialchars($data['login'] ?? '');
    $pass = htmlspecialchars($data['pass'] ?? '');
    
    if (empty($login) || empty($pass)) {
        echo json_encode(["success" => false, "message" => "Veuillez remplir tous les champs."]);
        exit();
    }

    $pass = Security::hash($pass);
    $user = new UserManager();
    
    if ($user->signIn($login, $pass)) {
        echo json_encode([
            "success" => true, 
            "user" => [
                "id" => $_SESSION["id"], 
                "login" => $_SESSION["login"]
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Identifiant ou mot de passe incorrect."]);
    }
}
elseif ($action === 'register') {
    $login1 = htmlspecialchars($data['login1'] ?? '');
    $pass1 = htmlspecialchars($data['pass1'] ?? '');
    $pass2 = htmlspecialchars($data['pass2'] ?? '');
    $email = htmlspecialchars($data['mail'] ?? '');

    if ($pass1 !== $pass2) {
        echo json_encode(["success" => false, "message" => "Les mots de passe ne correspondent pas."]);
        exit();
    }
    if (!Verify::verifySyntax($email)) {
        echo json_encode(["success" => false, "message" => "Merci de rentrer un email valide."]);
        exit();
    }

    $user = new UserManager();
    if ($user->avalaibleLogin($login1) !== 0) {
        echo json_encode(["success" => false, "message" => "Identifiant déjà existant."]);
        exit();
    }
    if ($user->avalaibleEmail($email) !== 0) {
        echo json_encode(["success" => false, "message" => "Adresse email déjà utilisée."]);
        exit();
    }

    $hashedPass = Security::hash($pass1);
    $user->signUp($login1, $hashedPass, $email);
    
    if ($user->signIn($login1, $hashedPass)) {
        echo json_encode([
            "success" => true, 
            "user" => [
                "id" => $_SESSION["id"], 
                "login" => $_SESSION["login"]
            ]
        ]);
    }
}
elseif ($action === 'me') {
    if (!empty($_SESSION['id'])) {
        echo json_encode([
            "success" => true, 
            "user" => [
                "id" => $_SESSION["id"], 
                "login" => $_SESSION["login"]
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Non connecté."]);
    }
}
elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(["success" => true]);
}
else {
    echo json_encode(["success" => false, "message" => "Action inconnue."]);
}
?>
