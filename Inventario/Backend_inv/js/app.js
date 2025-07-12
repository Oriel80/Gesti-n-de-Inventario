// js/app.js

// --- Modal de Edición de Producto (HTML y lógica) ---
(function() {
    // Inserta el modal solo si no existe ya en el DOM
    if (!document.getElementById('product-edit-modal')) {
        const modalHtml = `
        <div id="product-edit-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 hidden">
          <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button id="close-product-edit-modal" type="button" class="absolute top-2 right-2 text-gray-500 hover:text-gray-700">&times;</button>
            <h2 class="text-xl font-semibold mb-4">Editar Producto</h2>
            <form id="product-edit-form" class="space-y-4">
              <input type="hidden" id="edit-product-id">
              <div>
                <label for="edit-nombre" class="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" id="edit-nombre" class="mt-1 block w-full border border-gray-300 rounded-md p-2" required>
              </div>
              <div>
                <label for="edit-categoria" class="block text-sm font-medium text-gray-700">Categoría</label>
                <input type="text" id="edit-categoria" class="mt-1 block w-full border border-gray-300 rounded-md p-2" required>
              </div>
              <div>
                <label for="edit-stock" class="block text-sm font-medium text-gray-700">Stock</label>
                <input type="number" id="edit-stock" class="mt-1 block w-full border border-gray-300 rounded-md p-2" min="0" required>
              </div>
              <div>
                <label for="edit-precio" class="block text-sm font-medium text-gray-700">Precio</label>
                <input type="number" id="edit-precio" class="mt-1 block w-full border border-gray-300 rounded-md p-2" min="0" step="0.01" required>
              </div>
              <div>
                <label for="edit-fecha-ingreso" class="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
                <input type="date" id="edit-fecha-ingreso" class="mt-1 block w-full border border-gray-300 rounded-md p-2" required>
              </div>
              <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Guardar Cambios</button>
            </form>
          </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Función para abrir el modal y cargar datos
    window.openProductEditModal = function(product) {
        const modal = document.getElementById('product-edit-modal');
        if (!modal) return;
        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-nombre').value = product.nombre;
        document.getElementById('edit-categoria').value = product.categoria;
        document.getElementById('edit-stock').value = product.stock;
        document.getElementById('edit-precio').value = product.precio;
        document.getElementById('edit-fecha-ingreso').value = product.fecha_ingreso;
        modal.classList.remove('hidden');
    };

    // Función para cerrar el modal
    window.closeProductEditModal = function() {
        const modal = document.getElementById('product-edit-modal');
        if (modal) modal.classList.add('hidden');
    };

    // Cerrar modal al hacer click en la X
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'close-product-edit-modal') {
            window.closeProductEditModal();
        }
    });

    // Manejar el submit del formulario de edición
    document.addEventListener('submit', async function(e) {
        if (e.target && e.target.id === 'product-edit-form') {
            e.preventDefault();
            if (!window.currentUser) {
                window.showMessage('Debes iniciar sesión para editar productos.', 'error');
                return;
            }
            const id = document.getElementById('edit-product-id').value;
            const nombre = document.getElementById('edit-nombre').value;
            const categoria = document.getElementById('edit-categoria').value;
            const stock = parseInt(document.getElementById('edit-stock').value, 10);
            const precio = parseFloat(document.getElementById('edit-precio').value);
            const fecha_ingreso = document.getElementById('edit-fecha-ingreso').value;
            const productData = {
                id: parseInt(id, 10),
                nombre,
                categoria,
                stock,
                precio,
                fecha_ingreso,
                usuario_id: window.currentUser.id,
                tienda_id: window.currentUser.tienda_id
            };
            try {
                const response = await fetch(`${API_BASE_URL}/products/update.php`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
                const result = await response.json();
                if (response.ok && result.status === 'success') {
                    window.showMessage(result.message, 'success');
                    window.closeProductEditModal();
                    window.loadInventory(window.currentUser.rol, window.currentUser.tienda_id, window.inventoryTableBody, true);
                } else {
                    window.showMessage(result.message || 'Ocurrió un error al actualizar el producto.', 'error');
                }
            } catch (error) {
                console.error('Error al actualizar el producto:', error);
                window.showMessage('Error de conexión al intentar actualizar el producto.', 'error');
            }
        }
    });

    // Sobrescribir editProduct para usar el modal
    window.editProduct = async function(id) {
        if (!window.currentUser) {
            window.showMessage('Debes iniciar sesión para editar productos.', 'error');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/products/read.php?id=${id}`);
            const result = await response.json();
            if (response.ok && result.status === 'success' && result.data) {
                window.openProductEditModal(result.data);
            } else {
                window.showMessage(result.message || 'Producto no encontrado para edición.', 'error');
            }
        } catch (error) {
            console.error('Error al obtener producto para edición:', error);
            window.showMessage('Error de conexión al obtener el producto para edición.', 'error');
        }
    };
})();

// URL base de tu API PHP
// ASEGÚRATE DE CAMBIAR 'tu_proyecto' por el nombre real de tu carpeta raíz del proyecto PHP
const API_BASE_URL = 'http://localhost/Inventario/Backend_inv/api'; // CAMBIO REALIZADO AQUÍ

// --- Estado Global del Usuario y Datos ---
let currentUser = null; // Se llenará después del login
let allProducts = []; // Almacenará todos los productos cargados para la búsqueda/filtrado

// --- Referencias a elementos del DOM ---
// Se inicializan a null y se asignarán en DOMContentLoaded
// let loginSection; // Eliminado: login.html maneja el login
let appContent;

let currentUserName;
let currentUserId;
let currentUserRol;
let currentUserTiendaId;
let logoutBtn; // Ahora solo referencia al botón del header

let productForm;
let productIdInput;
let nombreInput;
let categoriaInput;
let stockInput;
let precioInput;
let fechaIngresoInput;
let productTiendaIdInput;
let productImageInput; // Re-añadido
let cancelEditBtn;

let saleForm;
let saleProductIdInput;
let saleQuantityInput;
let transactionTypeSelect; // Nuevo: select para tipo de transacción (venta/pérdida)
let lossReasonField; // Nuevo: campo para el motivo de la pérdida
let lossReasonInput; // Nuevo: input para el motivo de la pérdida

let inventoryTableBody;
let refreshInventoryBtn;

let messageBox;
let messageText;
let closeMessageBtn;

let confirmModal;
let confirmMessage;
let confirmYesBtn;
let confirmNoBtn;

// Nuevas referencias para búsqueda
let searchInput;
let searchBtn;

// Nuevas referencias para el modal de otras tiendas (el original, ahora para "Ver Inventario de Otras Tiendas (Modal)")
let viewOtherStoresBtn; // Este es el botón en el cuerpo principal, no en el header
let viewOtherStoresModal;
let closeViewOtherStoresModalBtn;
let storeSelect;
let otherStoresInventoryTableBody;

// Nuevas referencias para el Sidebar de Opciones
let logoHomeBtn;
let optionsBtn;
let optionsSidebar;
let closeSidebarBtn;
let storesOptionBtn;
let reportsOptionBtn;
let sidebarOverlay;
// Referencias a los botones de "Ver Inventario de Tiendas" y "Cerrar Sesión" dentro del sidebar
let sidebarViewOtherStoresBtn;
let sidebarLogoutBtn;


