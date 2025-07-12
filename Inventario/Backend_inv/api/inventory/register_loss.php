<?php
// api/inventory/register_loss.php

// 1. Cabeceras CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST'); // Método POST para registrar pérdidas
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// 2. Incluir archivos necesarios
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../models/Product.php'; // Modelo Product para actualizar stock
require_once __DIR__ . '/../../models/Loss.php';    // Modelo Loss para registrar la pérdida
require_once __DIR__ . '/../../utils/Response.php'; // Incluye la clase Response

// Habilitar reporte de errores para depuración (¡Quitar en producción!)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

error_log("register_loss.php: Script iniciado.");

// 3. Obtener los datos de entrada (JSON)
$input = json_decode(file_get_contents("php://input"), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    Response::send(400, false, "Error al decodificar JSON: " . json_last_error_msg());
}
error_log("register_loss.php: Datos de entrada recibidos: " . print_r($input, true));

// 4. Validar datos requeridos
$required_fields = ['usuario_id', 'producto_id', 'cantidad', 'tienda_id', 'motivo'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || (is_string($input[$field]) && trim($input[$field]) === '')) {
        Response::send(400, false, "Falta o es inválido el campo requerido: " . $field);
        error_log("register_loss.php: Error de validación - campo '" . $field . "' faltante o inválido.");
    }
}

// Validar que cantidad sea un número positivo
if (!is_numeric($input['cantidad']) || (int)$input['cantidad'] <= 0) {
    Response::send(400, false, "La cantidad de pérdida debe ser un número entero positivo.");
    error_log("register_loss.php: Error de validación - cantidad inválida: " . $input['cantidad']);
}

// 5. Instanciar la base de datos y obtener la conexión
$database = new Database();
$db = null;
try {
    $db = $database->getConnection(); // Asegúrate de que este método devuelva el objeto mysqli
    if (!$db) {
        throw new Exception("La conexión a la base de datos es nula.");
    }
    error_log("register_loss.php: Conexión a la base de datos establecida.");
} catch (Exception $e) {
    Response::send(500, false, "Error al conectar a la base de datos: " . $e->getMessage());
    error_log("register_loss.php: Error al conectar a la base de datos: " . $e->getMessage());
}


// 6. Instanciar el modelo de Producto y Loss
try {
    $product = new Product($db);
    $loss = new Loss($db);
    error_log("register_loss.php: Modelos Product y Loss instanciados.");
} catch (Throwable $e) {
    Response::send(500, false, "Error al instanciar modelos: " . $e->getMessage());
    error_log("register_loss.php: Error al instanciar modelos: " . $e->getMessage());
    // Asegúrate de cerrar la conexión si se abrió antes de este error
    if ($db) $db->close();
}

// 7. Asignar datos para el registro de pérdida
$producto_id = (int)$input['producto_id'];
$cantidad_perdida = (int)$input['cantidad']; // Renombrado para claridad
$usuario_id = (int)$input['usuario_id'];
$tienda_id = (int)$input['tienda_id'];
$motivo = $input['motivo'];

error_log("register_loss.php: Datos de pérdida: ProductoID=" . $producto_id . ", Cantidad=" . $cantidad_perdida . ", UsuarioID=" . $usuario_id . ", TiendaID=" . $tienda_id . ", Motivo=" . $motivo);

// 8. Iniciar una transacción para asegurar la atomicidad de las operaciones
try {
    $db->begin_transaction();
    error_log("register_loss.php: Transacción iniciada.");

    // 8.1. Obtener información actual del producto
    $product->id = $producto_id;
    if (!$product->readOne()) {
        throw new Exception("Producto no encontrado o error al leerlo.");
    }
    error_log("register_loss.php: Producto encontrado. Stock actual: " . $product->stock);

    // 8.2. Validar stock disponible antes de la pérdida
    if ($product->stock < $cantidad_perdida) {
        throw new Exception("Stock insuficiente para registrar la pérdida. Stock actual: " . $product->stock);
    }

    // 8.3. Disminuir el stock del producto en la base de datos
    $new_stock = $product->stock - $cantidad_perdida;
    if (!$product->updateStock($producto_id, $new_stock)) {
        throw new Exception("Error al actualizar el stock del producto.");
    }
    error_log("register_loss.php: Stock actualizado a: " . $new_stock);

    // 8.4. Registrar la pérdida en la tabla 'perdidas'
    $loss->producto_id = $producto_id;
    $loss->cantidad = $cantidad_perdida;
    $loss->usuario_id = $usuario_id;
    $loss->tienda_id = $tienda_id;
    $loss->motivo = $motivo;

    if (!$loss->create()) {
        throw new Exception("Error al registrar la pérdida en la base de datos.");
    }
    error_log("register_loss.php: Pérdida registrada en la tabla 'perdidas'.");

    // 8.5. Si todo fue exitoso, confirmar la transacción
    $db->commit();
    error_log("register_loss.php: Transacción confirmada (commit).");
    Response::send(201, true, "Pérdida registrada correctamente y stock actualizado."); // 201 Created

} catch (Exception $e) {
    // 8.6. En caso de cualquier error, revertir la transacción
    
    if ($db) { // Asegurarse de que la conexión existe
        $db->rollback();
        error_log("register_loss.php: Transacción revertida (rollback) debido a un error: " . $e->getMessage());
    } else {
        error_log("register_loss.php: Error (la conexión no estaba disponible para revertir): " . $e->getMessage());
    }
    Response::send(400, false, $e->getMessage()); // 400 Bad Request o el código adecuado
} finally {
    // 9. Cerrar la conexión a la base de datos
    if ($db) {
        $db->close();
        error_log("register_loss.php: Conexión a la base de datos cerrada.");
    }
}
