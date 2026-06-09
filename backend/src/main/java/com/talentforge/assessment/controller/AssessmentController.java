package com.talentforge.assessment.controller;

import com.talentforge.assessment.dto.AssessmentQuestionResponse;
import com.talentforge.assessment.dto.AssessmentResultResponse;
import com.talentforge.assessment.dto.AssessmentStartResponse;
import com.talentforge.assessment.dto.AssessmentSubmitRequest;
import com.talentforge.assessment.entity.AssessmentType;
import com.talentforge.assessment.service.AssessmentService;
import com.talentforge.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/assessments")
@PreAuthorize("hasRole('STUDENT')")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping("/{type}/start")
    public ResponseEntity<ApiResponse<AssessmentStartResponse>> startAssessment(@PathVariable AssessmentType type) {
        return ResponseEntity.ok(ApiResponse.success("Assessment started", assessmentService.startAssessment(type)));
    }

    @GetMapping("/{type}/questions")
    public ResponseEntity<ApiResponse<List<AssessmentQuestionResponse>>> fetchQuestions(@PathVariable AssessmentType type) {
        return ResponseEntity.ok(ApiResponse.success("Assessment questions loaded", assessmentService.fetchAssessmentQuestions(type)));
    }

    @PostMapping("/{type}/submit")
    public ResponseEntity<ApiResponse<AssessmentResultResponse>> submitAssessment(@PathVariable AssessmentType type,
                                                                                  @Valid @RequestBody AssessmentSubmitRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Assessment submitted", assessmentService.submitAssessment(type, request)));
    }

    @GetMapping("/results")
    public ResponseEntity<ApiResponse<List<AssessmentResultResponse>>> getResults() {
        return ResponseEntity.ok(ApiResponse.success("Assessment results loaded", assessmentService.getCurrentUserResults()));
    }

    @GetMapping("/results/{attemptId}")
    public ResponseEntity<ApiResponse<AssessmentResultResponse>> getResult(@PathVariable Long attemptId) {
        return ResponseEntity.ok(ApiResponse.success("Assessment result loaded", assessmentService.getCurrentUserResult(attemptId)));
    }
}
