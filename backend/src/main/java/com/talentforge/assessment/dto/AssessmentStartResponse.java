package com.talentforge.assessment.dto;

import com.talentforge.assessment.entity.AssessmentType;

import java.util.List;

public record AssessmentStartResponse(
        AssessmentType assessmentType,
        int totalQuestions,
        List<AssessmentQuestionResponse> questions
) {
}
