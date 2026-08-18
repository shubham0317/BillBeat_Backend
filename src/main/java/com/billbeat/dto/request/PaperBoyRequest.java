package com.billbeat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaperBoyRequest {

    @NotBlank(message = "Paper Boy name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private boolean createLoginUser = false;
    private String username;
    private String password;
}
