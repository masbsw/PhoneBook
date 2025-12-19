package com.example.PhoneBook.repositories;

import com.example.PhoneBook.models.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    @Query("SELECT c FROM Contact c WHERE " +
            "LOWER(c.contactFirstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.contactLastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.contactPatronymic) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.contactPosition) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "(c.department IS NOT NULL AND LOWER(c.department.departmentName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Contact> searchContacts(@Param("query") String query);

    List<Contact> findByDepartmentDepartmentId(Long departmentId);
}