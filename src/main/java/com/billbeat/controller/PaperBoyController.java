package com.billbeat.controller;

import com.billbeat.dto.request.PaperBoyRequest;
import com.billbeat.dto.response.ApiResponse;
import com.billbeat.dto.response.PaperBoyResponse;
import com.billbeat.service.PaperBoyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/paper-boys")
@RequiredArgsConstructor
@Tag(name = "Paper Boys", description = "Endpoints for managing delivery staff / Paper Boys")
public class PaperBoyController {

    private final PaperBoyService paperBoyService;

    @GetMapping
    @Operation(summary = "List Paper Boys", description = "Retrieves all Paper Boys belonging to the authenticated vendor")
    public ResponseEntity<ApiResponse<List<PaperBoyResponse>>> getAllPaperBoys() {
        List<PaperBoyResponse> response = paperBoyService.getAllPaperBoys();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Paper Boy by ID", description = "Retrieves details of a single Paper Boy")
    public ResponseEntity<ApiResponse<PaperBoyResponse>> getPaperBoyById(@PathVariable Long id) {
        PaperBoyResponse response = paperBoyService.getPaperBoyById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create Paper Boy", description = "Creates a new Paper Boy record (and optional login account)")
    public ResponseEntity<ApiResponse<PaperBoyResponse>> createPaperBoy(@Valid @RequestBody PaperBoyRequest request) {
        PaperBoyResponse response = paperBoyService.createPaperBoy(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Paper Boy created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Paper Boy", description = "Updates an existing Paper Boy")
    public ResponseEntity<ApiResponse<PaperBoyResponse>> updatePaperBoy(@PathVariable Long id, @Valid @RequestBody PaperBoyRequest request) {
        PaperBoyResponse response = paperBoyService.updatePaperBoy(id, request);
        return ResponseEntity.ok(ApiResponse.success("Paper Boy updated successfully", response));
    }
}
