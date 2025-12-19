package com.example.PhoneBook.services;

import com.example.PhoneBook.models.Contact;
import com.example.PhoneBook.models.Department;
import com.example.PhoneBook.repositories.ContactRepository;
import com.example.PhoneBook.repositories.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ContactService {

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<Contact> findAll() {
        return contactRepository.findAll();
    }

    public List<Contact> searchContacts(String query) {
        return contactRepository.searchContacts(query);
    }

    public Optional<Contact> findById(Long id) {
        return contactRepository.findById(id);
    }

    public Contact save(Contact contact) {
        if (contact.getDepartment() != null && contact.getDepartment().getDepartmentId() != null) {
            Department dept = departmentRepository.findById(contact.getDepartment().getDepartmentId())
                    .orElse(null);
            contact.setDepartment(dept);
        }
        return contactRepository.save(contact);
    }

    public Contact update(Long id, Contact contactDetails) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found with id: " + id));

        contact.setContactFirstName(contactDetails.getContactFirstName());
        contact.setContactLastName(contactDetails.getContactLastName());
        contact.setContactPatronymic(contactDetails.getContactPatronymic());
        contact.setContactPosition(contactDetails.getContactPosition());
        contact.setContactPhoneNumber(contactDetails.getContactPhoneNumber());
        contact.setContactInternalNumber(contactDetails.getContactInternalNumber());

        if (contactDetails.getDepartment() != null && contactDetails.getDepartment().getDepartmentId() != null) {
            Department dept = departmentRepository.findById(contactDetails.getDepartment().getDepartmentId())
                    .orElse(null);
            contact.setDepartment(dept);
        } else {
            contact.setDepartment(null);
        }

        return contactRepository.save(contact);
    }

    public void deleteById(Long id) {
        if (!contactRepository.existsById(id)) {
            throw new RuntimeException("Contact not found with id: " + id);
        }
        contactRepository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return contactRepository.existsById(id);
    }

    public List<Contact> findByDepartmentId(Long departmentId) {
        return contactRepository.findByDepartmentDepartmentId(departmentId);
    }
}