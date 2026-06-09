package com.talentforge.resume.service;

import com.talentforge.common.exception.ResourceNotFoundException;
import com.talentforge.resume.dto.ResumeRequest;
import com.talentforge.resume.dto.ResumeResponse;
import com.talentforge.resume.entity.Resume;
import com.talentforge.resume.repository.ResumeRepository;
import com.talentforge.user.entity.AppUser;
import com.talentforge.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserService userService;

    public ResumeService(ResumeRepository resumeRepository, UserService userService) {
        this.resumeRepository = resumeRepository;
        this.userService = userService;
    }

    @Transactional
    public ResumeResponse createResume(ResumeRequest request) {
        AppUser user = userService.getCurrentUser();

        Resume resume = new Resume();
        resume.setUser(user);
        resume.setFileName(request.fileName().trim());
        resume.setFileUrl(request.fileUrl().trim());

        return ResumeResponse.from(resumeRepository.save(resume));
    }

    public List<ResumeResponse> getCurrentUserResumes() {
        AppUser user = userService.getCurrentUser();
        return resumeRepository.findByUser_IdOrderByUploadedAtDesc(user.getId())
                .stream()
                .map(ResumeResponse::from)
                .toList();
    }

    @Transactional
    public void deleteResume(Long id) {
        AppUser user = userService.getCurrentUser();
        Resume resume = resumeRepository.findByIdAndUser_Id(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Resume record not found"));
        resumeRepository.delete(resume);
    }
}
