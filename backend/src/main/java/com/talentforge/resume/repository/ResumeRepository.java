package com.talentforge.resume.repository;

import com.talentforge.resume.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    List<Resume> findByUser_IdOrderByUploadedAtDesc(Long userId);

    Optional<Resume> findByIdAndUser_Id(Long id, Long userId);

    long countByUser_Id(Long userId);
}
