package com.example.PhoneBook.controllers;

import com.example.PhoneBook.models.Contact;
import com.example.PhoneBook.services.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {
    @Autowired
    private ContactService contactService;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public List<Contact> getAllContacts() {
        return contactService.findAll();
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public List<Contact> getContactsByDepartment(@PathVariable Long departmentId) {
        return contactService.findByDepartmentId(departmentId);
    }

    @GetMapping("/department/{departmentId}/simple")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public List<Map<String, Object>> getContactsByDepartmentSimple(@PathVariable Long departmentId) {
        List<Contact> contacts = contactService.findByDepartmentId(departmentId);

        return contacts.stream()
                .map(contact -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("contactId", contact.getContactId());
                    map.put("firstName", contact.getContactFirstName());
                    map.put("lastName", contact.getContactLastName());
                    map.put("patronymic", contact.getContactPatronymic());
                    map.put("position", contact.getContactPosition());
                    map.put("phone", contact.getContactPhoneNumber());
                    map.put("internal", contact.getContactInternalNumber());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public List<Contact> searchContacts(@RequestParam String query) {
        return contactService.searchContacts(query);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Contact> getContactById(@PathVariable Long id) {
        return contactService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public Contact createContact(@RequestBody Contact contact) {
        return contactService.save(contact);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Contact> updateContact(@PathVariable Long id, @RequestBody Contact contactDetails) {
        try {
            Contact updatedContact = contactService.update(id, contactDetails);
            return ResponseEntity.ok(updatedContact);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> deleteContact(@PathVariable Long id) {
        try {
            contactService.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}