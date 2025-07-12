<?php
// models/Report.php

/**
 * Clase Report para manejar las consultas de informes.
 * Centraliza las consultas para informes generales y de ganancias/pérdidas.
 */
class Report {
    private $conn;

    /**
     * Constructor de la clase Report.
     * @param mysqli $db La conexión a la base de datos.
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene un informe general del inventario.
     * Incluye total de productos, total de ventas registradas y valor total del inventario.
     * @param string $rol El rol del usuario (ej. 'admin', 'vendedor').
     * @param int|null $tienda_id El ID de la tienda a consultar, o null/0 para todas las tiendas.
     * @return array Un array asociativo con los datos del informe.
     */
    public function getGeneralReport($rol, $tienda_id = null) {
        $report = [
            'total_productos' => 0,
            'total_ventas_registradas' => 0,
            'valor_total_inventario' => 0.00
        ];

        // Consulta para Total de Productos y Valor Total del Inventario
        $query_products = "SELECT COUNT(id) as total_productos, SUM(stock * precio) as valor_total_inventario
                           FROM productos"; // Asumiendo la tabla 'productos'

        $params_products = [];
        $types_products = "";

        // Si no es admin O (es admin y se proporciona un tienda_id específico y no es 0)
        if ($rol !== 'admin' || ($rol === 'admin' && $tienda_id !== null && $tienda_id !== 0)) {
            $query_products .= " WHERE tienda_id = ?";
            $params_products[] = $tienda_id;
            $types_products .= "i";
        }

        $stmt_products = $this->conn->prepare($query_products);
        if (!$stmt_products) {
            error_log("Error al preparar getGeneralReport (productos): " . $this->conn->error);
            return $report;
        }

        if (!empty($params_products)) {
            $stmt_products->bind_param($types_products, ...$params_products);
        }
        $stmt_products->execute();
        $result_products = $stmt_products->get_result();
        $data_products = $result_products->fetch_assoc();
        $stmt_products->close();

        if ($data_products) {
            $report['total_productos'] = $data_products['total_productos'] ?? 0;
            $report['valor_total_inventario'] = $data_products['valor_total_inventario'] ?? 0.00;
        }

        // Consulta para Total de Ventas Registradas
        // CORREGIDO: Ahora se une con detalles_venta y productos para obtener el tienda_id correcto
        $query_sales = "SELECT COUNT(DISTINCT v.id) as total_ventas_registradas
                         FROM ventas v
                         JOIN detalles_venta vd ON v.id = vd.venta_id
                         JOIN productos p ON vd.producto_id = p.id";

        $params_sales = [];
        $types_sales = "";

        // Si no es admin O (es admin y se proporciona un tienda_id específico y no es 0)
        if ($rol !== 'admin' || ($rol === 'admin' && $tienda_id !== null && $tienda_id !== 0)) {
            $query_sales .= " WHERE p.tienda_id = ?";
            $params_sales[] = $tienda_id;
            $types_sales .= "i";
        }

        $stmt_sales = $this->conn->prepare($query_sales);
        if (!$stmt_sales) {
            error_log("Error al preparar getGeneralReport (ventas): " . $this->conn->error);
            return $report;
        }

        if (!empty($params_sales)) {
            $stmt_sales->bind_param($types_sales, ...$params_sales);
        }
        $stmt_sales->execute();
        $result_sales = $stmt_sales->get_result();
        $data_sales = $result_sales->fetch_assoc();
        $stmt_sales->close();

        if ($data_sales) {
            $report['total_ventas_registradas'] = $data_sales['total_ventas_registradas'] ?? 0;
        }

        return $report;
    }

    /**
     * Obtiene un informe combinado de ganancias (ventas) y pérdidas (inventario).
     * @param string $rol El rol del usuario (ej. 'admin', 'vendedor').
     * @param int|null $tienda_id El ID de la tienda a consultar, o null/0 para todas las tiendas.
     * @return array Un array de transacciones (ventas y pérdidas) detalladas.
     */
    public function getGainsLosses($rol, $tienda_id = null) {
        $transactions_data = [];
        
        // Consulta para Ventas (Ganancias)
        $sales_query = "SELECT 
                            v.id AS id_transaccion,
                            'venta' AS tipo_transaccion,
                            p.nombre AS nombre_producto,
                            vd.cantidad,
                            vd.precio_unitario AS monto_unitario,
                            (vd.cantidad * vd.precio_unitario) AS monto_total,
                            v.fecha AS fecha_transaccion,
                            t.nombre AS tienda_nombre
                        FROM ventas v
                        JOIN detalles_venta vd ON v.id = vd.venta_id
                        JOIN productos p ON vd.producto_id = p.id
                        JOIN tiendas t ON p.tienda_id = t.id";
        
        // Consulta para Pérdidas
        $losses_query = "SELECT 
                            l.id AS id_transaccion,
                            'perdida' AS tipo_transaccion,
                            p.nombre AS nombre_producto,
                            l.cantidad,
                            p.precio AS monto_unitario, -- Usar el precio del producto al momento de la pérdida
                            (l.cantidad * p.precio) AS monto_total,
                            l.fecha_perdida AS fecha_transaccion, -- Corregido: Usar fecha_registro
                            t.nombre AS tienda_nombre
                        FROM perdidas l
                        JOIN productos p ON l.producto_id = p.id
                        JOIN tiendas t ON l.tienda_id = t.id";

        $sales_where = "";
        $losses_where = "";
        $bind_params = [];
        $bind_types = "";

        // Lógica para aplicar el filtro de tienda si es necesario
        if ($rol !== 'admin' || ($rol === 'admin' && $tienda_id !== null && $tienda_id !== 0)) {
            $sales_where = " WHERE p.tienda_id = ?";
            $losses_where = " WHERE l.tienda_id = ?";
            // Añadir los parámetros para el bind_param
            $bind_params[] = $tienda_id;
            $bind_params[] = $tienda_id;
            $bind_types = "ii"; // Dos enteros para los dos placeholders
        }
        
        $sales_query .= $sales_where;
        $losses_query .= $losses_where;

        // Combinar ambas consultas con UNION ALL
        $combined_query = "($sales_query) UNION ALL ($losses_query) ORDER BY fecha_transaccion DESC";

        $stmt = $this->conn->prepare($combined_query);
        if (!$stmt) {
            error_log("Error al preparar getGainsLosses (combinado): " . $this->conn->error);
            return [];
        }

        // Bind parameters si existen
        if (!empty($bind_params)) {
            $stmt->bind_param($bind_types, ...$bind_params);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $transactions_data[] = $row;
        }
        $stmt->close();
        return $transactions_data;
    }
}
