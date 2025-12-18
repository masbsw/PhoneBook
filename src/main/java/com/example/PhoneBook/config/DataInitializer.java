package com.example.PhoneBook.config;

import com.example.PhoneBook.dto.SignupRequest;
import com.example.PhoneBook.models.Contact;
import com.example.PhoneBook.models.RoleName;
import com.example.PhoneBook.services.ContactService;
import com.example.PhoneBook.services.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserService userService;
    private final ContactService contactService;

    public DataInitializer(UserService userService, ContactService contactService) {
        this.userService = userService;
        this.contactService = contactService;
    }

    @Override
    public void run(String... args) throws Exception {
        createSuperAdmin();
        createTestUsers();
        createTestContacts();
    }

    private void createSuperAdmin() {
        try {
            userService.loadUserByUsername("superadmin");
            System.out.println("SuperAdmin already exists: superadmin");
        } catch (Exception e) {
            SignupRequest request = new SignupRequest();
            request.setUserName("superadmin");
            request.setUserPassword("admin123");
            request.setUserEmail("superadmin@company.com");

            userService.createUser(request, List.of(RoleName.ROLE_SUPER_ADMIN));
            System.out.println("Created SuperAdmin: superadmin / admin123");
        }
    }

    private void createTestUsers() {
        createTestUser("admin", "admin123", "admin@test.com", List.of(RoleName.ROLE_ADMIN));
        createTestUser("moderator", "moderator123", "moderator@test.com", List.of(RoleName.ROLE_MODERATOR));
        createTestUser("user", "user123", "user@test.com", List.of(RoleName.ROLE_USER));
    }

    private void createTestUser(String username, String password, String email, List<RoleName> roles) {
        try {
            userService.loadUserByUsername(username);
            System.out.println("User already exists: " + username);
        } catch (Exception e) {
            SignupRequest request = new SignupRequest();
            request.setUserName(username);
            request.setUserPassword(password);
            request.setUserEmail(email);
            userService.createUser(request, roles);
            System.out.println("Created user: " + username + " / " + password);
        }
    }

    private void createTestContacts() {
        if (contactService.findAll().isEmpty()) {
            List<Contact> testContacts = Arrays.asList(
                    createContact("Иван", "Иванов", "Иванович", "Директор", "+7-999-111-22-33", "101"),
                    createContact("Петр", "Петров", "Петрович", "Менеджер", "+7-999-222-33-44", "102"),
                    createContact("Мария", "Сидорова", "Ивановна", "Бухгалтер", "+7-999-333-44-55", "103")
            );

            testContacts.forEach(contactService::save);
            System.out.println("Created " + testContacts.size() + " test contacts");
        } else {
            System.out.println("Contacts already exist");
        }
    }

    private Contact createContact(String firstName, String lastName, String patronymic,
                                  String position, String phone, String internal) {
        Contact contact = new Contact();
        contact.setContactFirstName(firstName);
        contact.setContactLastName(lastName);
        contact.setContactPatronymic(patronymic);
        contact.setContactPosition(position);
        contact.setContactPhoneNumber(phone);
        contact.setContactInternalNumber(internal);
        return contact;
    }
}