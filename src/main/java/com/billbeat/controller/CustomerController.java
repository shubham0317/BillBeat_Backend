package com.billbeat.controller;

import com.billbeat.dto.request.CustomerRequest;
import com.billbeat.dto.response.ApiResponse;
import com.billbeat.dto.response.CustomerResponse;
import com.billbeat.dto.response.PagedResponse;
import com.billbeat.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Tag(name = "Customers", description = "Endpoints for customer management, Beat grouping, and status filtering")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @Operation(summary = "Search and Filter Customers", description = "Retrieves customers for authenticated vendor with pagination, Beat filter, Paid/Due filter, and search")
    public ResponseEntity<ApiResponse<PagedResponse<CustomerResponse>>> getCustomers(
            @RequestParam(required = false) Long beatId,
            @RequestParam(required = false) String billStatus,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<CustomerResponse> response = customerService.searchCustomers(beatId, billStatus, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Customer Profile", description = "Retrieves profile and current bill status for a single customer")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable Long id) {
        CustomerResponse response = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create Customer", description = "Adds a new customer to the vendor's account assigned to a Beat")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Customer created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Customer", description = "Updates full customer profile information")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success("Customer updated successfully", response));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Patch Customer Status", description = "Partially updates customer active or WhatsApp consent status")
    public ResponseEntity<ApiResponse<CustomerResponse>> patchCustomer(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean whatsAppEnabled) {
        CustomerResponse response = customerService.patchCustomerStatus(id, active, whatsAppEnabled);
        return ResponseEntity.ok(ApiResponse.success("Customer status updated", response));
    }
}
