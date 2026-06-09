package com.talentforge.profile.service;

import com.talentforge.common.exception.BadRequestException;
import com.talentforge.common.exception.ResourceNotFoundException;
import com.talentforge.profile.dto.StudentProfileRequest;
import com.talentforge.profile.dto.StudentProfileResponse;
import com.talentforge.profile.entity.StudentProfile;
import com.talentforge.profile.repository.StudentProfileRepository;
import com.talentforge.user.entity.AppUser;
import com.talentforge.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final UserService userService;

    public StudentProfileService(StudentProfileRepository studentProfileRepository, UserService userService) {
        this.studentProfileRepository = studentProfileRepository;
        this.userService = userService;
    }

    @Transactional
    public StudentProfileResponse createProfile(StudentProfileRequest request) {
        AppUser user = userService.getCurrentUser();
        if (studentProfileRepository.existsByUser_Id(user.getId())) {
            throw new BadRequestException("Profile already exists");
        }

        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        applyRequest(profile, request);
        return StudentProfileResponse.from(studentProfileRepository.save(profile));
    }

    public StudentProfileResponse getCurrentProfile() {
        return StudentProfileResponse.from(getCurrentProfileEntity());
    }

    @Transactional
    public StudentProfileResponse updateCurrentProfile(StudentProfileRequest request) {
        StudentProfile profile = getCurrentProfileEntity();
        applyRequest(profile, request);
        return StudentProfileResponse.from(studentProfileRepository.save(profile));
    }

    @Transactional
    public void deleteCurrentProfile() {
        StudentProfile profile = getCurrentProfileEntity();
        studentProfileRepository.delete(profile);
    }

    public int calculateCompletionPercentage(AppUser user) {
        return studentProfileRepository.findByUser_Id(user.getId())
                .map(this::completionPercentage)
                .orElse(0);
    }

    private StudentProfile getCurrentProfileEntity() {
        AppUser user = userService.getCurrentUser();
        return studentProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
    }

    private void applyRequest(StudentProfile profile, StudentProfileRequest request) {
        profile.setBranch(request.branch().trim());
        profile.setSemester(request.semester());
        profile.setCgpa(request.cgpa());
        profile.setGithubUrl(cleanOptionalUrl(request.githubUrl()));
        profile.setLinkedinUrl(cleanOptionalUrl(request.linkedinUrl()));
    }

    private String cleanOptionalUrl(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "";
        }
        return value.trim();
    }

    private int completionPercentage(StudentProfile profile) {
        int completed = 0;
        completed += isPresent(profile.getBranch()) ? 1 : 0;
        completed += profile.getSemester() != null ? 1 : 0;
        completed += profile.getCgpa() != null ? 1 : 0;
        completed += isPresent(profile.getGithubUrl()) ? 1 : 0;
        completed += isPresent(profile.getLinkedinUrl()) ? 1 : 0;
        return Math.round((completed / 5.0f) * 100);
    }

    private boolean isPresent(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
