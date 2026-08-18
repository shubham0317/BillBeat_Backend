package com.billbeat.controller;

import com.billbeat.dto.request.GenerateBillRequest;
import com.billbeat.dto.response.ApiResponse;
import com.billbeat.dto.response.BillResponse;
import com.billbeat.dto.response.PagedResponse;
import com.billbeat.enums.BillStatus;
import com.billbeat.service.BillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bills")
@RequiredArgsConstructor
@Tag(name = "Bills", description = "Endpoints for monthly bill generation, querying, and balance inspection")
public class BillController {

    private final BillService billService;

    @GetMapping
    @Operation(summary = "Search Bills", description = "Retrieves bills with filtering by customer, status, billing period, and pagination")
    public ResponseEntity<ApiResponse<PagedResponse<BillResponse>>> getBills(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) BillStatus status,
            @RequestParam(required = false) String billingPeriod,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<BillResponse> response = billService.searchBills(customerId, status, billingPeriod, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Bill by ID", description = "Retrieves detailed information for a single bill including itemized charges and WhatsApp notification status")
    public ResponseEntity<ApiResponse<BillResponse>> getBillById(@PathVariable Long id) {
        BillResponse response = billService.getBillById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate Bills", description = "Triggers bill generation for a specific customer or all eligible customers of the authenticated vendor for a billing period")
    public ResponseEntity<ApiResponse<List<BillResponse>>> generateBills(@Valid @RequestBody GenerateBillRequest request) {
        List<BillResponse> response = billService.generateBills(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bill generation completed", response));
    }
}
