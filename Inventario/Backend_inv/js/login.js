// js/login.js

// URL base de tu API PHP (ajustada para el login)
const API_BASE_URL = 'http://localhost/Inventario/Backend_inv/api';

// Referencias a elementos del DOM en login.html
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');

/**
 * Muestra un mensaje en la interfaz de usuario.
 * @param {string} message El mensaje a mostrar.
 * @param {string} type El tipo de mensaje (e.g., 'success', 'error', 'info').
 */
function showMessage(message, type = 'info') {
    messageText.textContent = message;
    messageBox.classList.remove('hidden');

    // Limpia clases de tipo anteriores
    messageBox.classList.remove('bg-green-100', 'border-green-400', 'text-green-700',
                               'bg-red-100', 'border-red-400', 'text-red-700',
                               'bg-blue-100', 'border-blue-400', 'text-blue-700');

    // Agrega clases según el tipo de mensaje
    switch (type) {
        case 'success':
            messageBox.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
            break;
        case 'error':
            messageBox.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
            break;
        case 'info':
        default:
            messageBox.classList.add('bg-blue-100', 'border-blue-400', 'text-blue-700');
            break;
    }

    // Oculta el mensaje después de 5 segundos
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

/**
 * Maneja el envío del formulario de login.
 */
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita el envío tradicional del formulario

    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    if (!email || !password) {
        showMessage('Por favor, ingresa tu correo y contraseña.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo: email, contrasena: password })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success' && result.data) {
            showMessage('Inicio de sesión exitoso.', 'success');
            // Almacenar los datos del usuario en localStorage para usarlos en index.html
            localStorage.setItem('currentUser', JSON.stringify(result.data));
            // Redirigir al usuario a la página principal de la aplicación
            window.location.href = 'index.html';
        } else {
            showMessage(result.message || 'Error al iniciar sesión. Verifica tus credenciales.', 'error');
        }
    } catch (error) {
        console.error('Error de conexión al intentar iniciar sesión:', error);
        showMessage('Error de conexión al intentar iniciar sesión. Por favor, verifica el backend.', 'error');
    }
});

// Opcional: Si el usuario ya está logeado, redirigirlo a index.html
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('currentUser')) {
        window.location.href = 'index.html';
    }
});
