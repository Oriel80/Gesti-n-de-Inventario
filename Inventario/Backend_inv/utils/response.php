<?php
class Response {
    /**
     * Envía una respuesta JSON estandarizada.
     *
     * @param int $statusCode El código de estado HTTP.
     * @param bool $status Indica si la operación fue exitosa (true) o fallida (false).
     * @param string $message Un mensaje descriptivo de la respuesta.
     * @param mixed $data Los datos a incluir en la respuesta (opcional).
     */
    public static function send($statusCode, $status, $message, $data = null) {
        http_response_code($statusCode);
        echo json_encode([
            'status' => $status ? 'success' : 'error',
            'message' => $message,
            'data' => $data
        ]);
        exit();
    }
}
?>
