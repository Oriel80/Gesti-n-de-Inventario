<?php
    // models/Store.php

    /**
     * Clase Store para manejar las operaciones relacionadas con la tabla 'tiendas'.
     */
    class Store {
        private $conn;
        private $table = 'tiendas'; // Nombre de la tabla de tiendas

        public $id;
        public $nombre;

        /**
         * Constructor de la clase Store.
         * @param mysqli $db La conexión a la base de datos.
         */
        public function __construct($db) {
            $this->conn = $db;
        }

        /**
         * Lee todas las tiendas disponibles.
         * @return array Retorna un array de objetos de tienda.
         */
        public function readAll() {
            $query = "SELECT id, nombre FROM " . $this->table . " ORDER BY nombre ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $result = $stmt->get_result();
            $stores = [];
            while ($row = $result->fetch_assoc()) {
                $stores[] = $row;
            }
            $stmt->close();
            return $stores;
        }
    }
    