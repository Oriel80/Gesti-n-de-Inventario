<?php
// generar_hash.php
$nueva_password_plana = "Roberto08"; // CAMBIA ESTO por la nueva contraseña que quieras usar
$hash_nueva_contrasena = password_hash($nueva_password_plana, PASSWORD_DEFAULT);
echo "Nueva contraseña plana: " . $nueva_password_plana . "<br>";
echo "Nuevo hash generado: " . $hash_nueva_contrasena . "<br>";
?>

