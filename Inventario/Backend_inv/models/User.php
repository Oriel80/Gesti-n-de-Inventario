<?php
// models/User.php

/**
 * Clase User para manejar las operaciones relacionadas con la tabla 'usuarios'.
 */
class User {
    // Conexión a la base de datos
    private $conn;
    private $table = 'usuarios'; // Nombre de la tabla de usuarios

    // Propiedades del objeto User
    public $id;
    public $nombre;
    public $rol;
    public $tienda_id;
    public $correo;
    public $contrasena; // Solo para verificación, no se expone

    /**
     * Constructor de la clase User.
     * @param mysqli $db La conexión a la base de datos.
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Intenta iniciar sesión de un usuario.
     * @param string $correo El correo electrónico del usuario.
     * @param string $contrasena La contraseña en texto plano.
     * @return array|false Retorna un array con los datos del usuario (sin contraseña) si el login es exitoso, o false si falla.
     */
    public function login($correo, $contrasena) {
        // Consulta SQL para obtener el usuario por correo
        $query = "SELECT id, nombre, rol, tienda_id, contrasena FROM " . $this->table . " WHERE correo = ? LIMIT 0,1";

        // Prepara la declaración
        $stmt = $this->conn->prepare($query);

        // Vincula el parámetro correo
        $stmt->bind_param("s", $correo);

        // Ejecuta la consulta
        $stmt->execute();

        // Obtiene el resultado
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        // Verifica si se encontró un usuario y si la contraseña es correcta
        if ($user && password_verify($contrasena, $user['contrasena'])) {
            // Elimina la contraseña del array antes de retornarlo por seguridad
            unset($user['contrasena']);
            return $user;
        } else {
            return false;
        }
    }

    // Aquí se podrían añadir otros métodos relacionados con usuarios (ej. registrar, actualizar perfil, etc.)
}
