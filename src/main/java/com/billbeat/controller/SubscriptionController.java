package com.billbeat.controller;

import com.billbeat.dto.request.SubscriptionRequest;
import com.billbeat.dto.response.ApiResponse;
import com.billbeat.dto.response.SubscriptionResponse;
import com.billbeat.enums.SubscriptionStatus;
import com.billbeat.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "Endpoints for managing customer newspaper subscriptions and delivery schedules")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    @Operation(summary = "List Subscriptions", description = "Retrieves all subscriptions belonging to the authenticated vendor (or optional customer filter)")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getSubscriptions(@RequestParam(required = false) Long customerId) {
        List<SubscriptionResponse> response;
        if (customerId != null) {
            response = subscriptionService.getSubscriptionsByCustomerId(customerId);
        } else {
            response = subscriptionService.getAllSubscriptions();
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Subscription by ID", description = "Retrieves details of a single subscription and its weekly schedule")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getSubscriptionById(@PathVariable Long id) {
        SubscriptionResponse response = subscriptionService.getSubscriptionById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create Subscription", description = "Adds a new newspaper subscription with weekly delivery schedule for a customer")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> createSubscription(@Valid @RequestBody SubscriptionRequest request) {
        SubscriptionResponse response = subscriptionService.createSubscription(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Subscription created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Subscription", description = "Updates an existing subscription copies, price, dates, or delivery schedule")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> updateSubscription(@PathVariable Long id, @Valid @RequestBody SubscriptionRequest request) {
        SubscriptionResponse response = subscriptionService.updateSubscription(id, request);
        return ResponseEntity.ok(ApiResponse.success("Subscription updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update Subscription Status", description = "Updates subscription status (ACTIVE, PAUSED, CANCELLED, EXPIRED)")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> updateSubscriptionStatus(
            @PathVariable Long id,
            @RequestParam SubscriptionStatus status) {
        SubscriptionResponse response = subscriptionService.updateSubscriptionStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Subscription status updated", response));
    }
}