// Nuevas referencias para el Modal "Gestionar Mi Tienda" (para la opción "Tiendas" del sidebar)
let selectStoreModal;
let selectStoreDropdown;
let confirmSelectStoreBtn;
let closeSelectStoreModalBtn;

// Nuevas referencias para el Modal de Informes
let reportsModal;
let closeReportsModalBtn;
let generalReportTab;
let gainsLossesTab;
let generalReportContent;
let gainsLossesContent;
let gainsLossesTableBody;
let totalGainsSpan;
let totalLossesSpan;
let netBalanceSpan;

// Nuevas referencias para el informe general
let totalProductsSpan;
let totalSalesRegisteredSpan;
let totalInventoryValueSpan;
let generalReportStoreSelect; // NUEVA REFERENCIA PARA EL SELECT DE TIENDAS EN EL INFORME GENERAL


let confirmCallback = null;
let isSidebarLockedOpen = false; // Nuevo estado para controlar si el sidebar está bloqueado abierto por un clic
let sidebarCloseTimeout; // Variable para almacenar el ID del timeout de cierre del sidebar


// --- Funciones de Utilidad ---

/**
 * Muestra un mensaje en la interfaz de usuario.
 * @param {string} message El mensaje a mostrar.
 * @param {string} type El tipo de mensaje (e.g., 'success', 'error', 'info').
 */
function showMessage(message, type = 'info') {
    console.log(`showMessage called: ${message} (${type})`); // Log adicional
    if (!messageBox || !messageText) {
        console.error('Error: Message box elements not found.');
        return;
    }
    messageText.textContent = message;
    messageBox.classList.remove('hidden');

    messageBox.classList.remove('bg-green-100', 'border-green-400', 'text-green-700',
                               'bg-red-100', 'border-red-400', 'text-red-700',
                               'bg-blue-100', 'border-blue-400', 'text-blue-700');

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

    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

/**
 * Muestra un modal de confirmación personalizado.
 * @param {string} message El mensaje de confirmación.
 * @returns {Promise<boolean>} Una promesa que se resuelve a true si se confirma, false si se cancela.
 */
function showConfirm(message) {
    return new Promise((resolve) => {
        if (!confirmModal || !confirmMessage) {
            console.error('Error: Confirm modal elements not found.');
            resolve(false); // Fallback
            return;
        }
        confirmMessage.textContent = message;
        confirmModal.classList.remove('hidden');
        confirmModal.style.display = 'flex'; // Asegura que el modal sea visible
        confirmModal.style.opacity = '1'; // Asegura opacidad completa
        confirmModal.style.pointerEvents = 'auto'; // Habilita interacciones

        confirmCallback = (result) => {
            confirmModal.style.opacity = '0'; // Inicia la transición de opacidad
            confirmModal.style.pointerEvents = 'none'; // Deshabilita interacciones inmediatamente
            setTimeout(() => {
                confirmModal.classList.add('hidden');
                confirmModal.style.display = 'none'; // Oculta completamente después de la transición
            }, 300); // Coincide con la duración de la transición
            resolve(result);
            confirmCallback = null;
        };
    });
}


/**
 * Limpia el formulario de productos y oculta el botón de cancelar edición.
 */
function clearProductForm() {
    if (productIdInput) productIdInput.value = '';
    if (nombreInput) nombreInput.value = '';
    if (categoriaInput) categoriaInput.value = '';
    if (stockInput) stockInput.value = '';
    if (precioInput) precioInput.value = '';
    if (fechaIngresoInput) fechaIngresoInput.value = '';
    if (productImageInput) productImageInput.value = ''; // Limpiar campo de imagen
    if (cancelEditBtn) cancelEditBtn.classList.add('hidden');
}

/**
 * Limpia el formulario de ventas/pérdidas.
 */
function clearSaleForm() {
    if (saleProductIdInput) saleProductIdInput.value = '';
    if (saleQuantityInput) saleQuantityInput.value = '';
    if (transactionTypeSelect) transactionTypeSelect.value = 'sale'; // Restablecer a "Venta"
    if (lossReasonInput) lossReasonInput.value = ''; // Limpiar motivo de pérdida
    if (lossReasonField) lossReasonField.classList.add('hidden'); // Ocultar campo de motivo
}

/**
 * Carga la información del usuario logeado en la interfaz.
 */
function loadUserInfo() {
    if (currentUser) {
        if (currentUserName) currentUserName.textContent = currentUser.nombre;
        if (currentUserId) currentUserId.textContent = currentUser.id;
        if (currentUserRol) currentUserRol.textContent = currentUser.rol;
        if (currentUserTiendaId) currentUserTiendaId.textContent = currentUser.tienda_id;
        if (productTiendaIdInput) productTiendaIdInput.value = currentUser.tienda_id;
        // También actualizar los campos del móvil si existen
        const currentUserNameMobile = document.getElementById('current-user-name-mobile');
        const currentUserRolMobile = document.getElementById('current-user-rol-mobile');
        const currentUserTiendaIdMobile = document.getElementById('current-user-tienda-id-mobile');

        if (currentUserNameMobile) currentUserNameMobile.textContent = currentUser.nombre;
        if (currentUserRolMobile) currentUserRolMobile.textContent = currentUser.rol;
        if (currentUserTiendaIdMobile) currentUserTiendaIdMobile.textContent = currentUser.tienda_id;
    }
}

/**
 * Oculta la sección de login y muestra el contenido principal de la app.
 */
function showAppContent() {
    if (appContent) {
        appContent.classList.remove('hidden');
    } else {
        console.error('Error: appContent element not found!');
    }
}

/**
 * Oculta el contenido principal de la app y redirige a la página de login.
 */
function hideAppContent() {
    if (appContent) {
        appContent.classList.add('hidden');
    }
    window.location.href = 'login.html';
}

/**
 * Cierra la sesión del usuario.
 */
async function logout() { // Hacemos la función async
    const confirmed = await showConfirm('¿Estás seguro de que quieres cerrar sesión?'); // Usamos await
    if (!confirmed) {
        return;
    }
    localStorage.removeItem('currentUser');
    currentUser = null;
    hideAppContent();
    showMessage('Sesión cerrada correctamente.', 'info');
}

// --- Lógica de Productos (CRUD) ---

/**
 * Carga los productos en una tabla de inventario específica.
 * @param {string} rol El rol del usuario para la consulta.
 * @param {number} tienda_id El ID de la tienda para la consulta.
 * @param {HTMLElement} targetTableBody El tbody donde se renderizarán los productos.
 * @param {boolean} showActions Indica si se deben mostrar los botones de acción (Editar/Eliminar).
 */
async function loadInventory(rol, tienda_id, targetTableBody, showActions = false) {
    if (!targetTableBody) {
        console.error('Error: targetTableBody is null or undefined in loadInventory.');
        return;
    }
    targetTableBody.innerHTML = `<tr><td colspan="${showActions ? 8 : 7}" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Cargando inventario...</td></tr>`;
    
    try {
        const response = await fetch(`${API_BASE_URL}/inventory/consult.php?rol=${rol}&tienda_id=${tienda_id}`);
        const data = await response.json();

        targetTableBody.innerHTML = '';

        if (response.ok && data.status === 'success' && data.data && data.data.length > 0) {
            if (targetTableBody === inventoryTableBody) {
                allProducts = data.data;
            }
            data.data.forEach(product => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                const actionsHtml = showActions ? `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button data-edit-product-id="${product.id}" class="text-indigo-600 hover:text-indigo-900 mr-4 btn-edit-product">Editar</button>
                        <button data-delete-product-id="${product.id}" class="text-red-600 hover:text-red-900 btn-delete-product">Eliminar</button>
                    </td>
                ` : '';

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.nombre}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.categoria}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.stock}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${parseFloat(product.precio).toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.fecha_ingreso}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.tienda_nombre || 'N/A'}</td>
                    ${actionsHtml}
                `;
                targetTableBody.appendChild(row);
            });
        } else {
            targetTableBody.innerHTML = `<tr><td colspan="${showActions ? 8 : 7}" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">${data.message || 'No se encontraron productos en el inventario.'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error al cargar inventario:', error);
        targetTableBody.innerHTML = `<tr><td colspan="${showActions ? 8 : 7}" class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-500">Error al cargar inventario. Por favor, verifica la conexión con el backend.</td></tr>`;
        showMessage('Error al cargar inventario. Por favor, verifica la conexión con el backend.', 'error');
    }
}

