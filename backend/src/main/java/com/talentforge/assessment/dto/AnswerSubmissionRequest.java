package com.talentforge.assessment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AnswerSubmissionRequest(
        @NotNull(message = "Question ID is required")
        Long questionId,

        @NotBlank(message = "Selected answer is required")
        @Pattern(regexp = "^[A-D]$", message = "Selected answer must be A, B, C, or D")
        String selectedAnswer
) {
}
