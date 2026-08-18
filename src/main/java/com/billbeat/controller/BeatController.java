package com.billbeat.controller;

import com.billbeat.dto.request.BeatRequest;
import com.billbeat.dto.response.ApiResponse;
import com.billbeat.dto.response.BeatResponse;
import com.billbeat.service.BeatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/beats")
@RequiredArgsConstructor
@Tag(name = "Beats", description = "Endpoints for managing distribution Beats/Areas")
public class BeatController {

    private final BeatService beatService;

    @GetMapping
    @Operation(summary = "List all Beats", description = "Retrieves all Beats belonging to the authenticated vendor along with customer/paid/due counts")
    public ResponseEntity<ApiResponse<List<BeatResponse>>> getAllBeats() {
        List<BeatResponse> beats = beatService.getAllBeats();
        return ResponseEntity.ok(ApiResponse.success(beats));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Beat by ID", description = "Retrieves details of a single Beat by ID")
    public ResponseEntity<ApiResponse<BeatResponse>> getBeatById(@PathVariable Long id) {
        BeatResponse beat = beatService.getBeatById(id);
        return ResponseEntity.ok(ApiResponse.success(beat));
    }

    @PostMapping
    @Operation(summary = "Create Beat", description = "Creates a new Beat for the authenticated vendor")
    public ResponseEntity<ApiResponse<BeatResponse>> createBeat(@Valid @RequestBody BeatRequest request) {
        BeatResponse response = beatService.createBeat(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Beat created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Beat", description = "Updates an existing Beat")
    public ResponseEntity<ApiResponse<BeatResponse>> updateBeat(@PathVariable Long id, @Valid @RequestBody BeatRequest request) {
        BeatResponse response = beatService.updateBeat(id, request);
        return ResponseEntity.ok(ApiResponse.success("Beat updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate Beat", description = "Deactivates a Beat without deleting customer data")
    public ResponseEntity<ApiResponse<Void>> deactivateBeat(@PathVariable Long id) {
        beatService.deactivateBeat(id);
        return ResponseEntity.ok(ApiResponse.success("Beat deactivated successfully", null));
    }
}