/**
 * Filtra los productos en la tabla de inventario basándose en el texto de búsqueda.
 * Realiza un filtrado del lado del cliente sobre 'allProducts'.
 */
function filterInventory() {
    if (!searchInput || !inventoryTableBody) {
        console.error('Error: Search elements not found for filtering.');
        return;
    }
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProducts = allProducts.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm) ||
        product.categoria.toLowerCase().includes(searchTerm)
    );
    renderProductsToTable(filteredProducts, inventoryTableBody, true);
}

/**
 * Renderiza una lista de productos en una tabla HTML específica.
 * @param {Array} products La lista de productos a renderizar.
 * @param {HTMLElement} tableBody El elemento tbody de la tabla.
 * @param {boolean} showActions Indica si se deben mostrar los botones de acción (Editar/Eliminar).
 */
function renderProductsToTable(products, tableBody, showActions = false) {
    if (!tableBody) {
        console.error('Error: tableBody is null or undefined in renderProductsToTable.');
        return;
    }
    tableBody.innerHTML = '';

    if (products.length > 0) {
        products.forEach(product => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            const actionsHtml = showActions ? `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button data-edit-product-id="${product.id}" class="text-indigo-600 hover:text-indigo-900 mr-4 btn-edit-product">Editar</button>
                        <button data-delete-product-id="${product.id}" class="text-red-600 hover:text-red-900 btn-delete-product">Eliminar</button>
                    </td>
                ` : '';
// Delegación de eventos para los botones Editar y Eliminar en la tabla de inventario
document.addEventListener('DOMContentLoaded', () => {
    if (window.inventoryTableBody) {
        window.inventoryTableBody.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.btn-edit-product');
            if (editBtn) {
                const id = editBtn.getAttribute('data-edit-product-id');
                if (id) window.editProduct(id);
                return;
            }
            const deleteBtn = e.target.closest('.btn-delete-product');
            if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-delete-product-id');
                if (id) window.deleteProduct(id);
                return;
            }
        });
    }
});

            row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.nombre}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.categoria}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.stock}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${parseFloat(product.precio).toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.fecha_ingreso}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.tienda_nombre || 'N/A'}</td>
                    ${actionsHtml}
                `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = `<tr><td colspan="${showActions ? 8 : 7}" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">No se encontraron productos.</td></tr>`;
    }
}


/**
 * Maneja el envío del formulario de productos para crear o actualizar.
 * @param {Event} event El evento de envío del formulario.
 */
async function handleProductFormSubmit(event) {
    event.preventDefault();

    if (!currentUser || !currentUser.id) {
        showMessage('Debes iniciar sesión para realizar esta acción.', 'error');
        return;
    }

    const id = productIdInput.value;
    const productData = {
        usuario_id: currentUser.id,
        nombre: nombreInput.value,
        categoria: categoriaInput.value,
        stock: parseInt(stockInput.value, 10),
        precio: parseFloat(precioInput.value),
        fecha_ingreso: fechaIngresoInput.value,
        tienda_id: currentUser.tienda_id
    };

    const imageFile = productImageInput.files[0];
    if (imageFile) {
        showMessage('La selección de imagen es solo una demostración en el frontend. La funcionalidad de subida de archivos requiere un backend específico.', 'info');
    }

    let url = '';
    let method = '';

    if (id) {
        url = `${API_BASE_URL}/products/update.php`;
        method = 'PUT';
        productData.id = parseInt(id, 10);
    } else {
        url = `${API_BASE_URL}/products/create.php`;
        method = 'POST';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            showMessage(result.message, 'success');
            clearProductForm();
            loadInventory(currentUser.rol, currentUser.tienda_id, inventoryTableBody, true);
        } else {
            showMessage(result.message || 'Ocurrió un error al guardar el producto.', 'error');
        }
    } catch (error) {
        console.error('Error al guardar el producto:', error);
        showMessage('Error de conexión al intentar guardar el producto.', 'error');
    }
}

/**
 * Carga los datos de un producto en el formulario para edición.
 * @param {number} id El ID del producto a editar.
 */
async function editProduct(id) {
    if (!currentUser) {
        showMessage('Debes iniciar sesión para editar productos.', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/products/read.php?id=${id}`);
        const result = await response.json();

        if (response.ok && result.status === 'success' && result.data) {
            const product = result.data;
            if (productIdInput) productIdInput.value = product.id;
            if (nombreInput) nombreInput.value = product.nombre;
            if (categoriaInput) categoriaInput.value = product.categoria;
            if (stockInput) stockInput.value = product.stock;
            if (precioInput) precioInput.value = product.precio;
            if (fechaIngresoInput) fechaIngresoInput.value = product.fecha_ingreso;
            if (productTiendaIdInput) productTiendaIdInput.value = product.tienda_id;
            if (cancelEditBtn) cancelEditBtn.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showMessage(result.message || 'Producto no encontrado para edición.', 'error');
        }
    } catch (error) {
        console.error('Error al obtener producto para edición:', error);
        showMessage('Error de conexión al obtener el producto para edición.', 'error');
    }
}

/**
 * Elimina un producto.
 * @param {number} id El ID del producto a eliminar.
 */
async function deleteProduct(id) {
    if (!currentUser) {
        showMessage('Debes iniciar sesión para eliminar productos.', 'error');
        return;
    }
    const confirmed = await showConfirm('¿Estás seguro de que quieres eliminar este producto?');
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/delete.php`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            showMessage(result.message, 'success');
            loadInventory(currentUser.rol, currentUser.tienda_id, inventoryTableBody, true);
        } else {
            showMessage(result.message || 'Ocurrió un error al eliminar el producto.', 'error');
        }
    }
    catch (error) {
        console.error('Error al eliminar el producto:', error);
        showMessage('Error de conexión al intentar eliminar el producto.', 'error');
    }
}

// --- Lógica de Ventas/Pérdidas ---

/**
 * Maneja el envío del formulario de ventas/pérdidas.
 * @param {Event} event El evento de envío del formulario.
 */
