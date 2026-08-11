<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once('classes/FavoritesManager.php');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Vérifier que l'utilisateur est connecté
if (empty($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Non autorisé."]);
    exit();
}

$id_user = $_SESSION['id'];
$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? ($_GET['action'] ?? '');
$manager = new FavoritesManager();

if ($action === 'list') {
    // Dans une version plus poussée, il faudrait filtrer getAllFavorites par id_user
    // Mais pour l'instant on garde la logique de la classe existante
    // En vérité, il faut récupérer que les favoris de l'user
    $bdd = $manager->connection();
    $req = $bdd->prepare('SELECT * FROM ' . FavoritesManager::TABLE_NAME . ' WHERE id_user = ?');
    $req->execute([$id_user]);
    $favorites = $req->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["success" => true, "favorites" => $favorites]);
}
elseif ($action === 'add') {
    $url = $data['type'] ?? ''; // ex: 'movie', 'serie', 'actor'
    $id_content = $data['id'] ?? 0;

    if ($manager->alreadyFavorite($id_user, $url, $id_content) === 0) {
        $manager->addFavorite($id_user, $url, $id_content);
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Déjà en favori."]);
    }
}
elseif ($action === 'remove') {
    $url = $data['type'] ?? '';
    $id_content = $data['id'] ?? 0;

    $manager->removeFavorite($id_user, $url, $id_content);
    echo json_encode(["success" => true]);
}
elseif ($action === 'check') {
    $url = $data['type'] ?? ($_GET['type'] ?? '');
    $id_content = $data['id'] ?? ($_GET['id'] ?? 0);
    
    $isFav = $manager->alreadyFavorite($id_user, $url, $id_content) > 0;
    echo json_encode(["success" => true, "isFavorite" => $isFav]);
}
else {
    echo json_encode(["success" => false, "message" => "Action inconnue."]);
}
?>
