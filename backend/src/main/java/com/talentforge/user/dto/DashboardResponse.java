package com.talentforge.user.dto;

import com.talentforge.assessment.dto.AssessmentResultResponse;
import com.talentforge.user.entity.Role;

import java.util.List;

public record DashboardResponse(
        String name,
        Role role,
        int profileCompletionPercentage,
        long totalResumes,
        List<AssessmentResultResponse> skillAssessmentScores,
        List<AssessmentResultResponse> aptitudeScores,
        List<RecentActivityResponse> recentActivity
) {
}
