package com.billbeat.service;

import com.billbeat.dto.request.LoginRequest;
import com.billbeat.dto.request.VendorRegisterRequest;
import com.billbeat.dto.response.AuthResponse;
import com.billbeat.entity.User;
import com.billbeat.entity.Vendor;
import com.billbeat.enums.Role;
import com.billbeat.exception.DuplicateResourceException;
import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.repository.UserRepository;
import com.billbeat.repository.VendorRepository;
import com.billbeat.security.JwtTokenProvider;
import com.billbeat.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        String businessName = null;
        if (principal.getVendorId() != null) {
            businessName = vendorRepository.findById(principal.getVendorId())
                    .map(Vendor::getBusinessName)
                    .orElse(null);
        }

        Role role = Role.valueOf(principal.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""));

        return AuthResponse.builder()
                .token(token)
                .userId(principal.getId())
                .username(principal.getUsername())
                .role(role)
                .vendorId(principal.getVendorId())
                .businessName(businessName)
                .paperBoyId(principal.getPaperBoyId())
                .build();
    }

    @Transactional
    public AuthResponse registerVendor(VendorRegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.VENDOR)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);

        Vendor vendor = Vendor.builder()
                .businessName(request.getBusinessName())
                .ownerName(request.getOwnerName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .user(savedUser)
                .build();

        Vendor savedVendor = vendorRepository.save(vendor);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .role(Role.VENDOR)
                .vendorId(savedVendor.getId())
                .businessName(savedVendor.getBusinessName())
                .build();
    }

    public AuthResponse getCurrentUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResourceNotFoundException("No authenticated user session found");
        }

        String businessName = null;
        if (principal.getVendorId() != null) {
            businessName = vendorRepository.findById(principal.getVendorId())
                    .map(Vendor::getBusinessName)
                    .orElse(null);
        }

        Role role = Role.valueOf(principal.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""));

        return AuthResponse.builder()
                .userId(principal.getId())
                .username(principal.getUsername())
                .role(role)
                .vendorId(principal.getVendorId())
                .businessName(businessName)
                .paperBoyId(principal.getPaperBoyId())
                .build();
    }
}
