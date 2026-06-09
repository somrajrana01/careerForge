package com.talentforge.assessment.repository;

import com.talentforge.assessment.entity.AssessmentAttempt;
import com.talentforge.assessment.entity.AssessmentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {

    List<AssessmentAttempt> findByUser_IdOrderByAttemptDateDesc(Long userId);

    List<AssessmentAttempt> findByUser_IdAndAssessmentTypeOrderByAttemptDateDesc(Long userId, AssessmentType assessmentType);

    Optional<AssessmentAttempt> findByIdAndUser_Id(Long id, Long userId);
}
