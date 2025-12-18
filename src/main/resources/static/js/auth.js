// Базовый URL API
const API_BASE_URL = '';

// Состояние приложения
let currentUser = null;
let currentToken = null;

// DOM элементы
document.addEventListener('DOMContentLoaded', function() {
    console.log('auth.js: DOM загружен');

    // Переключение между табами входа и регистрации
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginTab && registerTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            clearMessage();
        });

        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
            clearMessage();
        });
    }

    // Обработка формы входа
    const loginFormElement = document.getElementById('loginForm');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }

    // Обработка формы регистрации
    const registerFormElement = document.getElementById('registerForm');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', handleRegister);
    }
});

// Функция для отображения сообщений
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

// Функция для очистки сообщений
function clearMessage() {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.style.display = 'none';
    }
}

// Функция для показа/скрытия индикатора загрузки
function setLoading(isLoading) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
    }
}

// Обработка входа
async function handleLogin(event) {
    event.preventDefault();
    event.stopImmediatePropagation(); // Важно: останавливаем всплытие

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showMessage('Пожалуйста, заполните все поля', 'error');
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(`/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userName: username,
                userPassword: password
            })
        });

        if (response.ok) {
            const token = await response.text();
            console.log('Получен токен, длина:', token.length);

            // Сохраняем токен и имя пользователя
            localStorage.setItem('jwtToken', token);
            localStorage.setItem('currentUser', username); // Сохраняем имя сразу

            // НЕМЕДЛЕННОЕ перенаправление без задержки
            console.log('Немедленное перенаправление на /phonebook.html');

            // Используем replace и не показываем сообщение
            window.location.replace('/phonebook.html');

            return; // Важно: выходим сразу

        } else if (response.status === 401) {
            showMessage('Неверное имя пользователя или пароль', 'error');
        } else {
            const errorText = await response.text();
            console.error('Ошибка входа:', response.status, errorText);
            showMessage(`Ошибка при входе: ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка при входе:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    } finally {
        setLoading(false);
    }
}

// Обработка регистрации
async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Валидация
    if (!username || !email || !password || !confirmPassword) {
        showMessage('Пожалуйста, заполните все поля', 'error');
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

    setLoading(true);

    try {
        const response = await fetch(`/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userName: username,
                userPassword: password,
                userEmail: email
            })
        });

        if (response.ok) {
            showMessage('Пользователь успешно зарегистрирован! Теперь вы можете войти в систему.', 'success');

            // Очистка формы
            document.getElementById('registerForm').reset();

            // Переключение на вкладку входа
            document.getElementById('login-tab').click();
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = password;

        } else if (response.status === 400) {
            const errorText = await response.text();
            if (errorText.includes("Choose different username")) {
                showMessage('Имя пользователя уже занято. Выберите другое.', 'error');
            } else {
                showMessage(errorText, 'error');
            }
        } else {
            showMessage('Ошибка при регистрации. Попробуйте еще раз.', 'error');
        }
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    } finally {
        setLoading(false);
    }
}

// Получение информации о текущем пользователе
async function fetchCurrentUser(token) {
    try {
        const response = await fetch(`/secured/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const username = await response.text();
            console.log('Текущий пользователь:', username);
            currentUser = username;
            localStorage.setItem('currentUser', username);
            localStorage.setItem('lastLogin', Date.now());
        } else {
            console.error('Ошибка получения информации о пользователе:', response.status);
            localStorage.removeItem('currentUser');
        }
    } catch (error) {
        console.error('Ошибка при получении информации о пользователе:', error);
    }
}

// Проверка статуса аутентификации
async function checkAuthStatus() {
    const token = localStorage.getItem('jwtToken');
    const savedUser = localStorage.getItem('currentUser');

    console.log('checkAuthStatus:', {
        token: token ? 'есть (' + token.length + ' символов)' : 'нет',
        user: savedUser || 'нет'
    });

    if (!token || !savedUser) {
        return; // Нет токена - остаемся на странице входа
    }

    // Проверяем валидность токена на сервере
    try {
        const response = await fetch(`/secured/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Токен валидный - перенаправляем на телефонную книгу
            console.log('Токен валиден, перенаправляем на /phonebook.html');
            window.location.href = '/phonebook.html';
        } else {
            // Токен невалидный - очищаем localStorage
            console.log('Токен невалидный, статус:', response.status);
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('currentUser');
            showMessage('Сессия истекла. Пожалуйста, войдите снова.', 'error');
        }
    } catch (error) {
        console.error('Ошибка проверки токена:', error);
        // Очищаем токен при ошибке сети
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('currentUser');
    }
}

// Функция для декодирования JWT токена
function parseJwt(token) {
    if (!token) return null;

    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Ошибка декодирования JWT:', error);
        return null;
    }
}

// Функция для проверки наличия роли
function hasRole(role) {
    const roles = getUserRoles();
    return roles.includes(role);
}

// Функция для получения всех ролей пользователя
function getUserRoles() {
    const token = localStorage.getItem('jwtToken');

    if (!token) return [];

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.roles) return [];

    return decodedToken.roles;
}

// Функция для получения userId из токена
function getUserId() {
    const token = localStorage.getItem('jwtToken');

    if (!token) return null;

    const decodedToken = parseJwt(token);
    if (!decodedToken) return null;

    return decodedToken.userId || null;
}

// Функция для отладки - показывает содержимое JWT токена
function debugJwtToken() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        console.log('Нет JWT токена');
        return;
    }

    const decoded = parseJwt(token);
    console.log('=== ДЕБАГ JWT ТОКЕНА ===');
    console.log('Декодированный JWT токен:', decoded);
    console.log('Роли пользователя:', decoded?.roles);
    console.log('ID пользователя:', decoded?.userId);
    console.log('Имя пользователя:', decoded?.sub);
    console.log('========================');
}

// Функция для выхода из системы
function logout() {
    console.log('Выход из системы');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastLogin');
    currentToken = null;
    currentUser = null;
    window.location.href = '/';
}

// Функция для получения токена
function getToken() {
    return localStorage.getItem('jwtToken');
}

// Экспорт функций для использования в других файлах
window.auth = {
    getToken,
    hasRole,
    getUserRoles,
    getUserId,
    logout,
    fetchCurrentUser,
    debugJwtToken,
    parseJwt,
    checkAuthStatus
};