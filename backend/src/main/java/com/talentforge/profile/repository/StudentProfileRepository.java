package com.talentforge.profile.repository;

import com.talentforge.profile.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    Optional<StudentProfile> findByUser_Id(Long userId);

    boolean existsByUser_Id(Long userId);
}
