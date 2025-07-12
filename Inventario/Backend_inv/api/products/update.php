<?php
// api/products/update.php

// 1. Cabeceras CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: PUT'); // Método PUT para actualizar
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// 2. Incluir archivos necesarios
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../models/Product.php';
require_once __DIR__ . '/../../utils/response.php';

// 3. Obtener los datos de entrada (JSON)
$input = json_decode(file_get_contents("php://input"), true);

// 4. Validar que el ID y otros datos requeridos estén presentes
// Los campos deben coincidir con los que el método Product::update() espera.
$required_fields = ['id', 'nombre', 'categoria', 'stock', 'precio', 'fecha_ingreso', 'tienda_id'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || (is_string($input[$field]) && trim($input[$field]) === '')) {
        Response::send(400, false, "Falta el campo requerido para la actualización: " . $field, null);
    }
}

// Asegurar tipos de datos correctos para stock, precio y ID
if (!is_numeric($input['id']) || (int)$input['id'] <= 0) {
    Response::send(400, false, "El campo 'id' debe ser un número entero positivo.", null);
}
if (!is_numeric($input['stock']) || (int)$input['stock'] < 0) {
    Response::send(400, false, "El campo 'stock' debe ser un número entero no negativo.", null);
}
if (!is_numeric($input['precio']) || (float)$input['precio'] < 0) {
    Response::send(400, false, "El campo 'precio' debe ser un número decimal no negativo.", null);
}
if (!preg_match("/^\d{4}-\d{2}-\d{2}$/", $input['fecha_ingreso'])) {
    Response::send(400, false, "El campo 'fecha_ingreso' debe tener el formato YYYY-MM-DD.", null);
}
if (!is_numeric($input['tienda_id']) || (int)$input['tienda_id'] <= 0) {
    Response::send(400, false, "El campo 'tienda_id' debe ser un número entero positivo.", null);
}

// 5. Instanciar la base de datos y obtener la conexión
$database = new Database();
$db = $database->getConnection();

// 6. Instanciar el modelo de Producto
$product = new Product($db);

// 8. Intentar actualizar el producto
if ($product->update($input)) {
    Response::send(200, true, "Producto actualizado correctamente.", null); // 200 OK
} else {
    Response::send(500, false, "Error al actualizar producto.", null); // 500 Internal Server Error
}
