// DOM элементы
let usersTableBody;
let addAdminBtn;
let backToAdminBtn;
let logoutBtn;
let currentUsername;
let userRoleBadge;
let addAdminModal;
let editRolesModal;
let currentUserId = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы DOM
    usersTableBody = document.getElementById('usersTableBody');
    addAdminBtn = document.getElementById('addAdminBtn');
    backToAdminBtn = document.getElementById('backToAdminBtn');
    logoutBtn = document.getElementById('logoutBtn');
    currentUsername = document.getElementById('currentUsername');
    userRoleBadge = document.getElementById('userRoleBadge');
    
    // Проверяем авторизацию и права доступа
    checkAuthAndLoad();
    
    // Инициализируем модальные окна
    initModals();
    
    // Назначаем обработчики событий
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', showAddAdminModal);
    }
    
    if (backToAdminBtn) {
        backToAdminBtn.addEventListener('click', () => {
            window.location.href = 'admin.html';
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

    // Проверяем, является ли пользователь SUPER_ADMIN через JWT токен
    const userRoles = getCurrentUserRoles();
    if (!userRoles.includes('ROLE_SUPER_ADMIN')) {
        // Если не SUPER_ADMIN, перенаправляем на админ-панель
        window.location.href = 'admin.html';
        return;
    }

    // Отображаем имя пользователя
    currentUsername.textContent = username;

    // Устанавливаем роль как Супер Админ
    if (userRoleBadge) {
        userRoleBadge.textContent = 'Супер Админ';
        userRoleBadge.className = 'role-badge role-super-admin';
    }

    // Загружаем пользователей
    loadUsers();
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

// Инициализация модальных окон
function initModals() {
    // Модальное окно создания администратора
    addAdminModal = document.getElementById('addAdminModal');
    const closeAddAdminModalBtn = document.getElementById('closeAddAdminModalBtn');
    const cancelAddAdminBtn = document.getElementById('cancelAddAdminBtn');
    const saveAdminBtn = document.getElementById('saveAdminBtn');
    
    if (closeAddAdminModalBtn) {
        closeAddAdminModalBtn.addEventListener('click', () => {
            addAdminModal.classList.remove('active');
        });
    }
    
    if (cancelAddAdminBtn) {
        cancelAddAdminBtn.addEventListener('click', () => {
            addAdminModal.classList.remove('active');
        });
    }
    
    if (saveAdminBtn) {
        saveAdminBtn.addEventListener('click', saveAdmin);
    }
    
    // Модальное окно изменения ролей
    editRolesModal = document.getElementById('editRolesModal');
    const closeEditRolesModalBtn = document.getElementById('closeEditRolesModalBtn');
    const cancelEditRolesBtn = document.getElementById('cancelEditRolesBtn');
    const saveRolesBtn = document.getElementById('saveRolesBtn');
    
    if (closeEditRolesModalBtn) {
        closeEditRolesModalBtn.addEventListener('click', () => {
            editRolesModal.classList.remove('active');
        });
    }
    
    if (cancelEditRolesBtn) {
        cancelEditRolesBtn.addEventListener('click', () => {
            editRolesModal.classList.remove('active');
        });
    }
    
    if (saveRolesBtn) {
        saveRolesBtn.addEventListener('click', saveUserRoles);
    }
    
    // Закрытие модальных окон при клике вне их
    window.addEventListener('click', (event) => {
        if (event.target === addAdminModal) {
            addAdminModal.classList.remove('active');
        }
        if (event.target === editRolesModal) {
            editRolesModal.classList.remove('active');
        }
    });
}

// Загрузка пользователей
async function loadUsers() {
    showLoading(true);
    
    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else if (response.status === 403) {
            showMessage('У вас нет прав для просмотра пользователей', 'error');
        } else {
            showMessage('Ошибка при загрузке пользователей', 'error');
        }
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    } finally {
        showLoading(false);
    }
}

// Отображение пользователей в таблице
function displayUsers(users) {
    if (!usersTableBody) return;
    
    // Очищаем таблицу
    usersTableBody.innerHTML = '';
    
    // Показываем сообщение, если пользователей нет
    const noUsersMessage = document.getElementById('noUsersMessage');
    if (noUsersMessage) {
        if (!users || users.length === 0) {
            noUsersMessage.style.display = 'block';
            return;
        } else {
            noUsersMessage.style.display = 'none';
        }
    }
    
    // Добавляем пользователей в таблицу
    users.forEach(user => {
        const row = document.createElement('tr');
        
        // Получаем роли пользователя
        const roles = user.userRoles ? user.userRoles.map(role => role.roleName) : [];
        const rolesDisplay = roles.join(', ').replace(/ROLE_/g, '');
        
        // Определяем статус пользователя
        const status = user.isActive ? 'Активен' : 'Неактивен';
        const statusClass = user.isActive ? 'status-active' : 'status-inactive';
        
        // Определяем, какие кнопки действий показывать
        // Не показываем кнопки для текущего пользователя (superadmin)
        const isCurrentUser = user.userName === 'superadmin';
        
        row.innerHTML = `
            <td>${user.userId || ''}</td>
            <td>${user.userName || ''}</td>
            <td>${user.userEmail || ''}</td>
            <td><span class="${statusClass}">${status}</span></td>
            <td>${rolesDisplay}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-sm edit-roles-btn" data-id="${user.userId}" data-username="${user.userName}" ${isCurrentUser ? 'disabled' : ''}>
                        <i class="fas fa-user-tag"></i>
                    </button>
                    <button class="btn btn-warning btn-sm toggle-status-btn" data-id="${user.userId}" data-username="${user.userName}" data-active="${user.isActive}" ${isCurrentUser ? 'disabled' : ''}>
                        <i class="fas fa-power-off"></i>
                    </button>
                </div>
            </td>
        `;
        
        usersTableBody.appendChild(row);
        
        // Назначаем обработчики для кнопок
        const editRolesBtn = row.querySelector('.edit-roles-btn');
        const toggleStatusBtn = row.querySelector('.toggle-status-btn');
        
        if (editRolesBtn && !isCurrentUser) {
            editRolesBtn.addEventListener('click', () => showEditRolesModal(user));
        }
        
        if (toggleStatusBtn && !isCurrentUser) {
            toggleStatusBtn.addEventListener('click', () => toggleUserStatus(user));
        }
    });
}

// Показать модальное окно создания администратора
function showAddAdminModal() {
    // Очищаем форму
    document.getElementById('addAdminForm').reset();
    
    // Устанавливаем значения по умолчанию для чекбоксов
    document.getElementById('roleAdmin').checked = true;
    document.getElementById('roleModerator').checked = false;
    document.getElementById('roleUser').checked = true;
    
    addAdminModal.classList.add('active');
}

// Создание администратора
async function saveAdmin() {
    // Собираем данные из формы
    const username = document.getElementById('adminUsername').value;
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    
    // Собираем выбранные роли
    const selectedRoles = [];
    if (document.getElementById('roleAdmin').checked) selectedRoles.push('ROLE_ADMIN');
    if (document.getElementById('roleModerator').checked) selectedRoles.push('ROLE_MODERATOR');
    // ROLE_USER добавляется всегда
    selectedRoles.push('ROLE_USER');
    
    // Валидация
    if (!username || !email || !password || !confirmPassword) {
        showMessage('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Пароли не совпадают', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }
    
    if (selectedRoles.length === 0) {
        showMessage('Выберите хотя бы одну роль для пользователя', 'error');
        return;
    }
    
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    
    try {
        // Сначала создаем пользователя
        const createResponse = await fetch(`${API_BASE_URL}/api/admin/users/admin`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userName: username,
                userPassword: password,
                userEmail: email
            })
        });
        
        if (createResponse.ok) {
            // Если пользователь создан успешно, находим его ID и устанавливаем роли
            const usersResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                const newUser = users.find(u => u.userName === username);
                
                if (newUser) {
                    // Устанавливаем роли для нового пользователя
                    const rolesResponse = await fetch(`${API_BASE_URL}/api/admin/users/${newUser.userId}/roles`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(selectedRoles)
                    });
                    
                    if (rolesResponse.ok) {
                        showMessage(`Администратор ${username} успешно создан!`, 'success');
                        addAdminModal.classList.remove('active');
                        loadUsers();
                    } else {
                        showMessage('Ошибка при установке ролей для пользователя', 'error');
                    }
                } else {
                    showMessage('Пользователь создан, но не найден в списке', 'error');
                }
            } else {
                showMessage('Ошибка при получении списка пользователей', 'error');
            }
        } else if (createResponse.status === 400) {
            const errorText = await createResponse.text();
            if (errorText.includes("Choose different username")) {
                showMessage('Имя пользователя уже занято. Выберите другое.', 'error');
            } else {
                showMessage(errorText, 'error');
            }
        } else {
            showMessage('Ошибка при создании администратора', 'error');
        }
    } catch (error) {
        console.error('Ошибка при создании администратора:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    }
}

// Показать модальное окно изменения ролей
function showEditRolesModal(user) {
    const editRolesUsername = document.getElementById('editRolesUsername');
    if (editRolesUsername) editRolesUsername.textContent = user.userName;
    
    // Заполняем поле с ID пользователя
    document.getElementById('editRolesUserId').value = user.userId;
    
    // Получаем текущие роли пользователя
    const currentRoles = user.userRoles ? user.userRoles.map(role => role.roleName) : [];
    
    // Устанавливаем чекбоксы в соответствии с текущими ролями
    document.getElementById('editRoleAdmin').checked = currentRoles.includes('ROLE_ADMIN');
    document.getElementById('editRoleModerator').checked = currentRoles.includes('ROLE_MODERATOR');
    document.getElementById('editRoleUser').checked = true; // ROLE_USER всегда есть
    
    currentUserId = user.userId;
    editRolesModal.classList.add('active');
}

// Сохранение ролей пользователя
async function saveUserRoles() {
    const userId = document.getElementById('editRolesUserId').value;
    const username = document.getElementById('editRolesUsername').textContent;
    
    // Собираем выбранные роли
    const selectedRoles = [];
    if (document.getElementById('editRoleAdmin').checked) selectedRoles.push('ROLE_ADMIN');
    if (document.getElementById('editRoleModerator').checked) selectedRoles.push('ROLE_MODERATOR');
    // ROLE_USER добавляется всегда
    selectedRoles.push('ROLE_USER');
    
    if (selectedRoles.length === 0) {
        showMessage('Выберите хотя бы одну роль для пользователя', 'error');
        return;
    }
    
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/roles`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(selectedRoles)
        });
        
        if (response.ok) {
            showMessage(`Роли пользователя ${username} успешно обновлены!`, 'success');
            editRolesModal.classList.remove('active');
            loadUsers();
        } else {
            showMessage('Ошибка при обновлении ролей пользователя', 'error');
        }
    } catch (error) {
        console.error('Ошибка при обновлении ролей пользователя:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    }
}

// Переключение статуса пользователя (активен/неактивен)
async function toggleUserStatus(user) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    
    // Не позволяем деактивировать себя
    if (user.userName === 'superadmin') {
        showMessage('Вы не можете изменить статус супер-администратора', 'error');
        return;
    }
    
    try {
        const endpoint = user.isActive ? 'deactivate' : 'activate';
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${user.userId}/${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const message = await response.text();
            showMessage(message, 'success');
            loadUsers();
        } else {
            showMessage('Ошибка при изменении статуса пользователя', 'error');
        }
    } catch (error) {
        console.error('Ошибка при изменении статуса пользователя:', error);
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