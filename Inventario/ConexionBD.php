<?php
session_start();

// Conexión a la base de datos
/*$host = 'localhost';
$port = '3306';
$dbname = 'inventario_perfumeria';
$username = 'root';
$password = '';

$conn = new mysqli($host, $username, $password, $dbname, $port);
if ($conn->connect_error) {
    die("❌ Error de conexión: " . $conn->connect_error);
}

// Autenticación (LOGIN)
if (isset($_POST['accion']) && $_POST['accion'] === 'login') {
    $email = $_POST['correo'] ?? '';
    $pass = $_POST['contrasena'] ?? '';

    $stmt = $conn->prepare("SELECT * FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $usuario = $resultado->fetch_assoc();

    if ($usuario && password_verify($pass, $usuario['contrasena'])) {
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['rol'] = $usuario['rol'];
        $_SESSION['nombre'] = $usuario['nombre'];
        $_SESSION['tienda_id'] = $usuario['tienda_id'];
        header("Location: inventario.php");
        exit;
    } else {
        echo "<p style='color:red;'>❌ Usuario o contraseña incorrectos</p>";
    }
}

// Verificación de sesión
$logueado = isset($_SESSION['rol']);
$rol = $_SESSION['rol'] ?? null;

// Middleware manual
function permitir($roles) {
    global $rol;
    if (!in_array($rol, $roles)) {
        echo "⛔ Acceso denegado.";
        exit;
    }
}

// Agregar producto
if (isset($_POST['accion']) && $_POST['accion'] === 'agregar_producto') {
    permitir(['admin', 'jefe', 'gerente']);

    $nombre = $_POST['nombre'] ?? '';
    $categoria = $_POST['categoria'] ?? '';
    $stock = (int)($_POST['stock'] ?? 0);
    $precio = (float)($_POST['precio'] ?? 0);
    $fecha = $_POST['fecha'] ?? date('Y-m-d');
    $usuario_id = $_SESSION['usuario_id'];

    $stmt = $conn->prepare("CALL agregar_producto_seguro(?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issids", $usuario_id, $nombre, $categoria, $stock, $precio, $fecha);

    if ($stmt->execute()) {
        echo "<p style='color:green;'>✅ Producto agregado con éxito</p>";
    } else {
        echo "<p style='color:red;'>❌ Error: " . $stmt->error . "</p>";
    }
}

// Registrar venta
if (isset($_POST['accion']) && $_POST['accion'] === 'registrar_venta') {
    permitir(['admin', 'jefe', 'gerente', 'vendedor']);

    $usuario_id = $_SESSION['usuario_id'];
    $producto_id = (int)($_POST['producto_id'] ?? 0);
    $cantidad = (int)($_POST['cantidad'] ?? 1);

    $stmt = $conn->prepare("CALL registrar_venta(?, ?, ?)");
    $stmt->bind_param("iii", $usuario_id, $producto_id, $cantidad);

    if ($stmt->execute()) {
        echo "<p style='color:green;'>✅ Venta registrada correctamente</p>";
    } else {
        echo "<p style='color:red;'>❌ Error: " . $stmt->error . "</p>";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Inventario Perfumería</title>
</head>
<body>
<h1>Sistema de Inventario</h1>

<?php if (!$logueado): ?>
    <h2>Login</h2>
    <form method="post">
        <input type="hidden" name="accion" value="login">
        <label>Correo: <input type="email" name="correo" required></label><br>
        <label>Contraseña: <input type="password" name="contrasena" required></label><br>
        <button type="submit">Ingresar</button>
    </form>

<?php else: ?>
    <p>Bienvenido, <?= htmlspecialchars($_SESSION['nombre']) ?> (Rol: <?= htmlspecialchars($rol) ?>) 
        | <a href="?logout=1">Cerrar sesión</a>
    </p>

    <?php
    if (isset($_GET['logout'])) {
        session_destroy();
        header("Location: inventario.php");
        exit;
    }
    ?>

    <?php if (in_array($rol, ['admin', 'jefe', 'gerente'])): ?>
        <h2>Agregar Producto</h2>
        <form method="post">
            <input type="hidden" name="accion" value="agregar_producto">
            <label>Nombre: <input type="text" name="nombre" required></label><br>
            <label>Categoría: <input type="text" name="categoria" required></label><br>
            <label>Stock: <input type="number" name="stock" min="0" required></label><br>
            <label>Precio: <input type="number" name="precio" step="0.01" min="0" required></label><br>
            <label>Fecha: <input type="date" name="fecha" value="<?= date('Y-m-d') ?>" required></label><br>
            <button type="submit">Agregar</button>
        </form>
    <?php endif; ?>

    <?php if (in_array($rol, ['admin', 'jefe', 'gerente', 'vendedor'])): ?>
        <h2>Registrar Venta</h2>
        <form method="post">
            <input type="hidden" name="accion" value="registrar_venta">
            <label>ID Producto: <input type="number" name="producto_id" required></label><br>
            <label>Cantidad: <input type="number" name="cantidad" min="1" required></label><br>
            <button type="submit">Registrar</button>
        </form>
    <?php endif; ?>

    <h2>Inventario</h2>
    <table border="1">
        <tr>
            <th>ID</th><th>Nombre</th><th>Categoría</th><th>Stock</th><th>Precio</th><th>Fecha</th><th>Tienda</th>
        </tr>
        <?php
        if ($rol === 'admin') {
            $sql = "SELECT p.*, t.nombre AS tienda_nombre FROM productos p JOIN tiendas t ON p.tienda_id = t.id";
            $result = $conn->query($sql);
        } else {
            $stmt = $conn->prepare("SELECT * FROM productos WHERE tienda_id = ?");
            $stmt->bind_param("i", $_SESSION['tienda_id']);
            $stmt->execute();
            $result = $stmt->get_result();
        }

        while ($row = $result->fetch_assoc()):
        ?>
        <tr>
            <td><?= $row['id'] ?></td>
            <td><?= htmlspecialchars($row['nombre']) ?></td>
            <td><?= htmlspecialchars($row['categoria']) ?></td>
            <td><?= $row['stock'] ?></td>
            <td><?= number_format($row['precio'], 2) ?></td>
            <td><?= $row['fecha_ingreso'] ?></td>
            <td><?= $row['tienda_nombre'] ?? '' ?></td>
        </tr>
        <?php endwhile; ?>
    </table>
<?php endif; ?>

</body>
</html>
*/