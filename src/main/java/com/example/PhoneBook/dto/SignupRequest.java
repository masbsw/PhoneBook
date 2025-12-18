package com.example.PhoneBook.dto;


import lombok.Data;

@Data
public class SignupRequest {
    private String userName;
    private String userPassword;
    private String userEmail;
}
