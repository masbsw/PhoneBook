package com.example.PhoneBook.services;

import com.example.PhoneBook.dto.SignupRequest;
import com.example.PhoneBook.models.Role;
import com.example.PhoneBook.models.RoleName;
import com.example.PhoneBook.models.User;
import com.example.PhoneBook.repositories.RoleRepository;
import com.example.PhoneBook.repositories.UserRepository;
import com.example.PhoneBook.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String userName) throws UsernameNotFoundException {
        User user = userRepository.findByUserName(userName).orElseThrow(() -> new UsernameNotFoundException(
                String.format("User '%s' not found", userName)
        ));
        return UserDetailsImpl.build(user);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(SignupRequest signupRequest, List<RoleName> roles) {
        if (userRepository.existsByUserName(signupRequest.getUserName())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByUserEmail(signupRequest.getUserEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUserName(signupRequest.getUserName());
        user.setUserPassword(passwordEncoder.encode(signupRequest.getUserPassword()));
        user.setUserEmail(signupRequest.getUserEmail());
        user.setIsActive(true);

        List<Role> userRoles = roleRepository.findByRoleNameIn(roles);
        user.setUserRoles(userRoles);

        return userRepository.save(user);
    }

    public User updateUserRoles(Long userId, List<RoleName> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        List<Role> roles = roleRepository.findByRoleNameIn(roleNames);
        user.setUserRoles(roles);

        return userRepository.save(user);
    }

    public User deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setIsActive(false);
        return userRepository.save(user);
    }

    public User activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setIsActive(true);
        return userRepository.save(user);
    }
}