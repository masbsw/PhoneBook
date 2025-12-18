package com.example.PhoneBook.config;

import com.example.PhoneBook.dto.SignupRequest;
import com.example.PhoneBook.models.Contact;
import com.example.PhoneBook.models.Role;
import com.example.PhoneBook.models.RoleName;
import com.example.PhoneBook.models.User;
import com.example.PhoneBook.services.ContactService;
import com.example.PhoneBook.services.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import com.example.PhoneBook.repositories.RoleRepository;
import com.example.PhoneBook.repositories.UserRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserService userService;
    private final ContactService contactService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.superadmin.username:superadmin}")
    private String superadminUsername;

    @Value("${app.superadmin.password:admin123}")
    private String superadminPassword;

    @Value("${app.superadmin.email:superadmin@company.com}")
    private String superadminEmail;

    @Value("${app.create-test-users:true}")
    private boolean createTestUsers;

    @Value("${app.create-test-contacts:true}")
    private boolean createTestContacts;

    public DataInitializer(UserService userService, ContactService contactService, RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.contactService = contactService;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Superadmin username: " + superadminUsername);
        System.out.println("Create test users: " + createTestUsers);
        System.out.println("Create test contacts: " + createTestContacts);

        createRoles();

        createSuperAdmin();

        if (createTestUsers) {
            createTestUsers();
        }

        if (createTestContacts) {
            createTestContacts();
        }

        System.out.println("=== DataInitializer finished ===");
    }

    private void createRoles() {
        System.out.println("Creating roles...");

        for (RoleName roleName : RoleName.values()) {
            if (!roleRepository.existsByRoleName(roleName)) {
                Role role = new Role();
                role.setRoleName(roleName);
                role.setRoleDescription("System role: " + roleName);
                roleRepository.save(role);
                System.out.println("Created role: " + roleName);
            }
        }
        System.out.println("Roles check completed");
    }

    private void createSuperAdmin() {
        System.out.println("Creating SuperAdmin...");

        try {
            userService.loadUserByUsername(superadminUsername);
            System.out.println("SuperAdmin already exists: " + superadminUsername);

            Optional<User> superAdminOpt = userRepository.findByUserName(superadminUsername);
            if (superAdminOpt.isPresent()) {
                User superAdmin = superAdminOpt.get();
                if (superAdmin.getUserRoles() == null || superAdmin.getUserRoles().isEmpty()) {
                    System.out.println("SuperAdmin has no roles! Fixing...");

                    List<Role> allRoles = roleRepository.findAll();
                    superAdmin.setUserRoles(allRoles);
                    userRepository.save(superAdmin);
                    System.out.println("Added all roles to SuperAdmin");
                }
            }
        } catch (Exception e) {
            System.out.println("Creating new SuperAdmin...");

            SignupRequest request = new SignupRequest();
            request.setUserName(superadminUsername);
            request.setUserPassword(superadminPassword);
            request.setUserEmail(superadminEmail);

            List<Role> allRoles = roleRepository.findAll();
            if (allRoles.isEmpty()) {
                throw new RuntimeException("No roles found in database! Run createRoles() first!");
            }

            User user = new User();
            user.setUserName(superadminUsername);
            user.setUserPassword(passwordEncoder.encode(superadminPassword));
            user.setUserEmail(superadminEmail);
            user.setIsActive(true);
            user.setUserRoles(allRoles);

            userRepository.save(user);
            System.out.println("Created SuperAdmin: " + superadminUsername + " with " + allRoles.size() + " roles");
        }
    }

    private void createTestUsers() {
        System.out.println("Creating test users...");

        createTestUser("admin", "admin123", "admin@test.com", List.of(RoleName.ROLE_ADMIN));
        createTestUser("moderator", "moderator123", "moderator@test.com", List.of(RoleName.ROLE_MODERATOR));
        createTestUser("user", "user123", "user@test.com", List.of(RoleName.ROLE_USER));

        System.out.println("Test users created");
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
            System.out.println("Creating test contacts...");

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