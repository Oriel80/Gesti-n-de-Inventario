<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';
include_once '../../models/Report.php';
include_once '../../utils/Response.php';

$database = new Database();
$db = $database->getConnection();

$report = new Report($db);

$rol = isset($_GET['rol']) ? $_GET['rol'] : '';
$tienda_id = isset($_GET['tienda_id']) ? intval($_GET['tienda_id']) : 0; // 0 significa "todas las tiendas" para admin

if (empty($rol)) {
    Response::send(400, false, 'Rol de usuario es requerido.');
    exit();
}

// Validar que solo los administradores puedan ver reportes de todas las tiendas (tienda_id = 0)
if ($rol !== 'admin' && $tienda_id === 0) {
    Response::send(403, false, 'Acceso denegado. Los usuarios no administradores solo pueden ver reportes de su propia tienda.');
    exit();
}

try {
    // CORRECCIÓN: Cambiado getGainsLossesReport a getGainsLosses
    $result = $report->getGainsLosses($rol, $tienda_id);

    if ($result) {
        Response::send(200, true, 'Informe de ganancias y pérdidas obtenido con éxito.', $result);
    } else {
        // Podría ser 200 con un array vacío si no hay datos, o 404 si es un caso específico de "no encontrado"
        // Dejamos 200 con mensaje si el array está vacío, lo cual es más común para reportes sin datos.
        Response::send(200, true, 'No se encontraron datos para el informe de ganancias y pérdidas.', []);
    }
} catch (Exception $e) {
    Response::send(500, false, 'Error al obtener el informe de ganancias y pérdidas: ' . $e->getMessage());
}

$db->close();
?>
