<?php
// models/Loss.php

/**
 * Clase Loss para manejar las operaciones relacionadas con la tabla 'perdidas'.
 * Esta clase se enfoca en registrar y consultar las pérdidas de inventario.
 */
class Loss {
    private $conn;
    private $table = 'perdidas'; // Nombre de la tabla de pérdidas

    public $id;
    public $producto_id;
    public $cantidad;
    public $fecha_perdida;
    public $usuario_id;
    public $tienda_id;
    public $motivo;

    /**
     * Constructor de la clase Loss.
     * @param mysqli $db La conexión a la base de datos.
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Inserta un nuevo registro de pérdida en la base de datos.
     * Nota: La lógica de actualización de stock se maneja en Product::registerLoss()
     * Este método solo se encarga de la inserción en la tabla 'perdidas'.
     *
     * @return bool True si la pérdida fue registrada, false en caso contrario.
     */
    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  (producto_id, cantidad, fecha_perdida, usuario_id, tienda_id, motivo) 
                  VALUES (?, ?, NOW(), ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);

        if (!$stmt) {
            error_log("Error al preparar la inserción de pérdida: " . $this->conn->error);
            return false;
        }

        // Sanitizar y vincular parámetros
        $this->motivo = htmlspecialchars(strip_tags($this->motivo));

        $stmt->bind_param('iiiss', 
            $this->producto_id, 
            $this->cantidad, 
            $this->usuario_id, 
            $this->tienda_id, 
            $this->motivo
        );

        if ($stmt->execute()) {
            $stmt->close();
            return true;
        } else {
            error_log("Error al ejecutar la inserción de pérdida: " . $stmt->error);
            $stmt->close();
            return false;
        }
    }

    /**
     * Obtiene un informe de pérdidas de inventario.
     * @param string $rol El rol del usuario (ej. 'admin', 'vendedor').
     * @param int|null $tienda_id El ID de la tienda a consultar, o null/0 para todas las tiendas.
     * @return array Un array de pérdidas detalladas.
     */
    public function getLossesReport($rol, $tienda_id = null) {
        $losses_data = [];
        $query = "SELECT l.id AS id_perdida,
                         p.nombre AS nombre_producto,
                         l.cantidad,
                         l.fecha_perdida,
                         l.motivo,
                         u.nombre AS usuario_nombre,
                         t.nombre AS tienda_nombre
                  FROM perdidas l
                  JOIN productos p ON l.producto_id = p.id
                  JOIN usuarios u ON l.usuario_id = u.id
                  JOIN tiendas t ON l.tienda_id = t.id";
        
        $params = [];
        $types = "";

        // Si no es admin O (es admin y se proporciona un tienda_id específico y no es 0)
        if ($rol !== 'admin' || ($rol === 'admin' && $tienda_id !== null && $tienda_id !== 0)) {
            $query .= " WHERE l.tienda_id = ?";
            $params[] = $tienda_id;
            $types .= "i";
        }

        $query .= " ORDER BY l.fecha_perdida DESC";

        $stmt = $this->conn->prepare($query);
        if (!$stmt) {
            error_log("Error al preparar getLossesReport: " . $this->conn->error);
            return [];
        }

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $losses_data[] = $row;
        }
        $stmt->close();
        return $losses_data;
    }
}