package com.billbeat.controller;

import com.billbeat.dto.request.NewspaperRequest;
import com.billbeat.dto.response.ApiResponse;
import com.billbeat.dto.response.NewspaperResponse;
import com.billbeat.service.NewspaperService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/newspapers")
@RequiredArgsConstructor
@Tag(name = "Newspapers", description = "Endpoints for managing newspaper master catalog")
public class NewspaperController {

    private final NewspaperService newspaperService;

    @GetMapping
    @Operation(summary = "List Newspapers", description = "Retrieves all newspapers in the catalog for the authenticated vendor")
    public ResponseEntity<ApiResponse<List<NewspaperResponse>>> getAllNewspapers() {
        List<NewspaperResponse> response = newspaperService.getAllNewspapers();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Newspaper by ID", description = "Retrieves details of a single newspaper master record")
    public ResponseEntity<ApiResponse<NewspaperResponse>> getNewspaperById(@PathVariable Long id) {
        NewspaperResponse response = newspaperService.getNewspaperById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create Newspaper", description = "Adds a new newspaper to the vendor's catalog")
    public ResponseEntity<ApiResponse<NewspaperResponse>> createNewspaper(@Valid @RequestBody NewspaperRequest request) {
        NewspaperResponse response = newspaperService.createNewspaper(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Newspaper added to catalog", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Newspaper", description = "Updates an existing newspaper catalog record")
    public ResponseEntity<ApiResponse<NewspaperResponse>> updateNewspaper(@PathVariable Long id, @Valid @RequestBody NewspaperRequest request) {
        NewspaperResponse response = newspaperService.updateNewspaper(id, request);
        return ResponseEntity.ok(ApiResponse.success("Newspaper updated successfully", response));
    }
}
