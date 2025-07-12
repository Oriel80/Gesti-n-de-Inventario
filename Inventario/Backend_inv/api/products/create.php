<?php
// api/products/create.php

// 1. Cabeceras CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST'); // Método POST para crear
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// 2. Incluir archivos necesarios
// Asegúrate de que estas rutas sean correctas en tu servidor
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../models/Product.php';
require_once __DIR__ . '/../../utils/response.php';

// 3. Obtener los datos de entrada (JSON)
$input = json_decode(file_get_contents("php://input"), true);

// 4. Validar datos requeridos para el SP `agregar_producto_seguro`
// El SP espera: p_usuario_id, p_nombre, p_categoria, p_stock, p_precio, p_fecha
$required_fields = ['usuario_id', 'nombre', 'categoria', 'stock', 'precio', 'fecha_ingreso'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || (is_string($input[$field]) && trim($input[$field]) === '')) {
        Response::send(400, false, "Falta o es inválido el campo requerido: " . $field, null);
    }
}

// Asegurar tipos de datos correctos para stock y precio
if (!is_numeric($input['stock']) || (int)$input['stock'] < 0) {
    Response::send(400, false, "El campo 'stock' debe ser un número entero no negativo.", null);
}
if (!is_numeric($input['precio']) || (float)$input['precio'] < 0) {
    Response::send(400, false, "El campo 'precio' debe ser un número decimal no negativo.", null);
}
// Validar formato de fecha (opcional, pero recomendado)
if (!preg_match("/^\d{4}-\d{2}-\d{2}$/", $input['fecha_ingreso'])) {
    Response::send(400, false, "El campo 'fecha_ingreso' debe tener el formato YYYY-MM-DD.", null);
}


// 5. Instanciar la base de datos y obtener la conexión
$database = new Database();
$db = $database->getConnection(); // getConnection() ya maneja los errores y llama a Response::send si falla

// 6. Instanciar el modelo de Producto
try {
    if (!class_exists('Product')) {
        Response::send(500, false, "La clase 'Product' no fue encontrada. Verifica la ruta en require_once y la sintaxis de models/Product.php.", null);
    }
    $product = new Product($db);
} catch (Throwable $e) {
    Response::send(500, false, "Error al instanciar el modelo de Producto: " . $e->getMessage(), null);
}

// 7. Llamar al método del modelo para crear el producto de forma segura
try {
    if ($product->create($input)) {
        Response::send(201, true, "Producto agregado correctamente.", null); // 201 Created
    } else {
        // Esto se ejecutará si el SP falla por alguna razón interna no capturada por SIGNAL SQLSTATE
        Response::send(500, false, "Error desconocido al agregar producto.", null); // 500 Internal Server Error
    }
} catch (Exception $e) {
    // Captura la excepción lanzada por el modelo si el SP lanza un SIGNAL SQLSTATE (ej. permiso denegado)
    Response::send(403, false, $e->getMessage(), null); // 403 Forbidden o 400 Bad Request dependiendo del mensaje del SP
}
