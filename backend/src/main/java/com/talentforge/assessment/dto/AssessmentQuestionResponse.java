package com.talentforge.assessment.dto;

import com.talentforge.assessment.entity.AssessmentType;
import com.talentforge.assessment.entity.Question;

public record AssessmentQuestionResponse(
        Long id,
        String title,
        String optionA,
        String optionB,
        String optionC,
        String optionD,
        AssessmentType category,
        String difficulty
) {
    public static AssessmentQuestionResponse from(Question question) {
        return new AssessmentQuestionResponse(
                question.getId(),
                question.getTitle(),
                question.getOptionA(),
                question.getOptionB(),
                question.getOptionC(),
                question.getOptionD(),
                question.getCategory(),
                question.getDifficulty()
        );
    }
}
