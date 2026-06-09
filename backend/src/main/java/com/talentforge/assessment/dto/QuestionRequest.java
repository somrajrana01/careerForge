package com.talentforge.assessment.dto;

import com.talentforge.assessment.entity.AssessmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record QuestionRequest(
        @NotBlank(message = "Question title is required")
        String title,

        @NotBlank(message = "Option A is required")
        String optionA,

        @NotBlank(message = "Option B is required")
        String optionB,

        @NotBlank(message = "Option C is required")
        String optionC,

        @NotBlank(message = "Option D is required")
        String optionD,

        @NotBlank(message = "Correct answer is required")
        @Pattern(regexp = "^[A-D]$", message = "Correct answer must be A, B, C, or D")
        String correctAnswer,

        @NotNull(message = "Category is required")
        AssessmentType category,

        @NotBlank(message = "Difficulty is required")
        String difficulty
) {
}
