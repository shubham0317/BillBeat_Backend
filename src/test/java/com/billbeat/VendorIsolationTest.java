package com.billbeat;

import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.repository.BeatRepository;
import com.billbeat.repository.CustomerRepository;
import com.billbeat.repository.PaperBoyRepository;
import com.billbeat.repository.VendorRepository;
import com.billbeat.security.UserPrincipal;
import com.billbeat.service.BeatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VendorIsolationTest {

    @Mock
    private BeatRepository beatRepository;
    @Mock
    private VendorRepository vendorRepository;
    @Mock
    private PaperBoyRepository paperBoyRepository;
    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private BeatService beatService;

    @BeforeEach
    void setUp() {
        // Authenticated as Vendor 1 (vendorId = 1L)
        UserPrincipal principal = UserPrincipal.builder()
                .id(100L)
                .username("vendor1")
                .vendorId(1L)
                .authorities(Collections.emptyList())
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList()));
    }

    @Test
    void testGetBeatById_Vendor1AccessingVendor2Beat_ThrowsNotFound() {
        // Beat ID 99 belongs to Vendor 2 (vendorId = 2L)
        when(beatRepository.findByIdAndVendorId(99L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> beatService.getBeatById(99L));
        verify(beatRepository, times(1)).findByIdAndVendorId(99L, 1L);
    }
}
