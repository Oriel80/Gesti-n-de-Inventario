// Simular usuarios (esto luego lo reemplazas con fetch a PHP)
/*const usuarios = [
  { correo: "admin@example.com", password: "admin123", nombre: "Admin", rol: "admin" },
  { correo: "juan@example.com", password: "juan123", nombre: "Juan Pérez", rol: "vendedor" }
];

// Simular inventario
const inventario = [
  { id: 1, nombre: "Perfume A", categoria: "Fragancia", stock: 10, precio: 50.00, fecha: "2025-06-08", tienda: "Tienda 1" },
  { id: 2, nombre: "Perfume B", categoria: "Fragancia", stock: 5, precio: 75.50, fecha: "2025-06-07", tienda: "Tienda 2" }
];

document.addEventListener("DOMContentLoaded", function() {
  if (document.getElementById("loginForm")) {
    // Login
    document.getElementById("loginForm").addEventListener("submit", function(e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const user = usuarios.find(u => u.correo === email && u.password === password);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "dashboard.html";
      } else {
        document.getElementById("loginError").textContent = "Correo o contraseña incorrectos.";
      }
    });
  }

  if (document.getElementById("inventoryTable")) {
    // Dashboard
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    document.getElementById("userName").textContent = user.nombre;

    const tbody = document.querySelector("#inventoryTable tbody");
    tbody.innerHTML = "";
    inventario.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>${p.categoria}</td>
        <td>${p.stock}</td>
        <td>${p.precio.toFixed(2)}</td>
        <td>${p.fecha}</td>
        <td>${p.tienda}</td>
      `;
      tbody.appendChild(tr);
    });
  }
});*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const correo = document.getElementById("correo").value;
      const contrasena = document.getElementById("contrasena").value;

      const res = await fetch("php/api_login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("usuario", JSON.stringify(data));
        window.location.href = "dashboard.html";
      } else {
        document.getElementById("loginError").textContent = data.message;
      }
    });
  }
});
