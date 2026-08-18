package com.billbeat.service;

import com.billbeat.dto.request.PaperBoyRequest;
import com.billbeat.dto.response.PaperBoyResponse;
import com.billbeat.entity.PaperBoy;
import com.billbeat.entity.User;
import com.billbeat.entity.Vendor;
import com.billbeat.enums.Role;
import com.billbeat.exception.DuplicateResourceException;
import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.repository.PaperBoyRepository;
import com.billbeat.repository.UserRepository;
import com.billbeat.repository.VendorRepository;
import com.billbeat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaperBoyService {

    private final PaperBoyRepository paperBoyRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<PaperBoyResponse> getAllPaperBoys() {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        List<PaperBoy> paperBoys = paperBoyRepository.findAllByVendorId(vendorId);
        return paperBoys.stream().map(this::mapToResponse).toList();
    }

    public PaperBoyResponse getPaperBoyById(Long id) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        PaperBoy paperBoy = paperBoyRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper Boy not found with ID: " + id));
        return mapToResponse(paperBoy);
    }

    @Transactional
    public PaperBoyResponse createPaperBoy(PaperBoyRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        User paperBoyUser = null;
        if (request.isCreateLoginUser() && request.getUsername() != null && !request.getUsername().isBlank()) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken");
            }
            paperBoyUser = User.builder()
                    .username(request.getUsername())
                    .password(passwordEncoder.encode(request.getPassword() != null ? request.getPassword() : "123456"))
                    .role(Role.PAPER_BOY)
                    .enabled(true)
                    .build();
            paperBoyUser = userRepository.save(paperBoyUser);
        }

        PaperBoy paperBoy = PaperBoy.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .vendor(vendor)
                .user(paperBoyUser)
                .active(true)
                .build();

        PaperBoy saved = paperBoyRepository.save(paperBoy);
        return mapToResponse(saved);
    }

    @Transactional
    public PaperBoyResponse updatePaperBoy(Long id, PaperBoyRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        PaperBoy paperBoy = paperBoyRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper Boy not found with ID: " + id));

        paperBoy.setName(request.getName());
        paperBoy.setPhone(request.getPhone());

        PaperBoy updated = paperBoyRepository.save(paperBoy);
        return mapToResponse(updated);
    }

    private PaperBoyResponse mapToResponse(PaperBoy paperBoy) {
        return PaperBoyResponse.builder()
                .id(paperBoy.getId())
                .name(paperBoy.getName())
                .phone(paperBoy.getPhone())
                .active(paperBoy.isActive())
                .userId(paperBoy.getUser() != null ? paperBoy.getUser().getId() : null)
                .username(paperBoy.getUser() != null ? paperBoy.getUser().getUsername() : null)
                .createdAt(paperBoy.getCreatedAt())
                .build();
    }
}
