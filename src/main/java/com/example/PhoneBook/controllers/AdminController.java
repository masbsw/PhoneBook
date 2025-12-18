package com.example.PhoneBook.controllers;

import com.example.PhoneBook.dto.SignupRequest;
import com.example.PhoneBook.models.RoleName;
import com.example.PhoneBook.models.User;
import com.example.PhoneBook.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    @Autowired
    private UserService userService;

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/roles")
    public ResponseEntity<?> updateUserRoles(@PathVariable Long id, @RequestBody List<RoleName> roleNames) {
        try {
            User user = userService.updateUserRoles(id, roleNames);
            return ResponseEntity.ok("Roles updated successfully for user: " + user.getUserName());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping("/users/admin")
    public ResponseEntity<?> createAdmin(@RequestBody SignupRequest signupRequest) {
        try {
            User user = userService.createUser(signupRequest, List.of(RoleName.ROLE_ADMIN));
            return ResponseEntity.ok("Admin user created successfully: " + user.getUserName());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/users/super-admin")
    public ResponseEntity<?> createSuperAdmin(@RequestBody SignupRequest signupRequest) {
        try {
            User user = userService.createUser(signupRequest, List.of(RoleName.ROLE_SUPER_ADMIN));
            return ResponseEntity.ok("Super Admin user created successfully: " + user.getUserName());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/users/moderator")
    public ResponseEntity<?> createModerator(@RequestBody SignupRequest signupRequest) {
        try {
            User user = userService.createUser(signupRequest, List.of(RoleName.ROLE_MODERATOR));
            return ResponseEntity.ok("Moderator user created successfully: " + user.getUserName());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        try {
            User user = userService.deactivateUser(id);
            return ResponseEntity.ok("User deactivated: " + user.getUserName());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Long id) {
        try {
            User user = userService.activateUser(id);
            return ResponseEntity.ok("User activated: " + user.getUserName());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }




}