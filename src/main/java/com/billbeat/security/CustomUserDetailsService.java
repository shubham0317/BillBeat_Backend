package com.billbeat.security;

import com.billbeat.entity.PaperBoy;
import com.billbeat.entity.User;
import com.billbeat.entity.Vendor;
import com.billbeat.repository.PaperBoyRepository;
import com.billbeat.repository.UserRepository;
import com.billbeat.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final PaperBoyRepository paperBoyRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        Long vendorId = null;
        Long paperBoyId = null;

        if (user.getRole() == com.billbeat.enums.Role.VENDOR) {
            vendorId = vendorRepository.findByUserId(user.getId())
                    .map(Vendor::getId)
                    .orElse(null);
        } else if (user.getRole() == com.billbeat.enums.Role.PAPER_BOY) {
            PaperBoy pb = paperBoyRepository.findByUserId(user.getId()).orElse(null);
            if (pb != null) {
                paperBoyId = pb.getId();
                vendorId = pb.getVendor().getId();
            }
        }

        return UserPrincipal.create(user, vendorId, paperBoyId);
    }
}
