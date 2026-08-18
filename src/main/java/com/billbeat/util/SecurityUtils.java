package com.billbeat.util;

import com.billbeat.exception.UnauthorizedException;
import com.billbeat.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<UserPrincipal> getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return Optional.of((UserPrincipal) authentication.getPrincipal());
        }
        return Optional.empty();
    }

    public static Long getCurrentVendorId() {
        UserPrincipal principal = getCurrentUserPrincipal()
                .orElseThrow(() -> new UnauthorizedException("User is not authenticated"));
        if (principal.getVendorId() == null) {
            throw new UnauthorizedException("Authenticated user does not have vendor context");
        }
        return principal.getVendorId();
    }

    public static Optional<Long> getOptionalVendorId() {
        return getCurrentUserPrincipal().map(UserPrincipal::getVendorId);
    }

    public static Long getCurrentPaperBoyId() {
        UserPrincipal principal = getCurrentUserPrincipal()
                .orElseThrow(() -> new UnauthorizedException("User is not authenticated"));
        if (principal.getPaperBoyId() == null) {
            throw new UnauthorizedException("Authenticated user does not have paper boy context");
        }
        return principal.getPaperBoyId();
    }

    public static boolean hasRole(String role) {
        return getCurrentUserPrincipal()
                .map(p -> p.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_" + role)))
                .orElse(false);
    }
}
