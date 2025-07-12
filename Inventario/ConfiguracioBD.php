<?php
/*class Database {
    private $host = 'localhost';
    private $port = '3306';
    private $dbname = 'inventario_perfumeria';
    private $username = 'root';
    private $password = '';
    public $conn;

    public function connect() {
        $this->conn = new mysqli($this->host, $this->username, $this->password, $this->dbname, $this->port);

        if ($this->conn->connect_error) {
            die(json_encode([
                'error' => 'Conexión fallida: ' . $this->conn->connect_error
            ]));
        }

        return $this->conn;
    }
}*/
/*class Database {
    private $host = 'localhost';
    private $port = '3306';
    private $dbname = 'inventario_perfumeria';
    private $username = 'root';
    private $password = '';
    public $conn;

    /**
     * Conecta a la base de datos.
     * @return mysqli La conexión a la base de datos.
     */
   /* public function connect() {
        $this->conn = new mysqli($this->host, $this->username, $this->password, $this->dbname, $this->port);

        // Verifica si hay errores de conexión
        if ($this->conn->connect_error) {
            // Envía un error JSON y termina la ejecución
            http_response_code(500); // Código de estado HTTP para error interno del servidor
            die(json_encode([
                'error' => 'Conexión fallida: ' . $this->conn->connect_error
            ]));
        }

        return $this->conn;
    }
}
*/