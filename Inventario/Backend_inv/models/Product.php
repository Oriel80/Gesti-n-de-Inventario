<?php
class Product {
    private $conn;
    private $table = "productos";
    private $table_stores = "tiendas"; // Tabla de tiendas

    public $id;
    public $nombre;
    public $categoria;
    public $stock; // Propiedad pública para acceder al stock
    public $precio;
    public $fecha_ingreso;
    public $tienda_id; // Nuevo campo para la tienda

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Lee todos los productos del inventario, con opción de filtrar por tienda.
     * Si el rol es 'admin' y tienda_id es 0, lee todos los productos de todas las tiendas.
     * Si el rol no es 'admin' o si se especifica un tienda_id, filtra por esa tienda.
     *
     * @param string $rol El rol del usuario ('admin', 'vendedor').
     * @param int $tienda_id El ID de la tienda a filtrar. Si es 0 y el rol es 'admin', no se filtra por tienda.
     * @return mysqli_result El resultado de la consulta.
     */
    public function readInventory($rol, $tienda_id) {
        $query = "SELECT 
                      p.id, p.nombre, p.categoria, p.stock, p.precio, p.fecha_ingreso, p.tienda_id, t.nombre as tienda_nombre
                    FROM 
                      " . $this->table . " p
                    JOIN 
                      " . $this->table_stores . " t ON p.tienda_id = t.id";
        
        $conditions = [];
        $params = [];
        $types = "";

        // Si el rol no es 'admin' o si el rol es 'admin' pero se especifica una tienda_id (no 0)
        if ($rol !== 'admin' || ($rol === 'admin' && $tienda_id !== 0)) {
            $conditions[] = "p.tienda_id = ?";
            $params[] = $tienda_id;
            $types .= "i";
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " ORDER BY p.fecha_ingreso DESC";

        $stmt = $this->conn->prepare($query);

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        return $stmt->get_result();
    }

    /**
     * Crea un nuevo producto.
     *
     * @return bool True si la creación fue exitosa, false de lo contrario.
     */
    /**
     * Crea un nuevo producto usando un arreglo de datos (coherente con create.php)
     * @param array $data
     * @return bool
     */
    public function create($data) {
        $query = "INSERT INTO " . $this->table . " (nombre, categoria, stock, precio, fecha_ingreso, tienda_id) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        if (!$stmt) {
            error_log("Error al preparar la consulta: " . $this->conn->error);
            return false;
        }
        // Saneamiento básico
        $nombre = htmlspecialchars(strip_tags($data['nombre']));
        $categoria = htmlspecialchars(strip_tags($data['categoria']));
        $stock = (int)$data['stock'];
        $precio = (float)$data['precio'];
        $fecha_ingreso = htmlspecialchars(strip_tags($data['fecha_ingreso']));
        $tienda_id = isset($data['tienda_id']) ? (int)$data['tienda_id'] : (isset($this->tienda_id) ? (int)$this->tienda_id : 1);
        $stmt->bind_param("ssidsi", $nombre, $categoria, $stock, $precio, $fecha_ingreso, $tienda_id);
        if ($stmt->execute()) {
            return true;
        }
        error_log("Error al crear producto: " . $stmt->error);
        return false;
    }

    /**
     * Lee un solo producto por su ID y carga sus propiedades en el objeto.
     *
     * @return bool True si el producto se encuentra y sus propiedades se cargan, false de lo contrario.
     */
    public function readOne() {
        $query = "SELECT 
                      p.id, p.nombre, p.categoria, p.stock, p.precio, p.fecha_ingreso, p.tienda_id, t.nombre as tienda_nombre
                    FROM 
                      " . $this->table . " p
                    JOIN 
                      " . $this->table_stores . " t ON p.tienda_id = t.id
                    WHERE 
                      p.id = ?
                    LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $this->id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        if ($row) {
            // Cargar las propiedades del objeto con los datos encontrados
            $this->nombre = $row['nombre'];
            $this->categoria = $row['categoria'];
            $this->stock = $row['stock'];
            $this->precio = $row['precio'];
            $this->fecha_ingreso = $row['fecha_ingreso'];
            $this->tienda_id = $row['tienda_id'];
            // Puedes agregar otras propiedades si las necesitas
            return true; // Indica que el producto fue encontrado y las propiedades cargadas
        }
        return false; // Indica que el producto no fue encontrado
    }

    /**
     * Actualiza un producto existente.
     *
     * @return bool True si la actualización fue exitosa, false de lo contrario.
     */
    /**
     * Actualiza un producto existente usando un arreglo de datos (coherente con update.php)
     * @param array $data
     * @return bool
     */
    public function update($data) {
        $query = "UPDATE " . $this->table . " 
                    SET 
                      nombre=?, categoria=?, stock=?, precio=?, fecha_ingreso=?, tienda_id=?
                    WHERE 
                      id=?";
        $stmt = $this->conn->prepare($query);
        if (!$stmt) {
            error_log("Error al preparar la consulta: " . $this->conn->error);
            return false;
        }
        // Saneamiento
        $nombre = htmlspecialchars(strip_tags($data['nombre']));
        $categoria = htmlspecialchars(strip_tags($data['categoria']));
        $stock = (int)$data['stock'];
        $precio = (float)$data['precio'];
        $fecha_ingreso = htmlspecialchars(strip_tags($data['fecha_ingreso']));
        $tienda_id = isset($data['tienda_id']) ? (int)$data['tienda_id'] : (isset($this->tienda_id) ? (int)$this->tienda_id : 1);
        $id = (int)$data['id'];
        $stmt->bind_param("ssidsii", $nombre, $categoria, $stock, $precio, $fecha_ingreso, $tienda_id, $id);
        if ($stmt->execute()) {
            return true;
        }
        error_log("Error al actualizar producto: " . $stmt->error);
        return false;
    }

    /**
     * Elimina un producto.
     *
     * @return bool True si la eliminación fue exitosa, false de lo contrario.
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        if (!$stmt) {
            error_log("Error al preparar la consulta: " . $this->conn->error);
            return false;
        }
        $id = (int)$this->id;
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            return true;
        }
        error_log("Error al eliminar producto: " . $stmt->error);
        return false;
    }

    /**
     * Actualiza el stock de un producto al nuevo valor especificado.
     *
     * @param int $productId El ID del producto.
     * @param int $newStock El nuevo valor de stock para el producto.
     * @return bool True si la actualización fue exitosa, false de lo contrario.
     */
    public function updateStock($productId, $newStock) {
        $query = "UPDATE " . $this->table . " SET stock = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $newStock, $productId);
        if ($stmt->execute()) {
            return true;
        }
        error_log("Error al actualizar el stock del producto: " . $stmt->error);
        return false;
    }
}
?>
