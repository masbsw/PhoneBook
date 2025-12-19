package com.example.PhoneBook.services;


import com.example.PhoneBook.models.Department;
import com.example.PhoneBook.repositories.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<Department> findAll() {
        return departmentRepository.findAllByOrderByDepartmentNameAsc();
    }
    public Optional<Department> findById(Long id) {
        return departmentRepository.findById(id);
    }

    public Department save(Department department) {
        return departmentRepository.save(department);
    }

    public void deleteById(Long id) {
        departmentRepository.deleteById(id);
    }

    public boolean existsByName(String name) {
        return departmentRepository.existsByDepartmentName(name);
    }
}
