// DOM элементы
let contactsTableBody;
let searchInput;
let addContactBtn;
let adminPanelBtn;
let logoutBtn;
let currentUsername;
let userRoleBadge;
let contactModal;
let deleteModal;
let currentContactId = null;

// Таймер для отложенного поиска
let searchTimeout;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('phonebook.js: DOM загружен');

    // Получаем элементы DOM
    contactsTableBody = document.getElementById('contactsTableBody');
    searchInput = document.getElementById('searchInput');
    addContactBtn = document.getElementById('addContactBtn');
    adminPanelBtn = document.getElementById('adminPanelBtn');
    logoutBtn = document.getElementById('logoutBtn');
    currentUsername = document.getElementById('currentUsername');
    userRoleBadge = document.getElementById('userRoleBadge');

    // Сразу скрываем загрузку (на всякий случай)
    showLoading(false);

    // Проверяем авторизацию
    checkAuthAndLoad();

    // Инициализируем модальные окна
    initModals();

    // Назначаем обработчики событий
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    if (addContactBtn) {
        addContactBtn.addEventListener('click', showAddContactModal);
    }

    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', () => {
            window.location.href = '/admin.html';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof auth !== 'undefined' && auth.logout) {
                auth.logout();
            } else {
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('currentUser');
                window.location.href = '/';
            }
        });
    }
});

// Инициализация модальных окон
function initModals() {
    contactModal = document.getElementById('contactModal');
    deleteModal = document.getElementById('deleteModal');

    if (!contactModal || !deleteModal) {
        console.warn('Модальные окна не найдены');
        return;
    }

    // Кнопки закрытия
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        contactModal.style.display = 'none';
    });

    document.getElementById('closeDeleteModalBtn')?.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });

    document.getElementById('cancelModalBtn')?.addEventListener('click', () => {
        contactModal.style.display = 'none';
    });

    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });

    // Сохранение контакта
    document.getElementById('saveContactBtn')?.addEventListener('click', saveContact);

    // Удаление контакта
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDeleteContact);

    // Закрытие по клику вне модального окна
    window.addEventListener('click', (event) => {
        if (event.target === contactModal) {
            contactModal.style.display = 'none';
        }
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });

    console.log('Модальные окна инициализированы');
}

// Показать/скрыть индикатор загрузки
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
}

