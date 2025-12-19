// DOM элементы
let contactsTableBody;
let searchInput;
let addContactBtn;
let usersManagementBtn;
let backToPhonebookBtn;
let logoutBtn;
let currentUsername;
let userRoleBadge;
let adminCapabilities;
let contactModal;
let deleteModal;
let currentContactId = null;

let searchTimeout;

document.addEventListener('DOMContentLoaded', function() {

    contactsTableBody = document.getElementById('contactsTableBody');
    searchInput = document.getElementById('searchInput');
    addContactBtn = document.getElementById('addContactBtn');
    usersManagementBtn = document.getElementById('usersManagementBtn');
    backToPhonebookBtn = document.getElementById('backToPhonebookBtn');
    logoutBtn = document.getElementById('logoutBtn');
    currentUsername = document.getElementById('currentUsername');
    userRoleBadge = document.getElementById('userRoleBadge');
    adminCapabilities = document.getElementById('adminCapabilities');

    checkAuthAndLoad();

    initModals();

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    if (addContactBtn) {
        addContactBtn.addEventListener('click', showAddContactModal);
    }
    
    if (usersManagementBtn) {
        usersManagementBtn.addEventListener('click', () => {
            window.location.href = 'users.html';
        });
    }
    
    if (backToPhonebookBtn) {
        backToPhonebookBtn.addEventListener('click', () => {
            window.location.href = 'phonebook.html';
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof auth !== 'undefined' && auth.logout) {
                auth.logout();
            } else {
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('currentUser');
                window.location.href = '/index.html';
            }
        });
    }
});

// Проверка авторизации и загрузка данных
function checkAuthAndLoad() {
    const token = localStorage.getItem('jwtToken');
    const username = localStorage.getItem('currentUser');
    
    if (!token || !username) {
        // Если нет токена или пользователя, перенаправляем на страницу входа
        window.location.href = '/index.html';
        return;
    }
    
    // Проверяем, есть ли у пользователя права админа
    if (!isAdminUser(username)) {
        // Если нет прав админа, перенаправляем на обычную телефонную книгу
        window.location.href = 'phonebook.html';
        return;
    }
    
    // Отображаем имя пользователя
    currentUsername.textContent = username;
    
    // Определяем роль пользователя и настраиваем интерфейс
    setupUserInterface(username);
    
    // Загружаем контакты
    loadContacts();
}

// Проверка, является ли пользователь администратором
function isAdminUser(username) {
    return username === 'superadmin' || username === 'admin' || username === 'moderator';
}

function setupUserInterface(username) {
    let role = 'ROLE_USER';
    let roleDisplay = 'Пользователь';
    let roleClass = 'role-user';
    let capabilities = '';
    
    if (username === 'superadmin') {
        role = 'ROLE_SUPER_ADMIN';
        roleDisplay = 'Супер Админ';
        roleClass = 'role-super-admin';
        capabilities = 'Вы можете: просматривать, добавлять, редактировать и удалять контакты, а также управлять пользователями.';
        
        // Показываем кнопку управления пользователями
        if (usersManagementBtn) usersManagementBtn.style.display = 'flex';
        if (addContactBtn) addContactBtn.style.display = 'flex';
        
    } else if (username === 'admin') {
        role = 'ROLE_ADMIN';
        roleDisplay = 'Администратор';
        roleClass = 'role-admin';
        capabilities = 'Вы можете: просматривать, добавлять, редактировать и удалять контакты.';
        
        // Скрываем кнопку управления пользователями
        if (usersManagementBtn) usersManagementBtn.style.display = 'none';
        if (addContactBtn) addContactBtn.style.display = 'flex';
        
    } else if (username === 'moderator') {
        role = 'ROLE_MODERATOR';
        roleDisplay = 'Модератор';
        roleClass = 'role-moderator';
        capabilities = 'Вы можете: просматривать и редактировать контакты. Удаление контактов недоступно.';
        
        // Скрываем кнопку управления пользователями
        if (usersManagementBtn) usersManagementBtn.style.display = 'none';
        // Модератор не может добавлять контакты
        if (addContactBtn) addContactBtn.style.display = 'none';
        
    } else {
        // Обычный пользователь не должен быть здесь
        window.location.href = 'phonebook.html';
        return;
    }
    
    // Обновляем бейдж роли
    if (userRoleBadge) {
        userRoleBadge.textContent = roleDisplay;
        userRoleBadge.className = `role-badge ${roleClass}`;
    }
    
    // Обновляем информацию о возможностях
    if (adminCapabilities) {
        adminCapabilities.textContent = capabilities;
    }
}

