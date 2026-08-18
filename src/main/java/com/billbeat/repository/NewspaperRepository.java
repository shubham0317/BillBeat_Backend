package com.billbeat.repository;

import com.billbeat.entity.Newspaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewspaperRepository extends JpaRepository<Newspaper, Long> {

    List<Newspaper> findAllByVendorId(Long vendorId);

    Optional<Newspaper> findByIdAndVendorId(Long id, Long vendorId);
}
