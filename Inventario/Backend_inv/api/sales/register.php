<?php
// api/sales/register.php

// 1. Cabeceras CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST'); // Método POST para registrar ventas
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// 2. Incluir archivos necesarios
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../models/Sale.php';
require_once __DIR__ . '/../../utils/response.php';

// 3. Obtener los datos de entrada (JSON)
$input = json_decode(file_get_contents("php://input"), true);

// 4. Validar datos requeridos para el SP `registrar_venta`
// El SP espera: p_usuario_id, p_producto_id, p_cantidad
$required_fields = ['usuario_id', 'producto_id', 'cantidad'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || !is_numeric($input[$field]) || (int)$input[$field] <= 0) {
        Response::send(400, false, "Falta o es inválido el campo requerido: " . $field, null);
    }
}

// 5. Instanciar la base de datos y obtener la conexión
$database = new Database();
$db = $database->getConnection();

// 6. Instanciar el modelo de Venta
// Se añade un bloque try-catch para manejar errores de instanciación
try {
    if (!class_exists('Sale')) {
        Response::send(500, false, "La clase 'Sale' no fue encontrada. Verifica la ruta en require_once y la sintaxis de models/Sale.php.", null);
    }
    $sale = new Sale($db);
} catch (Throwable $e) {
    Response::send(500, false, "Error al instanciar el modelo de Venta: " . $e->getMessage(), null);
}


// 7. Llamar al método del modelo para registrar la venta
try {
    if ($sale->registerSale(
        (int)$input['usuario_id'],
        (int)$input['producto_id'],
        (int)$input['cantidad']
    )) {
        Response::send(201, true, "Venta registrada correctamente.", null); // 201 Created
    } else {
        // Esto se ejecutará si el SP falla por alguna razón interna no capturada por SIGNAL SQLSTATE
        Response::send(500, false, "Error desconocido al registrar venta.", null); // 500 Internal Server Error
    }
} catch (Exception $e) {
    // Captura la excepción lanzada por el modelo si el SP lanza un SIGNAL SQLSTATE (ej. stock insuficiente)
    Response::send(400, false, $e->getMessage(), null); // 400 Bad Request (por ejemplo, stock insuficiente)
}
