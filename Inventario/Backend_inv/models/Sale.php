<?php
// models/Sale.php

/**
 * Clase Sale para manejar las operaciones relacionadas con la tabla 'ventas'.
 * Se adapta al esquema de MySQL proporcionado, utilizando el procedimiento almacenado
 * 'registrar_venta' para el registro de ventas.
 */
class Sale {
    // Conexión a la base de datos
    private $conn;
    private $table = 'ventas'; // Nombre de la tabla de ventas (principal para la venta)

    // Propiedades del objeto Sale, que corresponden a los parámetros del SP registrar_venta
    public $usuario_id;
    public $producto_id;
    public $cantidad;
    // Nota: fecha_venta, tienda_id y precio_unitario son manejados por el SP/triggers

    /**
     * Constructor de la clase Sale.
     * @param object $db La conexión a la base de datos (objeto mysqli).
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Registra una nueva venta utilizando el procedimiento almacenado `registrar_venta`.
     * Este SP maneja la creación de la venta, los detalles de venta y la disminución de stock.
     *
     * @param int $usuario_id El ID del usuario que registra la venta.
     * @param int $producto_id El ID del producto vendido.
     * @param int $cantidad La cantidad vendida del producto.
     * @return bool Retorna true si la venta fue registrada exitosamente, false en caso contrario.
     */
    public function registerSale($usuario_id, $producto_id, $cantidad) {
        // Llama al procedimiento almacenado
        $query = "CALL registrar_venta(?, ?, ?)";

        // Prepara la declaración
        $stmt = $this->conn->prepare($query);

        // Verifica si la preparación de la declaración falló
        if ($stmt === false) {
            error_log("Error al preparar la declaración para registrar_venta: " . $this->conn->error);
            // En lugar de lanzar una excepción, puedes retornar false o un mensaje de error más amigable
            return false; 
        }

        // Vincula los parámetros: i (int), i (int), i (int)
        $stmt->bind_param('iii', 
            $usuario_id, 
            $producto_id, 
            $cantidad
        );

        try {
            // Ejecuta el procedimiento almacenado
            if ($stmt->execute()) {
                // Si el SP ejecuta sin errores SQL, pero puede haber un SIGNAL SQLSTATE (ej. stock insuficiente)
                if ($stmt->errno) {
                    error_log("Error de MySQL al ejecutar registrar_venta: " . $stmt->error);
                    return false;
                }
                return true;
            } else {
                error_log("Error en la ejecución del procedimiento almacenado registrar_venta: " . $stmt->error);
                return false;
            }
        } catch (mysqli_sql_exception $e) {
                // Captura excepciones específicas de MySQL, incluyendo SIGNAL SQLSTATE
                error_log("Excepción MySQL al registrar venta: " . $e->getMessage());
                // Propaga la excepción para que la API pueda manejarla y enviar un JSON de error
                throw new Exception("Error al registrar venta: " . $e->getMessage());
        } finally {
            // Es importante cerrar el statement para liberar recursos y evitar problemas con múltiples llamadas a SP
            $stmt->close();
            // Consumir resultados pendientes si los hubiera, para evitar "Commands out of sync"
            while($this->conn->more_results() && $this->conn->next_result()) {
                if($res = $this->conn->store_result()) {
                    $res->free();
                }
            }
        }
    }
}
