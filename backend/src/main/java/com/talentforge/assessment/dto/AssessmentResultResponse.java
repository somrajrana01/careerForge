package com.talentforge.assessment.dto;

import com.talentforge.assessment.entity.AssessmentAttempt;
import com.talentforge.assessment.entity.AssessmentType;

import java.time.LocalDateTime;

public record AssessmentResultResponse(
        Long attemptId,
        AssessmentType assessmentType,
        int score,
        int totalQuestions,
        double percentage,
        LocalDateTime attemptDate
) {
    public static AssessmentResultResponse from(AssessmentAttempt attempt) {
        double percentage = attempt.getTotalQuestions() == 0
                ? 0
                : Math.round((attempt.getScore() * 1000.0) / attempt.getTotalQuestions()) / 10.0;
        return new AssessmentResultResponse(
                attempt.getId(),
                attempt.getAssessmentType(),
                attempt.getScore(),
                attempt.getTotalQuestions(),
                percentage,
                attempt.getAttemptDate()
        );
    }
}
