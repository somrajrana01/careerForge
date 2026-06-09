package com.talentforge.user.service;

import com.talentforge.assessment.dto.AssessmentResultResponse;
import com.talentforge.assessment.entity.AssessmentAttempt;
import com.talentforge.assessment.entity.AssessmentType;
import com.talentforge.assessment.repository.AssessmentAttemptRepository;
import com.talentforge.profile.service.StudentProfileService;
import com.talentforge.resume.entity.Resume;
import com.talentforge.resume.repository.ResumeRepository;
import com.talentforge.user.dto.DashboardResponse;
import com.talentforge.user.dto.RecentActivityResponse;
import com.talentforge.user.entity.AppUser;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
public class DashboardService {

    private final UserService userService;
    private final StudentProfileService studentProfileService;
    private final ResumeRepository resumeRepository;
    private final AssessmentAttemptRepository assessmentAttemptRepository;

    public DashboardService(UserService userService,
                            StudentProfileService studentProfileService,
                            ResumeRepository resumeRepository,
                            AssessmentAttemptRepository assessmentAttemptRepository) {
        this.userService = userService;
        this.studentProfileService = studentProfileService;
        this.resumeRepository = resumeRepository;
        this.assessmentAttemptRepository = assessmentAttemptRepository;
    }

    public DashboardResponse getStudentDashboard() {
        AppUser user = userService.getCurrentUser();

        List<AssessmentAttempt> skillAttempts = assessmentAttemptRepository
                .findByUser_IdAndAssessmentTypeOrderByAttemptDateDesc(user.getId(), AssessmentType.SKILL);
        List<AssessmentAttempt> aptitudeAttempts = assessmentAttemptRepository
                .findByUser_IdAndAssessmentTypeOrderByAttemptDateDesc(user.getId(), AssessmentType.APTITUDE);

        List<RecentActivityResponse> resumeActivities = resumeRepository.findByUser_IdOrderByUploadedAtDesc(user.getId())
                .stream()
                .map(this::resumeActivity)
                .toList();

        List<RecentActivityResponse> assessmentActivities = assessmentAttemptRepository.findByUser_IdOrderByAttemptDateDesc(user.getId())
                .stream()
                .map(this::assessmentActivity)
                .toList();

        List<RecentActivityResponse> recentActivity = Stream.concat(resumeActivities.stream(), assessmentActivities.stream())
                .sorted(Comparator.comparing(RecentActivityResponse::occurredAt).reversed())
                .limit(5)
                .toList();

        return new DashboardResponse(
                user.getName(),
                user.getRole(),
                studentProfileService.calculateCompletionPercentage(user),
                resumeRepository.countByUser_Id(user.getId()),
                skillAttempts.stream().map(AssessmentResultResponse::from).toList(),
                aptitudeAttempts.stream().map(AssessmentResultResponse::from).toList(),
                recentActivity
        );
    }

    private RecentActivityResponse resumeActivity(Resume resume) {
        return new RecentActivityResponse(
                "RESUME",
                "Uploaded resume " + resume.getFileName(),
                resume.getUploadedAt()
        );
    }

    private RecentActivityResponse assessmentActivity(AssessmentAttempt attempt) {
        return new RecentActivityResponse(
                "ASSESSMENT",
                "Completed " + attempt.getAssessmentType().name() + " assessment",
                attempt.getAttemptDate()
        );
    }
}
