package com.talentforge.assessment.dto;

import com.talentforge.assessment.entity.AssessmentType;
import com.talentforge.assessment.entity.Question;

public record QuestionResponse(
        Long id,
        String title,
        String optionA,
        String optionB,
        String optionC,
        String optionD,
        String correctAnswer,
        AssessmentType category,
        String difficulty
) {
    public static QuestionResponse from(Question question) {
        return new QuestionResponse(
                question.getId(),
                question.getTitle(),
                question.getOptionA(),
                question.getOptionB(),
                question.getOptionC(),
                question.getOptionD(),
                question.getCorrectAnswer(),
                question.getCategory(),
                question.getDifficulty()
        );
    }
}