// Инициализация модальных окон
function initModals() {
    // Модальное окно контакта
    contactModal = document.getElementById('contactModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const saveContactBtn = document.getElementById('saveContactBtn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            contactModal.classList.remove('active');
        });
    }
    
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', () => {
            contactModal.classList.remove('active');
        });
    }
    
    if (saveContactBtn) {
        saveContactBtn.addEventListener('click', saveContact);
    }
    
    // Модальное окно удаления
    deleteModal = document.getElementById('deleteModal');
    const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', () => {
            deleteModal.classList.remove('active');
        });
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.remove('active');
        });
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteContact);
    }
    
    // Закрытие модальных окон при клике вне их
    window.addEventListener('click', (event) => {
        if (event.target === contactModal) {
            contactModal.classList.remove('active');
        }
        if (event.target === deleteModal) {
            deleteModal.classList.remove('active');
        }
    });
}

// Загрузка контактов
async function loadContacts(searchQuery = '') {
    showLoading(true);
    
    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }
        
        let url = `${API_BASE_URL}/api/contacts`;
        if (searchQuery) {
            url = `${API_BASE_URL}/api/contacts/search?query=${encodeURIComponent(searchQuery)}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const contacts = await response.json();
            displayContacts(contacts);
        } else if (response.status === 403) {
            showMessage('У вас нет прав для просмотра контактов', 'error');
        } else {
            showMessage('Ошибка при загрузке контактов', 'error');
        }
    } catch (error) {
        console.error('Ошибка при загрузке контактов:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    } finally {
        showLoading(false);
    }
}

// Отображение контактов в таблице
function displayContacts(contacts) {
    if (!contactsTableBody) return;

    // Очищаем таблицу
    contactsTableBody.innerHTML = '';

    // Показываем сообщение, если контактов нет
    const noContactsMessage = document.getElementById('noContactsMessage');
    if (noContactsMessage) {
        if (!contacts || contacts.length === 0) {
            noContactsMessage.style.display = 'block';
            return;
        } else {
            noContactsMessage.style.display = 'none';
        }
    }

    // Получаем роли пользователя
    const userRoles = getCurrentUserRoles();
    const isModerator = userRoles.includes('ROLE_MODERATOR') && !userRoles.includes('ROLE_ADMIN') && !userRoles.includes('ROLE_SUPER_ADMIN');
    const isAdmin = userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SUPER_ADMIN');

    // Добавляем контакты в таблицу
    contacts.forEach(contact => {
        const row = document.createElement('tr');

        // Полное имя для отображения
        const fullName = `${contact.contactLastName || ''} ${contact.contactFirstName || ''} ${contact.contactPatronymic || ''}`.trim();

        // Определяем, какие кнопки действий показывать
        let actionsHTML = '';

        if (isModerator) {
            // Модераторы могут только редактировать
            actionsHTML = `
                <button class="btn btn-secondary btn-sm edit-btn" data-id="${contact.contactId}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
            `;
        } else if (isAdmin) {
            // Админы и супер-админы могут все
            actionsHTML = `
                <button class="btn btn-secondary btn-sm edit-btn" data-id="${contact.contactId}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${contact.contactId}" data-name="${fullName}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            `;
        }

        row.innerHTML = `
            <td>${contact.contactId || ''}</td>
            <td>${contact.contactLastName || ''}</td>
            <td>${contact.contactFirstName || ''}</td>
            <td>${contact.contactPatronymic || ''}</td>
            <td>${contact.contactPosition || ''}</td>
            <td>${contact.contactPhoneNumber || ''}</td>
            <td>${contact.contactInternalNumber || ''}</td>
            <td>
                <div class="action-buttons">
                    ${actionsHTML}
                </div>
            </td>
        `;

        contactsTableBody.appendChild(row);

        // Назначаем обработчики для кнопок
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');

        if (editBtn) {
            editBtn.addEventListener('click', () => showEditContactModal(contact));
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => showDeleteContactModal(contact.contactId, fullName));
        }
    });
}

// Получить роли текущего пользователя
function getCurrentUserRoles() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return [];

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decodedToken = JSON.parse(jsonPayload);
        return decodedToken.roles || [];
    } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        return [];
    }
}

// Обработка поиска
function handleSearch() {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        const query = searchInput.value.trim();
        loadContacts(query);
    }, 300);
}

