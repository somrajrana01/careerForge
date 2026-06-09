package com.talentforge.profile.dto;

import com.talentforge.profile.entity.StudentProfile;

public record StudentProfileResponse(
        Long id,
        Long userId,
        String branch,
        Integer semester,
        Double cgpa,
        String githubUrl,
        String linkedinUrl
) {
    public static StudentProfileResponse from(StudentProfile profile) {
        return new StudentProfileResponse(
                profile.getId(),
                profile.getUser().getId(),
                profile.getBranch(),
                profile.getSemester(),
                profile.getCgpa(),
                profile.getGithubUrl(),
                profile.getLinkedinUrl()
        );
    }
}
