package com.example.PhoneBook.config;

import com.example.PhoneBook.dto.SignupRequest;
import com.example.PhoneBook.models.Contact;
import com.example.PhoneBook.models.Department;
import com.example.PhoneBook.models.RoleName;
import com.example.PhoneBook.repositories.DepartmentRepository;
import com.example.PhoneBook.services.ContactService;
import com.example.PhoneBook.services.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserService userService;
    private final ContactService contactService;
    private final DepartmentRepository departmentRepository;

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

    public DataInitializer(UserService userService, ContactService contactService,
                           DepartmentRepository departmentRepository) {
        this.userService = userService;
        this.contactService = contactService;
        this.departmentRepository = departmentRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== DataInitializer started ===");

        createTestDepartments();

        createSuperAdmin();

        if (createTestUsers) {
            createTestUsers();
        }

        if (createTestContacts) {
            createTestContacts();
        }

        System.out.println("=== DataInitializer finished ===");
    }

    private void createTestDepartments() {
        System.out.println("Creating test departments...");

        List<String> departments = Arrays.asList(
                "Бухгалтерия",
                "Департамент экономики и финансов",
                "Департамент IT",
                "Технологический департамент",
                "Правовой департамент",
                "Производственно-технический департамент",
                "Департамент главного энергетика"

        );

        for (String deptName : departments) {
            if (!departmentRepository.existsByDepartmentName(deptName)) {
                Department dept = new Department();
                dept.setDepartmentName(deptName);
                dept.setDescription("Тестовый отдел: " + deptName);
                departmentRepository.save(dept);
                System.out.println("Created department: " + deptName);
            }
        }

        System.out.println("Test departments created");
    }

    private void createSuperAdmin() {
        try {
            userService.loadUserByUsername(superadminUsername);
            System.out.println("SuperAdmin already exists: " + superadminUsername);
        } catch (Exception e) {
            SignupRequest request = new SignupRequest();
            request.setUserName(superadminUsername);
            request.setUserPassword(superadminPassword);
            request.setUserEmail(superadminEmail);

            userService.createUser(request, List.of(RoleName.ROLE_SUPER_ADMIN));
            System.out.println("Created SuperAdmin: " + superadminUsername + " / " + superadminPassword);
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

            List<Department> allDepartments = departmentRepository.findAll();

            List<Contact> testContacts = Arrays.asList(
                    createContact("Иван", "Иванов", "Иванович", "Директор", "+7-999-111-22-33", "101",
                            allDepartments.stream().filter(d -> d.getDepartmentName().equals("Департамент главного энергетика")).findFirst().orElse(null)),
                    createContact("Петр", "Петров", "Петрович", "Менеджер", "+7-999-222-33-44", "102",
                            allDepartments.stream().filter(d -> d.getDepartmentName().equals("Департамент IT")).findFirst().orElse(null)),
                    createContact("Мария", "Сидорова", "Ивановна", "Бухгалтер", "+7-999-333-44-55", "103",
                            allDepartments.stream().filter(d -> d.getDepartmentName().equals("Бухгалтерия")).findFirst().orElse(null))
            );

            testContacts.forEach(contactService::save);
            System.out.println("Created " + testContacts.size() + " test contacts");
        } else {
            System.out.println("Contacts already exist");
        }
    }

    private Contact createContact(String firstName, String lastName, String patronymic,
                                  String position, String phone, String internal, Department department) {
        Contact contact = new Contact();
        contact.setContactFirstName(firstName);
        contact.setContactLastName(lastName);
        contact.setContactPatronymic(patronymic);
        contact.setContactPosition(position);
        contact.setContactPhoneNumber(phone);
        contact.setContactInternalNumber(internal);
        contact.setDepartment(department);
        return contact;
    }
}