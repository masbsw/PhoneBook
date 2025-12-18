package com.example.PhoneBook.models;

public enum RoleName {
    ROLE_USER,          // Обычный пользователь - только просмотр телефонной книги
    ROLE_MODERATOR,     // Модератор - просмотр и редактирование контактов
    ROLE_ADMIN,         // Администратор - полное управление контактами
    ROLE_SUPER_ADMIN    // Супер-админ - управление всем + другими админами
}


