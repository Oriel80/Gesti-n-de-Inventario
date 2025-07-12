<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';
include_once '../../models/Product.php';
include_once '../../utils/Response.php';

$database = new Database();
$db = $database->getConnection();

$product = new Product($db);

$rol = isset($_GET['rol']) ? $_GET['rol'] : '';
$tienda_id = isset($_GET['tienda_id']) ? intval($_GET['tienda_id']) : 0; // 0 significa "todas las tiendas" para admin

if (empty($rol)) {
    Response::send(400, false, 'Rol de usuario es requerido.');
    exit();
}

// Validar que solo los administradores puedan ver inventario de todas las tiendas (tienda_id = 0)
if ($rol !== 'admin' && $tienda_id === 0) {
    Response::send(403, false, 'Acceso denegado. Los usuarios no administradores solo pueden ver el inventario de su propia tienda.');
    exit();
}

try {
    $stmt = $product->readInventory($rol, $tienda_id);
    $num = $stmt->num_rows;

    if ($num > 0) {
        $products_arr = array();
        while ($row = $stmt->fetch_assoc()) {
            extract($row);
            $product_item = array(
                "id" => $id,
                "nombre" => $nombre,
                "categoria" => $categoria,
                "stock" => $stock,
                "precio" => $precio,
                "fecha_ingreso" => $fecha_ingreso,
                "tienda_id" => $tienda_id,
                "tienda_nombre" => $tienda_nombre // Incluir el nombre de la tienda
            );
            array_push($products_arr, $product_item);
        }
        Response::send(200, true, 'Inventario obtenido con éxito.', $products_arr);
    } else {
        Response::send(404, false, 'No se encontraron productos en el inventario.');
    }
} catch (Exception $e) {
    Response::send(500, false, 'Error al obtener el inventario: ' . $e->getMessage());
}

$db->close();
?>