// Проверка авторизации и загрузка данных
async function checkAuthAndLoad() {
    console.log('checkAuthAndLoad вызвана');

    const token = localStorage.getItem('jwtToken');
    const username = localStorage.getItem('currentUser');

    console.log('Данные из localStorage:', { token: !!token, username: !!username });

    if (!token || !username) {
        console.log('Нет токена или пользователя, перенаправляем на /');
        window.location.href = '/';
        return;
    }

    try {
        console.log('Проверяем токен...');
        const response = await fetch(`/secured/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const currentUser = await response.text();
            console.log('Токен валиден, пользователь:', currentUser);

            // Отображаем имя пользователя
            if (currentUsername) {
                currentUsername.textContent = currentUser;
            }

            // Настраиваем интерфейс по ролям
            await setupUserInterface();

            // Загружаем контакты
            loadContacts();

        } else {
            console.log('Токен невалидный, статус:', response.status);
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    }
}

// Настройка интерфейса в зависимости от роли пользователя
async function setupUserInterface() {
    console.log('Настройка интерфейса');

    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    // Используем функцию из auth.js если доступна
    let roles = [];
    if (typeof auth !== 'undefined' && auth.getUserRoles) {
        roles = auth.getUserRoles();
    } else {
        // Локальная декодировка токена
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decodedToken = JSON.parse(jsonPayload);
            roles = decodedToken.roles || [];
        } catch (error) {
            console.error('Ошибка декодирования токена:', error);
        }
    }

    console.log('Роли пользователя:', roles);

    let roleDisplay = 'Пользователь';
    let roleClass = 'role-user';
    const userInfoMessage = document.getElementById('userInfoMessage');

    if (roles.includes('ROLE_SUPER_ADMIN')) {
        roleDisplay = 'Супер Админ';
        roleClass = 'role-super-admin';
        if (adminPanelBtn) adminPanelBtn.style.display = 'flex';
        if (addContactBtn) addContactBtn.style.display = 'flex';
        if (userInfoMessage) userInfoMessage.style.display = 'none';

    } else if (roles.includes('ROLE_ADMIN')) {
        roleDisplay = 'Администратор';
        roleClass = 'role-admin';
        if (adminPanelBtn) adminPanelBtn.style.display = 'flex';
        if (addContactBtn) addContactBtn.style.display = 'flex';
        if (userInfoMessage) userInfoMessage.style.display = 'none';

    } else if (roles.includes('ROLE_MODERATOR')) {
        roleDisplay = 'Модератор';
        roleClass = 'role-moderator';
        if (adminPanelBtn) adminPanelBtn.style.display = 'flex';
        if (addContactBtn) addContactBtn.style.display = 'none';
        if (userInfoMessage) userInfoMessage.style.display = 'none';

    } else {
        // Обычный пользователь
        roleDisplay = 'Пользователь';
        roleClass = 'role-user';
        if (adminPanelBtn) adminPanelBtn.style.display = 'none';
        if (addContactBtn) addContactBtn.style.display = 'none';

        // Показываем информационное сообщение
        if (userInfoMessage) userInfoMessage.style.display = 'block';
    }

    // Обновляем бейдж роли
    if (userRoleBadge) {
        userRoleBadge.textContent = roleDisplay;
        userRoleBadge.className = `role-badge ${roleClass}`;
    }
}

// Загрузка контактов
async function loadContacts(searchQuery = '') {
    console.log('loadContacts вызвана, поиск:', searchQuery);

    // Показываем загрузку
    showLoading(true);

    try {
        const token = localStorage.getItem('jwtToken');
        let url = '/api/contacts';

        if (searchQuery) {
            url += `/search?query=${encodeURIComponent(searchQuery)}`;
        }

        console.log('Запрос к:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Ответ сервера:', response.status);

        if (response.ok) {
            const contacts = await response.json();
            console.log('Получено контактов:', contacts.length);

            renderContacts(contacts);

        } else {
            console.error('Ошибка загрузки:', response.status);
            showMessage('Ошибка загрузки контактов', 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    } finally {
        // Всегда скрываем загрузку
        showLoading(false);
    }
}

// Отображение контактов
function renderContacts(contacts) {
    if (!contactsTableBody) return;

    const noContactsMessage = document.getElementById('noContactsMessage');

    // Показываем/скрываем сообщение
    if (noContactsMessage) {
        if (!contacts || contacts.length === 0) {
            contactsTableBody.innerHTML = '';
            noContactsMessage.style.display = 'block';
            return;
        } else {
            noContactsMessage.style.display = 'none';
        }
    }

    // Если контактов нет - выходим
    if (!contacts || contacts.length === 0) {
        contactsTableBody.innerHTML = '';
        return;
    }

    // Очищаем таблицу
    contactsTableBody.innerHTML = '';

    // Получаем роль текущего пользователя из бейджа
    let isRegularUser = true;
    if (userRoleBadge) {
        const roleText = userRoleBadge.textContent.toLowerCase();
        isRegularUser = roleText === 'пользователь' || roleText === 'user';
    }

    // Отрисовываем контакты
    contacts.forEach(contact => {
        const row = document.createElement('tr');

        // Определяем, показывать ли кнопки действий
        let actionsCell;
        if (isRegularUser) {
            // Обычный пользователь - только просмотр
            actionsCell = '<td>-</td>';
        } else {
            // Модератор, Админ, Супер-админ
            const userRoles = getCurrentUserRoles();
            const isModerator = userRoles.includes('ROLE_MODERATOR') && !userRoles.includes('ROLE_ADMIN') && !userRoles.includes('ROLE_SUPER_ADMIN');

            if (isModerator) {
                // Модератор - только редактирование
                actionsCell = `
                    <td>
                        <button class="btn-edit" onclick="editContact(${contact.contactId})">✏️</button>
                        <button class="btn-delete" onclick="showNotAllowedMessage()" style="opacity: 0.5; cursor: not-allowed;">🗑️</button>
                    </td>
                `;
            } else {
                // Админ и Супер-админ - полный доступ
                actionsCell = `
                    <td>
                        <button class="btn-edit" onclick="editContact(${contact.contactId})">✏️</button>
                        <button class="btn-delete" onclick="deleteContact(${contact.contactId})">🗑️</button>
                    </td>
                `;
            }
        }

        row.innerHTML = `
            <td>${contact.contactId || ''}</td>
            <td>${contact.contactLastName || ''}</td>
            <td>${contact.contactFirstName || ''}</td>
            <td>${contact.contactPatronymic || ''}</td>
            <td>${contact.contactPosition || ''}</td>
            <td>${contact.contactPhoneNumber || ''}</td>
            <td>${contact.contactInternalNumber || ''}</td>
            ${actionsCell}
        `;
        contactsTableBody.appendChild(row);
    });

    console.log('Отображено контактов:', contacts.length);
}

// Функция для показа сообщения о запрете удаления
function showNotAllowedMessage() {
    showMessage('У вас нет прав для удаления контактов', 'warning');
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




// Редактирование контакта
function editContact(id) {
    console.log('Редактирование контакта ID:', id);
    currentContactId = id;
    loadContactForEdit(id);
}

// Загрузка контакта для редактирования
async function loadContactForEdit(id) {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`/api/contacts/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const contact = await response.json();
            console.log('Контакт для редактирования:', contact);

            // Заполняем форму
            document.getElementById('contactFirstName').value = contact.contactFirstName || '';
            document.getElementById('contactLastName').value = contact.contactLastName || '';
            document.getElementById('contactPatronymic').value = contact.contactPatronymic || '';
            document.getElementById('contactPosition').value = contact.contactPosition || '';
            document.getElementById('contactPhoneNumber').value = contact.contactPhoneNumber || '';
            document.getElementById('contactInternalNumber').value = contact.contactInternalNumber || '';
            document.getElementById('contactId').value = contact.contactId || '';

            // Показываем модальное окно
            document.getElementById('modalTitle').textContent = 'Редактировать контакт';
            contactModal.style.display = 'block';
        } else {
            showMessage('Ошибка загрузки контакта', 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки контакта:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    }
}

// Удаление контакта
function deleteContact(id) {
    console.log('Удаление контакта ID:', id);
    currentContactId = id;

    // Получаем имя контакта для отображения
    const contactRow = document.querySelector(`tr:has(button[onclick="deleteContact(${id})"])`);
    if (contactRow) {
        const lastName = contactRow.cells[1].textContent;
        const firstName = contactRow.cells[2].textContent;
        document.getElementById('deleteContactName').textContent = `${lastName} ${firstName}`;
    } else {
        document.getElementById('deleteContactName').textContent = `ID: ${id}`;
    }

    if (deleteModal) {
        deleteModal.style.display = 'block';
    }
}

// Сохранение контакта
async function saveContact() {
    try {
        const token = localStorage.getItem('jwtToken');
        const contactData = {
            contactFirstName: document.getElementById('contactFirstName').value.trim(),
            contactLastName: document.getElementById('contactLastName').value.trim(),
            contactPatronymic: document.getElementById('contactPatronymic').value.trim() || null,
            contactPosition: document.getElementById('contactPosition').value.trim(),
            contactPhoneNumber: document.getElementById('contactPhoneNumber').value.trim(),
            contactInternalNumber: document.getElementById('contactInternalNumber').value.trim() || null
        };

        // Валидация
        if (!contactData.contactFirstName || !contactData.contactLastName ||
            !contactData.contactPosition || !contactData.contactPhoneNumber) {
            showMessage('Заполните обязательные поля (Имя, Фамилия, Должность, Телефон)', 'error');
            return;
        }

        const url = currentContactId
            ? `/api/contacts/${currentContactId}`
            : '/api/contacts';

        const method = currentContactId ? 'PUT' : 'POST';

        console.log('Сохранение контакта:', method, url, contactData);

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
        });

        if (response.ok) {
            const savedContact = await response.json();
            console.log('Контакт сохранен:', savedContact);

            contactModal.style.display = 'none';
            loadContacts();
            showMessage('Контакт сохранен успешно', 'success');
        } else {
            const errorText = await response.text();
            console.error('Ошибка сохранения:', response.status, errorText);
            showMessage('Ошибка сохранения: ' + errorText, 'error');
        }
    } catch (error) {
        console.error('Ошибка сохранения контакта:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    }
}

// Подтверждение удаления контакта
async function confirmDeleteContact() {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`/api/contacts/${currentContactId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            deleteModal.style.display = 'none';
            loadContacts();
            showMessage('Контакт удален успешно', 'success');
        } else {
            const errorText = await response.text();
            console.error('Ошибка удаления:', response.status, errorText);
            showMessage('Ошибка удаления: ' + errorText, 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления контакта:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    }
}

// Обработка поиска
function handleSearch(event) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = event.target.value.trim();
        console.log('Поиск контактов:', query);
        loadContacts(query);
    }, 300);
}

// Показать модальное окно добавления контакта
function showAddContactModal() {
    console.log('Показать модальное окно добавления');
    currentContactId = null;
    if (contactModal) {
        // Сбросить форму
        document.getElementById('contactForm').reset();
        document.getElementById('modalTitle').textContent = 'Добавить контакт';
        contactModal.style.display = 'block';
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
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 5000);
        }
    }
}

// Экспорт функций для глобального использования
window.editContact = editContact;
window.deleteContact = deleteContact;

// Защита от зависания загрузки (на всякий случай)
setTimeout(() => {
    console.log('Автоматическое скрытие загрузки через 5 секунд');
    showLoading(false);
}, 5000);