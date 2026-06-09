package com.talentforge.resume.dto;

import com.talentforge.resume.entity.Resume;

import java.time.LocalDateTime;

public record ResumeResponse(
        Long id,
        Long userId,
        String fileName,
        String fileUrl,
        LocalDateTime uploadedAt
) {
    public static ResumeResponse from(Resume resume) {
        return new ResumeResponse(
                resume.getId(),
                resume.getUser().getId(),
                resume.getFileName(),
                resume.getFileUrl(),
                resume.getUploadedAt()
        );
    }
}
