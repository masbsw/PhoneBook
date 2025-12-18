package com.example.PhoneBook.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@Controller
public class MainController {

    @GetMapping(value = {"/", "/phonebook", "/admin", "/users"})
    public String forwardToIndex() {
        return "forward:/index.html";
    }

    @RestController
    @RequestMapping("/secured")
    public static class SecuredController {
        @GetMapping("/user")
        public String userAccess(Principal principal) {
            if (principal == null) {
                return "No authenticated user";
            }
            return principal.getName();
        }
    }
}