// Показать модальное окно добавления контакта
function showAddContactModal() {
    // Проверяем права пользователя
    const username = localStorage.getItem('currentUser') || '';
    if (username === 'moderator') {
        showMessage('У вас нет прав для добавления контактов', 'error');
        return;
    }
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Добавить контакт';
    
    // Очищаем форму
    document.getElementById('contactForm').reset();
    document.getElementById('contactId').value = '';
    
    currentContactId = null;
    contactModal.classList.add('active');
}

// Показать модальное окно редактирования контакта
function showEditContactModal(contact) {
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Редактировать контакт';
    
    // Заполняем форму данными контакта
    document.getElementById('contactId').value = contact.contactId;
    document.getElementById('contactFirstName').value = contact.contactFirstName || '';
    document.getElementById('contactLastName').value = contact.contactLastName || '';
    document.getElementById('contactPatronymic').value = contact.contactPatronymic || '';
    document.getElementById('contactPosition').value = contact.contactPosition || '';
    document.getElementById('contactPhoneNumber').value = contact.contactPhoneNumber || '';
    document.getElementById('contactInternalNumber').value = contact.contactInternalNumber || '';
    
    currentContactId = contact.contactId;
    contactModal.classList.add('active');
}

// Сохранение контакта (добавление или обновление)
async function saveContact() {
    // Собираем данные из формы
    const contactData = {
        contactFirstName: document.getElementById('contactFirstName').value,
        contactLastName: document.getElementById('contactLastName').value,
        contactPatronymic: document.getElementById('contactPatronymic').value,
        contactPosition: document.getElementById('contactPosition').value,
        contactPhoneNumber: document.getElementById('contactPhoneNumber').value,
        contactInternalNumber: document.getElementById('contactInternalNumber').value
    };
    
    // Проверяем обязательные поля
    if (!contactData.contactFirstName || !contactData.contactLastName || 
        !contactData.contactPosition || !contactData.contactPhoneNumber) {
        showMessage('Пожалуйста, заполните все обязательные поля (помечены *)', 'error');
        return;
    }
    
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    
    // Проверяем права пользователя
    const username = localStorage.getItem('currentUser') || '';
    const isEdit = !!currentContactId;
    
    // Модератор не может добавлять контакты
    if (!isEdit && username === 'moderator') {
        showMessage('У вас нет прав для добавления контактов', 'error');
        contactModal.classList.remove('active');
        return;
    }
    
    try {
        let url, method;
        
        if (currentContactId) {
            // Редактирование существующего контакта
            url = `${API_BASE_URL}/api/contacts/${currentContactId}`;
            method = 'PUT';
        } else {
            // Добавление нового контакта
            url = `${API_BASE_URL}/api/contacts`;
            method = 'POST';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
        });
        
        if (response.ok) {
            showMessage(`Контакт успешно ${currentContactId ? 'обновлен' : 'добавлен'}!`, 'success');
            contactModal.classList.remove('active');
            loadContacts(searchInput.value.trim());
        } else if (response.status === 403) {
            showMessage('У вас нет прав для выполнения этого действия', 'error');
        } else {
            showMessage(`Ошибка при ${currentContactId ? 'обновлении' : 'добавлении'} контакта`, 'error');
        }
    } catch (error) {
        console.error('Ошибка при сохранении контакта:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    }
}

// Показать модальное окно подтверждения удаления
function showDeleteContactModal(contactId, contactName) {
    // Проверяем права пользователя
    const username = localStorage.getItem('currentUser') || '';
    if (username === 'moderator') {
        showMessage('У вас нет прав для удаления контактов', 'error');
        return;
    }
    
    const deleteContactName = document.getElementById('deleteContactName');
    if (deleteContactName) deleteContactName.textContent = contactName;
    
    currentContactId = contactId;
    deleteModal.classList.add('active');
}

// Подтверждение удаления контакта
async function confirmDeleteContact() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    
    // Проверяем права пользователя
    const username = localStorage.getItem('currentUser') || '';
    if (username === 'moderator') {
        showMessage('У вас нет прав для удаления контактов', 'error');
        deleteModal.classList.remove('active');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/contacts/${currentContactId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showMessage('Контакт успешно удален!', 'success');
            deleteModal.classList.remove('active');
            loadContacts(searchInput.value.trim());
        } else if (response.status === 403) {
            showMessage('У вас нет прав для удаления контактов', 'error');
        } else {
            showMessage('Ошибка при удалении контакта', 'error');
        }
    } catch (error) {
        console.error('Ошибка при удалении контакта:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    }
}

// Показать/скрыть индикатор загрузки
function showLoading(isLoading) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
    }
}

// Показать сообщение
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        
        // Автоматически скрыть сообщение через 5 секунд
        if (type === 'success') {
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 5000);
        }
    }
}