async function handleSaleFormSubmit(event) {
    event.preventDefault();

    if (!currentUser || !currentUser.id || !currentUser.tienda_id) {
        showMessage('Debes iniciar sesión para registrar una transacción.', 'error');
        return;
    }

    const userId = currentUser.id;
    const productId = parseInt(saleProductIdInput.value, 10);
    const quantity = parseInt(saleQuantityInput.value, 10);
    const transactionType = transactionTypeSelect.value;
    const lossReason = lossReasonInput ? lossReasonInput.value.trim() : ''; // Solo si el campo existe

    if (isNaN(productId) || productId <= 0 || isNaN(quantity) || quantity <= 0) {
        showMessage('Por favor, ingresa un ID de producto y una cantidad válidos.', 'error');
        return;
    }

    let url = '';
    let payload = {};

    if (transactionType === 'sale') {
        url = `${API_BASE_URL}/sales/register.php`;
        payload = {
            usuario_id: userId,
            producto_id: productId,
            cantidad: quantity
        };
    } else if (transactionType === 'loss') {
        url = `${API_BASE_URL}/inventory/register_loss.php`; // Nueva API para pérdidas
        payload = {
            usuario_id: userId,
            producto_id: productId,
            cantidad: quantity, // Cantidad perdida
            tienda_id: currentUser.tienda_id, // La tienda del usuario actual
            motivo: lossReason // Motivo de la pérdida
        };
        if (!lossReason) {
            showMessage('Por favor, ingresa un motivo para la pérdida.', 'error');
            return;
        }
    } else {
        showMessage('Tipo de transacción no válido.', 'error');
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            showMessage(result.message, 'success');
            clearSaleForm();
            loadInventory(currentUser.rol, currentUser.tienda_id, inventoryTableBody, true);
        } else {
            showMessage(result.message || 'Ocurrió un error al registrar la transacción.', 'error');
        }
    } catch (error) {
        console.error('Error al registrar la transacción:', error);
        showMessage('Error de conexión al intentar registrar la transacción.', 'error');
    }
}


// --- Lógica para el Modal de Visualización de Otras Tiendas (anterior 'other-stores-modal') ---

/**
 * Carga la lista de tiendas en el select del modal de visualización.
 */
async function loadStoresForViewSelection() {
    if (!storeSelect) {
        console.error('Error: storeSelect element not found for view selection.');
        return;
    }
    storeSelect.innerHTML = '<option value="">Cargando tiendas...</option>';
    
    console.log('--- loadStoresForViewSelection ---');
    console.log('Current User Tienda ID:', currentUser ? currentUser.tienda_id : 'N/A');

    try {
        const response = await fetch(`${API_BASE_URL}/stores/read_all.php`);
        const data = await response.json();

        console.log('API Response for stores/read_all.php (for view selection):', data);

        if (response.ok && data.status === 'success' && data.data && data.data.length > 0) {
            storeSelect.innerHTML = '<option value="">-- Selecciona una tienda --</option>';
            let storesAdded = 0;
            data.data.forEach(store => {
                if (currentUser && store.id != currentUser.tienda_id) {
                    const option = document.createElement('option');
                    option.value = store.id;
                    option.textContent = store.nombre;
                    storeSelect.appendChild(option);
                    storesAdded++;
                    console.log(`Adding store to view selection: ID ${store.id}, Name: ${store.nombre}`);
                } else {
                    console.log(`Skipping store for view selection: ID ${store.id}, Name: ${store.nombre} (is current user's store or currentUser is null)`);
                }
            });
            console.log(`Total other stores added to view selection dropdown: ${storesAdded}`);
            if (storesAdded === 0) {
                storeSelect.innerHTML = '<option value="">No se encontraron otras tiendas.</option>';
            }
        } else {
            storeSelect.innerHTML = '<option value="">No se encontraron tiendas.</option>';
            showMessage(data.message || 'No se pudieron cargar las tiendas para visualización.', 'error');
        }
    } catch (error) {
        console.error('Error al cargar tiendas para visualización:', error);
        storeSelect.innerHTML = '<option value="">Error al cargar tiendas.</option>';
        showMessage('Error de conexión al cargar tiendas para visualización. Verifica el backend.', 'error');
    }
}

/**
 * Abre el modal de inventario de otras tiendas y carga las tiendas.
 */
async function openViewOtherStoresModal() {
    console.log('openViewOtherStoresModal called from "Ver Inventario de Tiendas" button.');
    if (!currentUser) {
        showMessage('Debes iniciar sesión para ver inventarios de otras tiendas.', 'error');
        return;
    }
    if (viewOtherStoresModal) {
        viewOtherStoresModal.classList.remove('hidden'); // Asegura que la clase 'hidden' se remueva
        viewOtherStoresModal.style.display = 'flex'; // Usar display directo
        viewOtherStoresModal.style.opacity = '1'; // Asegura opacidad completa
        viewOtherStoresModal.style.pointerEvents = 'auto'; // Habilita interacciones
        viewOtherStoresModal.style.transition = 'opacity 0.3s ease-in-out'; // Agrega transición
        console.log("viewOtherStoresModal display set to flex.");
    } else {
        console.error("viewOtherStoresModal is null when trying to open.");
    }
    await loadStoresForViewSelection();
    if (otherStoresInventoryTableBody) otherStoresInventoryTableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Selecciona una tienda para ver su inventario.</td></tr>`;
}

/**
 * Cierra el modal de inventario de otras tiendas.
 */
function closeViewOtherStoresModal() {
    console.log('closeViewOtherStoresModal called');
    if (viewOtherStoresModal) {
        viewOtherStoresModal.style.opacity = '0'; // Inicia la transición de opacidad
        viewOtherStoresModal.style.pointerEvents = 'none'; // Deshabilita interacciones inmediatamente
        // Espera a que la transición termine antes de ocultar completamente
        setTimeout(() => {
            viewOtherStoresModal.classList.add('hidden'); // Asegura que la clase 'hidden' se añada
            viewOtherStoresModal.style.display = 'none'; // Usar display directo (sin !important)
            console.log("Inside setTimeout - viewOtherStoresModal display set to none. classList after hidden:", viewOtherStoresModal.classList.value);
        }, 300); // 300ms, debe coincidir con la duración de la transición
    }
    if (storeSelect) storeSelect.value = '';
    if (otherStoresInventoryTableBody) otherStoresInventoryTableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Selecciona una tienda para ver su inventario.</td></tr>`;
}

/**
 * Carga el inventario de una tienda seleccionada en el modal de otras tiendas.
 * @param {number} tiendaId El ID de la tienda cuyo inventario se quiere cargar.
 */
async function loadOtherStoreInventory(tiendaId) {
    if (!otherStoresInventoryTableBody) {
        console.error('Error: otherStoresInventoryTableBody is null or undefined in loadOtherStoreInventory.');
        return;
    }
    otherStoresInventoryTableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Cargando inventario de la tienda ${tiendaId}...</td></tr>`;

    try {
        const response = await fetch(`${API_BASE_URL}/inventory/consult.php?rol=${currentUser.rol}&tienda_id=${tiendaId}`);
        const data = await response.json();

        if (response.ok && data.status === 'success' && data.data && data.data.length > 0) {
            renderProductsToTable(data.data, otherStoresInventoryTableBody, false); // No mostrar acciones en inventario de otras tiendas
        } else {
            otherStoresInventoryTableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">${data.message || 'No se encontraron productos para esta tienda.'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error al cargar inventario de otra tienda:', error);
        otherStoresInventoryTableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-500">Error al cargar inventario de la tienda ${tiendaId}. Por favor, verifica la conexión con el backend.</td></tr>`;
        showMessage(`Error al cargar inventario de la tienda ${tiendaId}.`, 'error');
    }
}


// --- Lógica para el Sidebar de Opciones ---

/**
 * Abre el sidebar y muestra el overlay.
 */
