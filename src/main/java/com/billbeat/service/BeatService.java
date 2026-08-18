package com.billbeat.service;

import com.billbeat.dto.request.BeatRequest;
import com.billbeat.dto.response.BeatResponse;
import com.billbeat.entity.Beat;
import com.billbeat.entity.PaperBoy;
import com.billbeat.entity.Vendor;
import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.repository.BeatRepository;
import com.billbeat.repository.CustomerRepository;
import com.billbeat.repository.PaperBoyRepository;
import com.billbeat.repository.VendorRepository;
import com.billbeat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BeatService {

    private final BeatRepository beatRepository;
    private final VendorRepository vendorRepository;
    private final PaperBoyRepository paperBoyRepository;
    private final CustomerRepository customerRepository;

    public List<BeatResponse> getAllBeats() {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        List<Beat> beats = beatRepository.findAllByVendorId(vendorId);
        return beats.stream().map(beat -> mapToBeatResponse(beat, vendorId)).toList();
    }

    public BeatResponse getBeatById(Long id) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Beat beat = beatRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Beat not found with ID: " + id));
        return mapToBeatResponse(beat, vendorId);
    }

    @Transactional
    public BeatResponse createBeat(BeatRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        PaperBoy defaultPaperBoy = null;
        if (request.getDefaultPaperBoyId() != null) {
            defaultPaperBoy = paperBoyRepository.findByIdAndVendorId(request.getDefaultPaperBoyId(), vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Paper Boy not found with ID: " + request.getDefaultPaperBoyId()));
        }

        Beat beat = Beat.builder()
                .name(request.getName())
                .code(request.getCode())
                .description(request.getDescription())
                .vendor(vendor)
                .defaultPaperBoy(defaultPaperBoy)
                .active(true)
                .build();

        Beat saved = beatRepository.save(beat);
        return mapToBeatResponse(saved, vendorId);
    }

    @Transactional
    public BeatResponse updateBeat(Long id, BeatRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Beat beat = beatRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Beat not found with ID: " + id));

        PaperBoy defaultPaperBoy = null;
        if (request.getDefaultPaperBoyId() != null) {
            defaultPaperBoy = paperBoyRepository.findByIdAndVendorId(request.getDefaultPaperBoyId(), vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Paper Boy not found with ID: " + request.getDefaultPaperBoyId()));
        }

        beat.setName(request.getName());
        beat.setCode(request.getCode());
        beat.setDescription(request.getDescription());
        beat.setDefaultPaperBoy(defaultPaperBoy);

        Beat updated = beatRepository.save(beat);
        return mapToBeatResponse(updated, vendorId);
    }

    @Transactional
    public void deactivateBeat(Long id) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Beat beat = beatRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Beat not found with ID: " + id));
        beat.setActive(false);
        beatRepository.save(beat);
    }

    private BeatResponse mapToBeatResponse(Beat beat, Long vendorId) {
        long customerCount = customerRepository.countByBeatIdAndActiveTrue(beat.getId());
        long dueCount = customerRepository.countDueCustomersByBeat(vendorId, beat.getId());
        long paidCount = customerRepository.countPaidCustomersByBeat(vendorId, beat.getId());

        return BeatResponse.builder()
                .id(beat.getId())
                .name(beat.getName())
                .code(beat.getCode())
                .description(beat.getDescription())
                .defaultPaperBoyId(beat.getDefaultPaperBoy() != null ? beat.getDefaultPaperBoy().getId() : null)
                .defaultPaperBoyName(beat.getDefaultPaperBoy() != null ? beat.getDefaultPaperBoy().getName() : null)
                .customerCount(customerCount)
                .paidCount(paidCount)
                .dueCount(dueCount)
                .active(beat.isActive())
                .createdAt(beat.getCreatedAt())
                .build();
    }
}
