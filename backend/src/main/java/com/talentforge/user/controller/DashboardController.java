package com.talentforge.user.controller;

import com.talentforge.common.response.ApiResponse;
import com.talentforge.user.dto.DashboardResponse;
import com.talentforge.user.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<DashboardResponse>> studentDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard loaded", dashboardService.getStudentDashboard()));
    }
}
