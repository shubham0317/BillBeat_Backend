package com.billbeat.util;

public class PhoneUtils {

    private PhoneUtils() {
    }

    public static String formatWhatsAppPhone(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() == 10) {
            return "91" + digits; // Default India prefix
        } else if (digits.length() == 12 && digits.startsWith("91")) {
            return digits;
        }
        return digits;
    }

    public static boolean isValidPhoneNumber(String phone) {
        if (phone == null) return false;
        String digits = phone.replaceAll("[^0-9]", "");
        return digits.length() >= 10 && digits.length() <= 15;
    }
}
