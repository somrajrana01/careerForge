package com.talentforge.profile.controller;

import com.talentforge.common.response.ApiResponse;
import com.talentforge.profile.dto.StudentProfileRequest;
import com.talentforge.profile.dto.StudentProfileResponse;
import com.talentforge.profile.service.StudentProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
@PreAuthorize("hasRole('STUDENT')")
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    public StudentProfileController(StudentProfileService studentProfileService) {
        this.studentProfileService = studentProfileService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StudentProfileResponse>> createProfile(@Valid @RequestBody StudentProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Profile created", studentProfileService.createProfile(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getProfile() {
        return ResponseEntity.ok(ApiResponse.success("Profile loaded", studentProfileService.getCurrentProfile()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateProfile(@Valid @RequestBody StudentProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated", studentProfileService.updateCurrentProfile(request)));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteProfile() {
        studentProfileService.deleteCurrentProfile();
        return ResponseEntity.ok(ApiResponse.success("Profile deleted", null));
    }
}
