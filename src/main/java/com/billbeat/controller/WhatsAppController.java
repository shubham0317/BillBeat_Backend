package com.billbeat.controller;

import com.billbeat.dto.response.ApiResponse;
import com.billbeat.dto.response.WhatsAppMessageResponse;
import com.billbeat.service.WhatsAppMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bills")
@RequiredArgsConstructor
@Tag(name = "WhatsApp", description = "Endpoints for triggering WhatsApp bill messages and inspecting send status")
public class WhatsAppController {

    private final WhatsAppMessageService whatsAppMessageService;

    @PostMapping("/{id}/send-whatsapp")
    @Operation(summary = "Send / Resend WhatsApp Bill", description = "Triggers or resends a WhatsApp monthly bill notification for an authorized vendor's bill")
    public ResponseEntity<ApiResponse<WhatsAppMessageResponse>> sendWhatsAppBill(@PathVariable Long id) {
        WhatsAppMessageResponse response = whatsAppMessageService.resendBillWhatsApp(id);
        return ResponseEntity.ok(ApiResponse.success("WhatsApp bill notification queued/sent", response));
    }

    @GetMapping("/{id}/whatsapp-status")
    @Operation(summary = "Get WhatsApp Status for Bill", description = "Retrieves the current WhatsApp delivery lifecycle status for a bill")
    public ResponseEntity<ApiResponse<WhatsAppMessageResponse>> getWhatsAppStatus(@PathVariable Long id) {
        WhatsAppMessageResponse response = whatsAppMessageService.getWhatsAppStatusByBillId(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
