package com.talentforge.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AssessmentSubmitRequest(
        @NotEmpty(message = "At least one answer is required")
        List<@Valid AnswerSubmissionRequest> answers
) {
}
