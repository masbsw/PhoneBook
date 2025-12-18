package com.example.PhoneBook.controllers;

import com.example.PhoneBook.dto.SigninRequest;
import com.example.PhoneBook.dto.SignupRequest;
import com.example.PhoneBook.models.Role;
import com.example.PhoneBook.models.RoleName;
import com.example.PhoneBook.models.User;
import com.example.PhoneBook.repositories.RoleRepository;
import com.example.PhoneBook.repositories.UserRepository;
import com.example.PhoneBook.security.JwtCore;
import com.example.PhoneBook.security.UserDetailsImpl;
import com.example.PhoneBook.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/auth")
public class SecurityController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtCore jwtCore;


    @PostMapping("/signup")
    ResponseEntity<?> signup(@RequestBody SignupRequest signupRequest) {
        if (userRepository.existsByUserName(signupRequest.getUserName())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Choose different username");
        }
        if (userRepository.existsByUserEmail(signupRequest.getUserEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Choose different email");
        }

        try {
            User user = userService.createUser(signupRequest, List.of(RoleName.ROLE_USER));
            return ResponseEntity.ok("User registered successfully: " + user.getUserName());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/signin")
    ResponseEntity<?> signin(@RequestBody SigninRequest signinRequest) {
        Authentication authentication = null;
        try {
            authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(signinRequest.getUserName(), signinRequest.getUserPassword()));
        } catch (BadCredentialsException e) {
            return new ResponseEntity<>("Invalid username or password", HttpStatus.UNAUTHORIZED);
        }
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtCore.generateToken(authentication);
        return ResponseEntity.ok(jwt);
    }

    @GetMapping("/check-role/{role}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> checkRole(@PathVariable String role, Principal principal) {

        UserDetailsImpl userDetails = (UserDetailsImpl) userService.loadUserByUsername(principal.getName());

        boolean hasRole = userDetails.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(role));

        return ResponseEntity.ok(hasRole);
    }
}