<?php
class Database {
    private $host = "localhost";
    private $db_name = "inventario_perfumeria";
    private $username = "root";
    private $password = "";
    public $conn;

    /**
     * Obtiene la conexión a la base de datos.
     *
     * @return mysqli La conexión a la base de datos.
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name);
            if ($this->conn->connect_error) {
                throw new Exception("Error de conexión a la base de datos: " . $this->conn->connect_error);
            }
            // Establecer el charset a UTF-8 para evitar problemas con caracteres especiales
            $this->conn->set_charset("utf8mb4");
        } catch (Exception $e) {
            error_log($e->getMessage()); // Registrar el error en el log del servidor
            die("Error de conexión: " . $e->getMessage()); // Mostrar un mensaje genérico al usuario
        }

        return $this->conn;
    }
}
?>
