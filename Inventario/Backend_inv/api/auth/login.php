<?php
// api/auth/login.php

// 1. Cabeceras CORS (Cross-Origin Resource Sharing)
header('Access-Control-Allow-Origin: *'); // Permite solicitudes desde cualquier origen
header('Content-Type: application/json'); // La respuesta será JSON
header('Access-Control-Allow-Methods: POST'); // Solo permitimos el método POST para login
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// 2. Incluir archivos necesarios
require_once __DIR__ . '/../../config/Database.php'; // Incluye la clase de conexión a la DB
require_once __DIR__ . '/../../models/User.php';    // Incluye el modelo de Usuario
require_once __DIR__ . '/../../utils/response.php';  // Incluye la clase Response con el método send()

// 3. Obtener los datos de entrada (JSON)
$input = json_decode(file_get_contents("php://input"), true);

// 4. Validar que los datos requeridos estén presentes
if (!isset($input['correo']) || !isset($input['contrasena'])) {
    // Usar Response::send() con el formato correcto: (statusCode, status_boolean, message, data)
    Response::send(400, false, "Correo y contraseña son requeridos."); // 400 Bad Request
}

$correo = $input['correo'];
$contrasena = $input['contrasena'];

// 5. Instanciar la base de datos y obtener la conexión
$database = new Database();
// connect() ya maneja los errores y debería usar Response::send() si falla internamente
$db = $database->getConnection(); 

// 6. Instanciar el modelo de Usuario
$user = new User($db);

// 7. Intentar iniciar sesión
$loggedInUser = $user->login($correo, $contrasena);

// 8. Enviar respuesta basada en el resultado del login
if ($loggedInUser) {
    // Usar Response::send() con el formato correcto: (statusCode, status_boolean, message, data)
    Response::send(200, true, "Login exitoso.", $loggedInUser); // 200 OK
} else {
    // Usar Response::send() con el formato correcto: (statusCode, status_boolean, message, data)
    Response::send(401, false, "Usuario o contraseña incorrectos."); // 401 Unauthorized
}
