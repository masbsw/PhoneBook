package com.example.PhoneBook.controllers;

import com.example.PhoneBook.dto.DepartmentDTO;
import com.example.PhoneBook.models.Department;
import com.example.PhoneBook.services.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public List<DepartmentDTO> getAllDepartments() {
        return departmentService.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<DepartmentDTO> createDepartment(@RequestBody DepartmentDTO departmentDTO) {
        if (departmentService.existsByName(departmentDTO.getDepartmentName())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }

        Department department = new Department();
        department.setDepartmentName(departmentDTO.getDepartmentName());
        department.setDescription(departmentDTO.getDescription());

        Department saved = departmentService.save(department);
        return ResponseEntity.ok(convertToDTO(saved));
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

    private DepartmentDTO convertToDTO(Department department) {
        DepartmentDTO dto = new DepartmentDTO();
        dto.setDepartmentId(department.getDepartmentId());
        dto.setDepartmentName(department.getDepartmentName());
        dto.setDescription(department.getDescription());
        return dto;
    }
}