function openSidebar() {
    console.log('openSidebar called');
    if (optionsSidebar) {
        optionsSidebar.classList.add('open');
        optionsSidebar.style.width = '250px';
        if (window.innerWidth < 768) {
            optionsSidebar.style.width = '70%';
        }
    } else {
        console.error('Error: optionsSidebar element not found!');
    }
    if (sidebarOverlay) {
        sidebarOverlay.classList.add('visible');
    }
    // Actualizar la información del usuario en el sidebar móvil cada vez que se abre
    loadUserInfo(); 
}

/**
 * Cierra el sidebar y oculta el overlay.
 */
function closeSidebar() {
    console.log('closeSidebar called');
    if (optionsSidebar) {
        optionsSidebar.classList.remove('open');
        optionsSidebar.style.width = '0';
    } else {
        console.error('Error: optionsSidebar element not found!');
    }
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('visible');
    }
}

// --- Lógica para el Modal "Gestionar Mi Tienda" (desde el sidebar) ---

/**
 * Carga la lista de tiendas en el dropdown del modal de selección de tienda.
 */
async function loadStoresForMainSelection() {
    console.log('loadStoresForMainSelection called (for "Gestionar Mi Tienda" modal).');
    if (!selectStoreDropdown) {
        console.error('Error: selectStoreDropdown element not found for main selection.');
        return;
    }
    selectStoreDropdown.innerHTML = '<option value="">Cargando tiendas...</option>';
    try {
        const response = await fetch(`${API_BASE_URL}/stores/read_all.php`);
        const data = await response.json();

        console.log('API Response for stores/read_all.php (for main selection):', data);

        if (response.ok && data.status === 'success' && data.data && data.data.length > 0) {
            selectStoreDropdown.innerHTML = '<option value="">-- Selecciona una tienda --</option>'; // Opción por defecto
            data.data.forEach(store => {
                const option = document.createElement('option');
                option.value = store.id;
                option.textContent = store.nombre;
                // Seleccionar la tienda actual del usuario si coincide
                if (currentUser && store.id == currentUser.tienda_id) {
                    option.selected = true;
                }
                selectStoreDropdown.appendChild(option);
            });
            selectStoreDropdown.disabled = false; // Habilitar el dropdown para permitir la selección
        } else {
            selectStoreDropdown.innerHTML = '<option value="">No se encontraron tiendas.</option>';
            showMessage(data.message || 'No se pudieron cargar las tiendas para selección.', 'error');
            selectStoreDropdown.disabled = true; // Deshabilitar si no hay tiendas
        }
    }
    catch (error) {
        console.error('Error al cargar tiendas para selección:', error);
        selectStoreDropdown.innerHTML = '<option value="">Error al cargar tiendas.</option>';
        showMessage('Error de conexión al cargar tiendas para selección. Verifica el backend.', 'error');
        selectStoreDropdown.disabled = true; // Deshabilitar en caso de error de conexión
    }
}

/**
 * Abre el modal de selección de tienda principal.
 */
async function openSelectStoreModal() {
    console.log("openSelectStoreModal called from 'Tiendas' sidebar option.");
    if (!currentUser) {
        showMessage('Debes iniciar sesión para ver la información de tu tienda.', 'error');
        return;
    }
    closeSidebar();
    if (selectStoreModal) {
        selectStoreModal.classList.remove('hidden'); // Asegura que la clase 'hidden' se remueva
        selectStoreModal.style.display = 'flex'; // Usar display directo
        selectStoreModal.style.opacity = '1'; // Asegura opacidad completa
        selectStoreModal.style.pointerEvents = 'auto'; // Habilita interacciones
        selectStoreModal.style.transition = 'opacity 0.3s ease-in-out'; // Agrega transición
        console.log("selectStoreModal display set to flex. classList after open:", selectStoreModal.classList.value);
    } else {
        console.error("selectStoreModal is null when trying to open.");
    }
    await loadStoresForMainSelection();
}

/**
 * Cierra el modal de selección de tienda principal.
 */
function closeSelectStoreModal() {
    console.log("closeSelectStoreModal called");
    if (selectStoreModal) {
        console.log("selectStoreModal classList before transition:", selectStoreModal.classList.value);
        selectStoreModal.style.opacity = '0'; // Inicia la transición de opacidad
        selectStoreModal.style.pointerEvents = 'none'; // Deshabilita interacciones inmediatamente
        // Espera a que la transición termine antes de ocultar completamente
        setTimeout(() => {
            selectStoreModal.classList.add('hidden'); // Asegura que la clase 'hidden' se añada
            selectStoreModal.style.display = 'none'; // Usar display directo
            console.log("Inside setTimeout - selectStoreModal display set to none. classList after hidden:", selectStoreModal.classList.value);
        }, 300); // 300ms, debe coincidir con la duración de la transición
    } else {
        console.error("selectStoreModal is null when trying to close.");
    }
}


// --- Lógica para el Modal de Informes ---

/**
 * Abre el modal de informes y carga los datos de ganancias y pérdidas.
 */
async function openReportsModal() {
    console.log('openReportsModal called');
    if (!currentUser) {
        showMessage('Debes iniciar sesión para ver los informes.', 'error');
        return;
    }
    closeSidebar();
    if (reportsModal) {
        reportsModal.classList.remove('hidden'); // Asegura que la clase 'hidden' se remueva
        reportsModal.style.display = 'flex'; // Usar display directo
        reportsModal.style.opacity = '1'; // Asegura opacidad completa
        reportsModal.style.pointerEvents = 'auto'; // Habilita interacciones
        reportsModal.style.transition = 'opacity 0.3s ease-in-out'; // Agrega transición
        console.log('Reports modal visibility set to visible (display:flex).');
    } else {
        console.error('Error: reportsModal element not found!');
        return;
    }
    // Populate the store select for general report
    await loadStoresForGeneralReportSelection(); // Carga las tiendas para el nuevo select del informe general
    // Por defecto, al abrir el modal de informes, se muestra la pestaña de ganancias y pérdidas
    showReportTab('gains-losses'); 
    await loadGainsLossesReport();
}

/**
 * Cierra el modal de informes.
 */
function closeReportsModal() {
    console.log('closeReportsModal called');
    if (reportsModal) {
        reportsModal.style.opacity = '0'; // Inicia la transición de opacidad
        reportsModal.style.pointerEvents = 'none'; // Deshabilita interacciones inmediatamente
        // Espera a que la transición termine antes de ocultar completamente
        setTimeout(() => {
            reportsModal.classList.add('hidden'); // Asegura que la clase 'hidden' se añada
            reportsModal.style.display = 'none'; // Usar display directo (sin !important)
            console.log('Inside setTimeout - Reports modal visibility set to hidden (display:none).');
        }, 300); // 300ms, debe coincidir con la duración de la transición
    } else {
        console.error('Error: reportsModal element not found!');
    }
}

/**
 * Muestra la pestaña de informe seleccionada.
 * @param {string} tabId El ID de la pestaña a mostrar ('general-report' o 'gains-losses').
 */
