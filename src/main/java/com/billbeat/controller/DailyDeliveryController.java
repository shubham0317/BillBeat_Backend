package com.billbeat.controller;

import com.billbeat.dto.request.DeliveryStatusUpdateRequest;
import com.billbeat.dto.response.ApiResponse;
import com.billbeat.dto.response.DeliveryResponse;
import com.billbeat.service.DeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/deliveries")
@RequiredArgsConstructor
@Tag(name = "Deliveries", description = "Endpoints for daily delivery tracking and Paper Boy status updates")
public class DailyDeliveryController {

    private final DeliveryService deliveryService;

    @GetMapping("/today")
    @Operation(summary = "Get Today's Deliveries", description = "Retrieves the list of scheduled deliveries for today filtered optionally by Beat or Paper Boy")
    public ResponseEntity<ApiResponse<List<DeliveryResponse>>> getTodayDeliveries(
            @RequestParam(required = false) Long beatId,
            @RequestParam(required = false) Long paperBoyId) {
        List<DeliveryResponse> response = deliveryService.getTodayDeliveries(beatId, paperBoyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/generate-today")
    @Operation(summary = "Generate Today's Deliveries", description = "Generates today's delivery records based on active subscriptions and weekly schedules")
    public ResponseEntity<ApiResponse<List<DeliveryResponse>>> generateTodayDeliveries() {
        List<DeliveryResponse> response = deliveryService.generateTodayDeliveries();
        return ResponseEntity.ok(ApiResponse.success("Today's delivery records generated", response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update Delivery Status", description = "Updates status of a daily delivery record (DELIVERED, NOT_DELIVERED, SKIPPED)")
    public ResponseEntity<ApiResponse<DeliveryResponse>> updateDeliveryStatus(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryStatusUpdateRequest request) {
        DeliveryResponse response = deliveryService.updateDeliveryStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Delivery status updated", response));
    }
}
