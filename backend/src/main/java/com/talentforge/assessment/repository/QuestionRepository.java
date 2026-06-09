package com.talentforge.assessment.repository;

import com.talentforge.assessment.entity.AssessmentType;
import com.talentforge.assessment.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByCategoryOrderByIdAsc(AssessmentType category);
}
