package com.example.PhoneBook.controllers;

import com.example.PhoneBook.models.Department;
import com.example.PhoneBook.services.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public List<Department> getAllDepartments() {
        return departmentService.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        if (departmentService.existsByName(department.getDepartmentName())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        Department saved = departmentService.save(department);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        try {
            departmentService.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot delete department");
        }
    }
}