function showReportTab(tabId) {
    console.log('showReportTab called with:', tabId);

    // Remove 'active' from all content divs
    if (generalReportContent) {
        generalReportContent.classList.remove('active');
        generalReportContent.classList.add('hidden'); // Asegurarse de ocultar
    }
    if (gainsLossesContent) {
        gainsLossesContent.classList.remove('active');
        gainsLossesContent.classList.add('hidden'); // Asegurarse de ocultar
    }

    // Remove 'active-tab' styling from all tab buttons
    if (generalReportTab) {
        generalReportTab.classList.remove('active-tab', 'border-indigo-500', 'text-indigo-600');
        generalReportTab.classList.add('border-transparent', 'text-gray-600'); // Ensure default styling
    }
    if (gainsLossesTab) {
        gainsLossesTab.classList.remove('active-tab', 'border-indigo-500', 'text-indigo-600');
        gainsLossesTab.classList.add('border-transparent', 'text-gray-600'); // Ensure default styling
    }
    
    // Add 'active' to the selected content div and 'active-tab' styling to the selected tab button
    if (tabId === 'general-report') {
        if (generalReportContent) generalReportContent.classList.remove('hidden'); // Mostrar
        if (generalReportContent) generalReportContent.classList.add('active'); // Añadir clase activa
        if (generalReportTab) {
            generalReportTab.classList.add('active-tab', 'border-indigo-500', 'text-indigo-600');
            generalReportTab.classList.remove('border-transparent', 'text-gray-600');
        }
        console.log('General Report tab activated.');
    } else if (tabId === 'gains-losses') {
        if (gainsLossesContent) gainsLossesContent.classList.remove('hidden'); // Mostrar
        if (gainsLossesContent) gainsLossesContent.classList.add('active'); // Añadir clase activa
        if (gainsLossesTab) {
            gainsLossesTab.classList.add('active-tab', 'border-indigo-500', 'text-indigo-600');
            gainsLossesTab.classList.remove('border-transparent', 'text-gray-600');
        }
        console.log('Gains and Losses tab activated.');
    }
}

/**
 * Carga los datos de ganancias y pérdidas.
 */
async function loadGainsLossesReport() {
    console.log('loadGainsLossesReport called');
    if (!currentUser || !gainsLossesTableBody || !totalGainsSpan || !totalLossesSpan || !netBalanceSpan) {
        console.error('Error: Current user or report elements (gains/losses) not found.');
        showMessage('Error al cargar informe: Faltan datos del usuario o elementos de la interfaz.', 'error');
        return;
    }

    let totalGains = 0;
    let totalLosses = 0; 
    let netBalance = 0;

    gainsLossesTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Cargando datos...</td></tr>`;
    totalGainsSpan.textContent = '$0.00';
    totalLossesSpan.textContent = '$0.00';
    netBalanceSpan.textContent = '$0.00';

    // Construir la URL con rol y tienda_id
    const tiendaIdParam = currentUser.tienda_id === 0 ? '0' : currentUser.tienda_id; // Enviar 0 si es "Todas las tiendas"
    const url = `${API_BASE_URL}/reports/gains_losses.php?rol=${currentUser.rol}&tienda_id=${tiendaIdParam}`;
    console.log('Fetching gains_losses report from:', url);

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('API Response for gains_losses.php:', data);

        gainsLossesTableBody.innerHTML = ''; // Limpiar la tabla antes de añadir datos

        if (response.ok && data.status === 'success' && data.data && data.data.length > 0) {
            data.data.forEach(transaction => { // Renombrado de 'sale' a 'transaction'
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                
                const montoTotal = parseFloat(transaction.monto_total);

                if (transaction.tipo_transaccion === 'venta') {
                    totalGains += montoTotal;
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${transaction.id_transaccion}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.nombre_producto}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.cantidad}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${parseFloat(transaction.monto_unitario).toFixed(2)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">$${montoTotal.toFixed(2)} (Venta)</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.fecha_transaccion}</td> 
                    `;
                } else if (transaction.tipo_transaccion === 'perdida') {
                    totalLosses += montoTotal;
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${transaction.id_transaccion}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.nombre_producto}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.cantidad}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${parseFloat(transaction.monto_unitario).toFixed(2)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">-$${montoTotal.toFixed(2)} (Pérdida)</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.fecha_transaccion}</td> 
                    `;
                }
                gainsLossesTableBody.appendChild(row);
            });
        } else {
            gainsLossesTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">${data.message || 'No se encontraron datos de transacciones.'}</td></tr>`;
        }

        netBalance = totalGains - totalLosses;

        totalGainsSpan.textContent = `$${totalGains.toFixed(2)}`;
        totalLossesSpan.textContent = `$${totalLosses.toFixed(2)}`;
        netBalanceSpan.textContent = `$${netBalance.toFixed(2)}`;

    } catch (error) {
        console.error('Error al cargar informe de ganancias y pérdidas:', error);
        gainsLossesTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-500">Error al cargar informe. Por favor, verifica la conexión con el backend.</td></tr>`;
        showMessage('Error al cargar informe de ganancias y pérdidas. Por favor, verifica la conexión con el backend.', 'error');
    }
}

/**
 * Carga los datos del informe general.
 * @param {number|null} tiendaId El ID de la tienda a consultar, o null para todas las tiendas.
 */
async function loadGeneralReport() {
    console.log('loadGeneralReport called');
    if (!currentUser || !totalProductsSpan || !totalSalesRegisteredSpan || !totalInventoryValueSpan || !generalReportStoreSelect) {
        console.error('Error: Current user or general report elements not found or store select missing.');
        showMessage('Error al cargar informe: Faltan datos del usuario o elementos de la interfaz.', 'error');
        return;
    }

    const selectedTiendaId = generalReportStoreSelect.value === '0' ? 0 : parseInt(generalReportStoreSelect.value, 10); // Asegurarse de que sea 0 o el ID
    
    // Construir la URL para el informe general, siempre incluyendo rol y tienda_id
    const url = `${API_BASE_URL}/reports/general.php?rol=${currentUser.rol}&tienda_id=${selectedTiendaId}`;
    console.log('Fetching general report from:', url);

    // Mostrar un estado de carga
    totalProductsSpan.textContent = 'Cargando...';
    totalSalesRegisteredSpan.textContent = 'Cargando...';
    totalInventoryValueSpan.textContent = 'Cargando...';

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('API Response for general.php:', data);

        if (response.ok && data.status === 'success' && data.data) {
            // Asegurarse de que los valores no sean undefined o null
            totalProductsSpan.textContent = data.data.total_productos !== undefined && data.data.total_productos !== null ? data.data.total_productos : '0';
            totalSalesRegisteredSpan.textContent = data.data.total_ventas_registradas !== undefined && data.data.total_ventas_registradas !== null ? data.data.total_ventas_registradas : '0';
            totalInventoryValueSpan.textContent = `$${parseFloat(data.data.valor_total_inventario !== undefined && data.data.valor_total_inventario !== null ? data.data.valor_total_inventario : 0).toFixed(2)}`;
        } else {
            totalProductsSpan.textContent = 'N/A';
            totalSalesRegisteredSpan.textContent = 'N/A';
            totalInventoryValueSpan.textContent = 'N/A';
            showMessage(data.message || 'No se pudieron cargar los datos del informe general.', 'error');
        }
    } catch (error) {
        console.error('Error al cargar informe general:', error);
        totalProductsSpan.textContent = 'Error';
        totalSalesRegisteredSpan.textContent = 'Error';
        totalInventoryValueSpan.textContent = 'Error';
        showMessage('Error de conexión al cargar el informe general. Por favor, verifica el backend.', 'error');
    }
}

/**
 * Carga la lista de tiendas para el dropdown del informe general.
 */
