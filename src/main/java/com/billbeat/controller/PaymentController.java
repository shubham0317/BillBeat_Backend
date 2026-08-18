package com.billbeat.controller;

import com.billbeat.dto.request.PaymentRequest;
import com.billbeat.dto.response.ApiResponse;
import com.billbeat.dto.response.PaymentResponse;
import com.billbeat.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Endpoints for recording customer payments and updating bill balances transactionally")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @Operation(summary = "Record Payment", description = "Records a new payment against a bill and transactionally updates bill paid/due balances and status")
    public ResponseEntity<ApiResponse<PaymentResponse>> recordPayment(@Valid @RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.recordPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment recorded successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get Payments", description = "Retrieves payment history filtered by bill ID or customer ID")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPayments(
            @RequestParam(required = false) Long billId,
            @RequestParam(required = false) Long customerId) {
        List<PaymentResponse> response;
        if (billId != null) {
            response = paymentService.getPaymentsForBill(billId);
        } else if (customerId != null) {
            response = paymentService.getPaymentsForCustomer(customerId);
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Either billId or customerId parameter is required"));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
