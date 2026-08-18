package com.billbeat.repository;

import com.billbeat.entity.PaperBoy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaperBoyRepository extends JpaRepository<PaperBoy, Long> {

    List<PaperBoy> findAllByVendorId(Long vendorId);

    Optional<PaperBoy> findByIdAndVendorId(Long id, Long vendorId);

    Optional<PaperBoy> findByUserId(Long userId);
}
