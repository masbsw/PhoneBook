package com.example.PhoneBook.controllers;

import com.example.PhoneBook.models.Department;
import com.example.PhoneBook.repositories.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private DepartmentRepository departmentRepository;

    @GetMapping("/departments/count")
    public ResponseEntity<?> getDepartmentsCount() {
        long count = departmentRepository.count();
        return ResponseEntity.ok("Total departments: " + count);
    }

    @GetMapping("/departments/list")
    public ResponseEntity<?> getAllDepartmentsSimple() {
        List<Department> departments = departmentRepository.findAll();
        List<Map<String, Object>> result = departments.stream()
                .map(dept -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", dept.getDepartmentId());
                    map.put("name", dept.getDepartmentName());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
