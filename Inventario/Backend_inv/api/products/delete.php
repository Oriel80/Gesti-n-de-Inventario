<?php
// api/products/delete.php

// 1. Cabeceras CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: DELETE'); // Método DELETE para eliminar
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// 2. Incluir archivos necesarios
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../models/Product.php';
require_once __DIR__ . '/../../utils/response.php';

// 3. Obtener los datos de entrada (JSON)
$input = json_decode(file_get_contents("php://input"), true);

// 4. Validar que el ID esté presente
if (!isset($input['id']) || !is_numeric($input['id']) || (int)$input['id'] <= 0) {
    Response::send(400, false, "ID de producto no especificado o inválido para eliminar.", null); // 400 Bad Request
}

// 5. Instanciar la base de datos y obtener la conexión
$database = new Database();
$db = $database->getConnection();

// 6. Instanciar el modelo de Producto
$product = new Product($db);

// 7. Asignar el ID al objeto Product
$product->id = (int)$input['id'];

// 8. Intentar eliminar el producto
try {
    if ($product->delete()) {
        Response::send(200, true, "Producto eliminado correctamente.", null); // 200 OK
    } else {
        // Esto se ejecutará si hay un error de DB no capturado por la excepción
        Response::send(500, false, "Error desconocido al eliminar producto.", null); // 500 Internal Server Error
    }
} catch (Exception $e) {
    // Captura la excepción lanzada por el modelo si el trigger bloquea la eliminación
    Response::send(409, false, $e->getMessage(), null); // 409 Conflict (si es por el trigger de ventas) o 400 Bad Request
}
