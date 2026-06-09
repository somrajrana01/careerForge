package com.talentforge.profile.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record StudentProfileRequest(
        @NotBlank(message = "Branch is required")
        String branch,

        @NotNull(message = "Semester is required")
        @Min(value = 1, message = "Semester must be at least 1")
        @Max(value = 12, message = "Semester cannot exceed 12")
        Integer semester,

        @NotNull(message = "CGPA is required")
        @DecimalMin(value = "0.0", message = "CGPA cannot be negative")
        @DecimalMax(value = "10.0", message = "CGPA cannot exceed 10.0")
        Double cgpa,

        @Pattern(regexp = "^$|https?://.+", message = "GitHub URL must start with http:// or https://")
        String githubUrl,

        @Pattern(regexp = "^$|https?://.+", message = "LinkedIn URL must start with http:// or https://")
        String linkedinUrl
) {
}
