package com.billbeat.service;

import com.billbeat.dto.request.NewspaperRequest;
import com.billbeat.dto.response.NewspaperResponse;
import com.billbeat.entity.Newspaper;
import com.billbeat.entity.Vendor;
import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.repository.NewspaperRepository;
import com.billbeat.repository.VendorRepository;
import com.billbeat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NewspaperService {

    private final NewspaperRepository newspaperRepository;
    private final VendorRepository vendorRepository;

    public List<NewspaperResponse> getAllNewspapers() {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        List<Newspaper> newspapers = newspaperRepository.findAllByVendorId(vendorId);
        return newspapers.stream().map(this::mapToResponse).toList();
    }

    public NewspaperResponse getNewspaperById(Long id) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Newspaper newspaper = newspaperRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Newspaper master not found with ID: " + id));
        return mapToResponse(newspaper);
    }

    @Transactional
    public NewspaperResponse createNewspaper(NewspaperRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        Newspaper newspaper = Newspaper.builder()
                .name(request.getName())
                .code(request.getCode())
                .defaultPrice(request.getDefaultPrice())
                .language(request.getLanguage())
                .vendor(vendor)
                .active(true)
                .build();

        Newspaper saved = newspaperRepository.save(newspaper);
        return mapToResponse(saved);
    }

    @Transactional
    public NewspaperResponse updateNewspaper(Long id, NewspaperRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Newspaper newspaper = newspaperRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Newspaper master not found with ID: " + id));

        newspaper.setName(request.getName());
        newspaper.setCode(request.getCode());
        newspaper.setDefaultPrice(request.getDefaultPrice());
        newspaper.setLanguage(request.getLanguage());

        Newspaper updated = newspaperRepository.save(newspaper);
        return mapToResponse(updated);
    }

    private NewspaperResponse mapToResponse(Newspaper newspaper) {
        return NewspaperResponse.builder()
                .id(newspaper.getId())
                .name(newspaper.getName())
                .code(newspaper.getCode())
                .defaultPrice(newspaper.getDefaultPrice())
                .language(newspaper.getLanguage())
                .active(newspaper.isActive())
                .createdAt(newspaper.getCreatedAt())
                .build();
    }
}
