package com.billbeat.controller;

import com.billbeat.dto.request.LoginRequest;
import com.billbeat.dto.request.VendorRegisterRequest;
import com.billbeat.dto.response.ApiResponse;
import com.billbeat.dto.response.AuthResponse;
import com.billbeat.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user login and vendor registration")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "User Login", description = "Authenticates user credentials and returns JWT bearer token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register-vendor")
    @Operation(summary = "Register New Vendor", description = "Registers a new newspaper vendor and creates their admin user account")
    public ResponseEntity<ApiResponse<AuthResponse>> registerVendor(@Valid @RequestBody VendorRegisterRequest request) {
        AuthResponse response = authService.registerVendor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vendor registered successfully", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get Current User Info", description = "Returns details of the currently authenticated user session")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser() {
        AuthResponse response = authService.getCurrentUserInfo();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
