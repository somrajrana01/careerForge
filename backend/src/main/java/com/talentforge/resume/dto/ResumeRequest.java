package com.talentforge.resume.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResumeRequest(
        @NotBlank(message = "File name is required")
        String fileName,

        @NotBlank(message = "File URL is required")
        @Pattern(regexp = "^https?://.+|^/.+|^[A-Za-z]:\\\\.+", message = "File URL must be an http URL or local path")
        String fileUrl
) {
}