async function loadStoresForGeneralReportSelection() {
    if (!generalReportStoreSelect) {
        console.error('Error: generalReportStoreSelect element not found.');
        return;
    }
    generalReportStoreSelect.innerHTML = '<option value="0">Todas las tiendas</option><option value="">Cargando tiendas...</option>';

    try {
        const response = await fetch(`${API_BASE_URL}/stores/read_all.php`);
        const data = await response.json();

        if (response.ok && data.status === 'success' && data.data && data.data.length > 0) {
            generalReportStoreSelect.innerHTML = '<option value="0">Todas las tiendas</option>'; // Reset with "Todas las tiendas"
            data.data.forEach(store => {
                const option = document.createElement('option');
                option.value = store.id;
                option.textContent = store.nombre;
                generalReportStoreSelect.appendChild(option);
            });
            // Select the current user's store by default if it's not admin
            if (currentUser && currentUser.rol !== 'admin') {
                generalReportStoreSelect.value = currentUser.tienda_id;
            } else {
                generalReportStoreSelect.value = '0'; // Default to "Todas las tiendas" for admin or if no user
            }
        } else {
            generalReportStoreSelect.innerHTML = '<option value="0">Todas las tiendas</option><option value="">No se encontraron tiendas.</option>';
            showMessage(data.message || 'No se pudieron cargar las tiendas para el informe general.', 'error');
        }
    } catch (error) {
        console.error('Error al cargar tiendas para informe general:', error);
        generalReportStoreSelect.innerHTML = '<option value="0">Todas las tiendas</option><option value="">Error al cargar tiendas.</option>';
        showMessage('Error de conexión al cargar tiendas para informe general. Verifica el backend.', 'error');
    }
}


