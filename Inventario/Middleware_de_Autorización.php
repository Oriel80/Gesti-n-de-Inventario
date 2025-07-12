<?php
/*class AuthMiddleware {
    public static function check($userData, array $allowedRoles) {
        if (!isset($userData['rol']) || !in_array($userData['rol'], $allowedRoles)) {
            http_response_code(403);
            echo json_encode(['error' => '⛔ Acceso denegado.']);
            exit;
        }
    }
}
*/