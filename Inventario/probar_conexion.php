<?php
require 'db.php'; // Esto incluye tu archivo con la conexión

if ($conn) {
    echo "✅ Conexión exitosa a la base de datos.";
} else {
    echo "❌ No se pudo conectar.";
}
?>