// --- Inicialización y Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: app.js script loaded.'); // Nuevo log al inicio

    // Check HTML version
    const htmlVersionMeta = document.getElementById('html-version');
    if (htmlVersionMeta) {
        console.log('HTML Version:', htmlVersionMeta.dataset.version);
    } else {
        console.warn('HTML version meta tag not found. Ensure index.html is updated.');
    }

    // Cargar el usuario actual desde localStorage al inicio
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    console.log('DOMContentLoaded: currentUser loaded from localStorage:', currentUser); // Log de currentUser

    // Asignar referencias a elementos del DOM una vez que el DOM esté cargado
    appContent = document.getElementById('app-content'); 

    currentUserName = document.getElementById('current-user-name');
    currentUserId = document.getElementById('current-user-id');
    currentUserRol = document.getElementById('current-user-rol');
    currentUserTiendaId = document.getElementById('current-user-tienda-id');
    logoutBtn = document.getElementById('logout-btn-header');

    productForm = document.getElementById('product-form');
    productIdInput = document.getElementById('product-id');
    nombreInput = document.getElementById('nombre');
    categoriaInput = document.getElementById('categoria');
    stockInput = document.getElementById('stock');
    precioInput = document.getElementById('precio');
    fechaIngresoInput = document.getElementById('fecha_ingreso');
    productTiendaIdInput = document.getElementById('product-tienda-id');
    productImageInput = document.getElementById('product-image');
    cancelEditBtn = document.getElementById('cancel-edit-btn');

    saleForm = document.getElementById('sale-form');
    saleProductIdInput = document.getElementById('sale-product-id');
    saleQuantityInput = document.getElementById('sale-quantity');
    transactionTypeSelect = document.getElementById('transaction-type'); // Nueva referencia
    lossReasonField = document.getElementById('loss-reason-field'); // Nueva referencia
    lossReasonInput = document.getElementById('loss-reason'); // Nueva referencia

    inventoryTableBody = document.getElementById('inventory-table-body');
    refreshInventoryBtn = document.getElementById('refresh-inventory-btn');

    messageBox = document.getElementById('message-box');
    messageText = document.getElementById('message-text');
    closeMessageBtn = document.getElementById('close-message-btn');


    confirmModal = document.getElementById('confirm-modal');
    confirmMessage = document.getElementById('confirm-message');
    confirmYesBtn = document.getElementById('confirm-yes');
    confirmNoBtn = document.getElementById('confirm-no');

    searchInput = document.getElementById('search-input-header');
    searchBtn = document.getElementById('search-btn-header');

    viewOtherStoresBtn = document.getElementById('view-other-stores-btn');
    viewOtherStoresModal = document.getElementById('view-other-stores-modal');
    closeViewOtherStoresModalBtn = document.getElementById('close-view-other-stores-modal-btn');
    storeSelect = document.getElementById('store-select');
    otherStoresInventoryTableBody = document.getElementById('other-stores-inventory-table-body');

    // Nuevas referencias para el Sidebar de Opciones
    logoHomeBtn = document.getElementById('logo-home-btn');
    optionsBtn = document.getElementById('options-btn');
    optionsSidebar = document.getElementById('options-sidebar');
    closeSidebarBtn = document.getElementById('close-sidebar-btn');
    storesOptionBtn = document.getElementById('stores-option-btn');
    reportsOptionBtn = document.getElementById('reports-option-btn');
    sidebarOverlay = document.getElementById('sidebar-overlay');

    // Referencias a los botones de "Ver Inventario de Tiendas" y "Cerrar Sesión" dentro del sidebar
    sidebarViewOtherStoresBtn = document.getElementById('sidebar-view-other-stores-btn');
    if (!sidebarViewOtherStoresBtn) {
        console.error('sidebarViewOtherStoresBtn not found! Ensure index.html is updated with ID "sidebar-view-other-stores-btn" for the link in the sidebar.');
    }
    sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
    if (!sidebarLogoutBtn) {
        console.error('sidebarLogoutBtn not found! Ensure index.html is updated with ID "sidebar-logout-btn" for the link in the sidebar.');
    }


    selectStoreModal = document.getElementById('select-store-modal');
    selectStoreDropdown = document.getElementById('select-store-dropdown');
    confirmSelectStoreBtn = document.getElementById('confirm-select-store-btn');
    closeSelectStoreModalBtn = document.getElementById('close-select-store-modal-btn');

    reportsModal = document.getElementById('reports-modal');
    closeReportsModalBtn = document.getElementById('close-reports-modal-btn');
    generalReportTab = document.getElementById('general-report-tab');
    gainsLossesTab = document.getElementById('gains-losses-tab');
    generalReportContent = document.getElementById('general-report-content');
    gainsLossesContent = document.getElementById('gains-losses-content');
    gainsLossesTableBody = document.getElementById('gains-losses-table-body');
    totalGainsSpan = document.getElementById('total-gains');
    totalLossesSpan = document.getElementById('total-losses');
    netBalanceSpan = document.getElementById('net-balance');

    // Nuevas referencias para el informe general
    totalProductsSpan = document.getElementById('total-products');
    totalSalesRegisteredSpan = document.getElementById('total-sales-registered');
    totalInventoryValueSpan = document.getElementById('total-inventory-value');
    generalReportStoreSelect = document.getElementById('general-report-store-select'); // Asignar la nueva referencia


    // Adjuntar Event Listeners después de que los elementos existan
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', clearProductForm);
    if (refreshInventoryBtn) refreshInventoryBtn.addEventListener('click', () => {
        if (currentUser && currentUser.id) {
            loadInventory(currentUser.rol, currentUser.tienda_id, inventoryTableBody, true);
        } else {
            showMessage('Inicia sesión para actualizar el inventario.', 'info');
        }
    });
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (closeMessageBtn) {
        closeMessageBtn.addEventListener('click', () => {
            if (messageBox) messageBox.classList.add('hidden');
        });
    }

    if (confirmYesBtn) confirmYesBtn.addEventListener('click', () => { if (confirmCallback) confirmCallback(true); });
    if (confirmNoBtn) confirmNoBtn.addEventListener('click', () => { if (confirmCallback) confirmCallback(false); });

    // Event listeners para formularios
    if (productForm) productForm.addEventListener('submit', handleProductFormSubmit);
    if (saleForm) saleForm.addEventListener('submit', handleSaleFormSubmit);

    // Event listener para el nuevo campo de tipo de transacción
    if (transactionTypeSelect) {
        transactionTypeSelect.addEventListener('change', (event) => {
            if (event.target.value === 'loss') {
                if (lossReasonField) lossReasonField.classList.remove('hidden');
                if (lossReasonInput) lossReasonInput.setAttribute('required', 'true');
            } else {
                if (lossReasonField) lossReasonField.classList.add('hidden');
                if (lossReasonInput) {
                    lossReasonInput.removeAttribute('required');
                    lossReasonInput.value = ''; // Limpiar el valor si se oculta
                }
            }
        });
    }

    // Event listeners para búsqueda
    if (searchBtn) searchBtn.addEventListener('click', filterInventory);
    if (searchInput) searchInput.addEventListener('keyup', filterInventory);

    // Event listeners para modales y sidebar
    if (viewOtherStoresBtn) {
        console.log('viewOtherStoresBtn found, attaching click listener.');
        viewOtherStoresBtn.addEventListener('click', openViewOtherStoresModal);
    } else {
        console.error('viewOtherStoresBtn not found!');
    }
    
    if (closeViewOtherStoresModalBtn) closeViewOtherStoresModalBtn.addEventListener('click', closeViewOtherStoresModal);
    if (storeSelect) storeSelect.addEventListener('change', (event) => {
        const selectedStoreId = event.target.value;
        if (selectedStoreId) {
            loadOtherStoreInventory(selectedStoreId);
        } else {
            if (otherStoresInventoryTableBody) otherStoresInventoryTableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Selecciona una tienda para ver su inventario.</td></tr>`;
        }
    });

    if (logoHomeBtn) logoHomeBtn.addEventListener('click', () => {
        if (currentUser && currentUser.id) {
            loadInventory(currentUser.rol, currentUser.tienda_id, inventoryTableBody, true);
            clearProductForm();
            clearSaleForm();
            showMessage('Inventario de tu tienda recargado.', 'info');
        } else {
            window.location.href = 'login.html';
        }
    });

    // Lógica del Sidebar: Abre al pasar el mouse por el botón y cierra al salir del sidebar
    if (optionsBtn && optionsSidebar && closeSidebarBtn && sidebarOverlay) {
        optionsBtn.addEventListener('mouseover', openSidebar); // Abre al pasar el mouse sobre el botón
        optionsBtn.addEventListener('click', openSidebar); // También permite abrir con click
        
        optionsSidebar.addEventListener('mouseleave', closeSidebar); // Cierra al salir el mouse del sidebar
        closeSidebarBtn.addEventListener('click', closeSidebar); // Cierra con el botón explícito
        sidebarOverlay.addEventListener('click', closeSidebar); // Cierra al hacer click en el overlay
    } else {
        console.error('One or more sidebar elements not found!');
    }
    
    // Sidebar options
    if (storesOptionBtn) storesOptionBtn.addEventListener('click', openSelectStoreModal);
    if (reportsOptionBtn) {
        console.log('reportsOptionBtn found, attaching click listener.');
        reportsOptionBtn.addEventListener('click', openReportsModal);
    } else {
        console.error('reportsOptionBtn not found!');
    }

    // Event listeners para los botones de "Ver Inventario de Tiendas" y "Cerrar Sesión" dentro del sidebar
    if (sidebarViewOtherStoresBtn) {
        console.log('sidebarViewOtherStoresBtn found, attaching click listener.');
        sidebarViewOtherStoresBtn.addEventListener('click', () => {
            closeSidebar();
            openViewOtherStoresModal();
        });
    } else {
        console.error('sidebarViewOtherStoresBtn not found!');
    }

    if (sidebarLogoutBtn) {
        console.log('sidebarLogoutBtn found, attaching click listener.');
        sidebarLogoutBtn.addEventListener('click', () => {
            closeSidebar();
            logout();
        });
    } else {
        console.error('sidebarLogoutBtn not found!');
    }


    // Select Store Modal
    if (closeSelectStoreModalBtn) closeSelectStoreModalBtn.addEventListener('click', closeSelectStoreModal);
    if (confirmSelectStoreBtn) confirmSelectStoreBtn.addEventListener('click', async () => {
        console.log("Confirm Select Store button clicked!"); // Nuevo log para verificar si el evento se dispara

        const newTiendaId = parseInt(selectStoreDropdown.value, 10);
        const newTiendaNombre = selectStoreDropdown.options[selectStoreDropdown.selectedIndex].textContent;

        if (isNaN(newTiendaId) || newTiendaId <= 0) {
            showMessage('Por favor, selecciona una tienda válida.', 'error');
            return;
        }

        if (newTiendaId === currentUser.tienda_id) {
            showMessage('Ya estás asignado a esta tienda.', 'info');
            closeSelectStoreModal(); // Close if it's the same store
            return;
        }

        // Cierra el modal de selección de tienda inmediatamente antes de mostrar la confirmación
        closeSelectStoreModal(); 

        const confirmed = await showConfirm(`¿Estás seguro de que quieres cambiar tu tienda principal a: ${newTiendaNombre} (ID: ${newTiendaId})?`);
        if (!confirmed) {
            // Si el usuario cancela la confirmación, no hace nada más.
            // El modal de confirmación se cierra automáticamente en showConfirm.
            return;
        }

        // Si se confirma, procedemos con la lógica
        currentUser.tienda_id = newTiendaId;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        loadUserInfo();
        loadInventory(currentUser.rol, currentUser.tienda_id, inventoryTableBody, true);
        showMessage(`Tu tienda principal ha sido cambiada a: ${newTiendaNombre}.`, 'success');
        
        // No es necesario llamar a closeSelectStoreModal() de nuevo aquí, ya se cerró.
        console.log("Después de la lógica de cambio de tienda: selectStoreModal ya debería estar cerrado.");
    });


    // Reports Modal
    if (closeReportsModalBtn) closeReportsModalBtn.addEventListener('click', closeReportsModal);
    if (generalReportTab) generalReportTab.addEventListener('click', () => {
        showReportTab('general-report');
        loadGeneralReport(); // Cargar datos del informe general al cambiar a esta pestaña
    });
    if (gainsLossesTab) gainsLossesTab.addEventListener('click', () => {
        showReportTab('gains-losses');
        loadGainsLossesReport();
    });

    // Event listener para el nuevo select de tiendas en el informe general
    if (generalReportStoreSelect) {
        generalReportStoreSelect.addEventListener('change', () => {
            loadGeneralReport(); // Recargar el informe general cuando cambia la tienda seleccionada
        });
    }


    // --- Lógica de inicialización al cargar la página ---
    if (currentUser && currentUser.id) {
        showAppContent();
        loadUserInfo();
        
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        if (fechaIngresoInput) fechaIngresoInput.value = `${yyyy}-${mm}-${dd}`;
        if (productTiendaIdInput) productTiendaIdInput.value = currentUser.tienda_id;

        loadInventory(currentUser.rol, currentUser.tienda_id, inventoryTableBody, true);
    } else {
        hideAppContent();
    }
});
