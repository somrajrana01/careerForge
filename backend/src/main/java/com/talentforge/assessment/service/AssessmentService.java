package com.talentforge.assessment.service;

import com.talentforge.assessment.dto.AnswerSubmissionRequest;
import com.talentforge.assessment.dto.AssessmentQuestionResponse;
import com.talentforge.assessment.dto.AssessmentResultResponse;
import com.talentforge.assessment.dto.AssessmentStartResponse;
import com.talentforge.assessment.dto.AssessmentSubmitRequest;
import com.talentforge.assessment.entity.AssessmentAttempt;
import com.talentforge.assessment.entity.AssessmentType;
import com.talentforge.assessment.entity.Question;
import com.talentforge.assessment.repository.AssessmentAttemptRepository;
import com.talentforge.assessment.repository.QuestionRepository;
import com.talentforge.common.exception.BadRequestException;
import com.talentforge.common.exception.ResourceNotFoundException;
import com.talentforge.user.entity.AppUser;
import com.talentforge.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AssessmentService {

    private final QuestionRepository questionRepository;
    private final AssessmentAttemptRepository assessmentAttemptRepository;
    private final UserService userService;

    public AssessmentService(QuestionRepository questionRepository,
                             AssessmentAttemptRepository assessmentAttemptRepository,
                             UserService userService) {
        this.questionRepository = questionRepository;
        this.assessmentAttemptRepository = assessmentAttemptRepository;
        this.userService = userService;
    }

    public AssessmentStartResponse startAssessment(AssessmentType assessmentType) {
        List<AssessmentQuestionResponse> questions = fetchAssessmentQuestions(assessmentType);
        return new AssessmentStartResponse(assessmentType, questions.size(), questions);
    }

    public List<AssessmentQuestionResponse> fetchAssessmentQuestions(AssessmentType assessmentType) {
        List<Question> questions = questionRepository.findByCategoryOrderByIdAsc(assessmentType);
        if (questions.isEmpty()) {
            throw new BadRequestException("No questions available for " + assessmentType + " assessment");
        }
        return questions.stream()
                .map(AssessmentQuestionResponse::from)
                .toList();
    }

    @Transactional
    public AssessmentResultResponse submitAssessment(AssessmentType assessmentType, AssessmentSubmitRequest request) {
        AppUser user = userService.getCurrentUser();
        Set<Long> questionIds = request.answers().stream()
                .map(AnswerSubmissionRequest::questionId)
                .collect(Collectors.toCollection(HashSet::new));

        Map<Long, Question> questionsById = questionRepository.findAllById(questionIds)
                .stream()
                .collect(Collectors.toMap(Question::getId, Function.identity()));

        if (questionsById.size() != questionIds.size()) {
            throw new BadRequestException("One or more submitted questions were not found");
        }

        int score = 0;
        for (AnswerSubmissionRequest answer : request.answers()) {
            Question question = questionsById.get(answer.questionId());
            if (question.getCategory() != assessmentType) {
                throw new BadRequestException("Submitted question does not belong to " + assessmentType + " assessment");
            }
            if (question.getCorrectAnswer().equalsIgnoreCase(answer.selectedAnswer())) {
                score++;
            }
        }

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setUser(user);
        attempt.setScore(score);
        attempt.setTotalQuestions(request.answers().size());
        attempt.setAssessmentType(assessmentType);

        return AssessmentResultResponse.from(assessmentAttemptRepository.save(attempt));
    }

    public List<AssessmentResultResponse> getCurrentUserResults() {
        AppUser user = userService.getCurrentUser();
        return assessmentAttemptRepository.findByUser_IdOrderByAttemptDateDesc(user.getId())
                .stream()
                .map(AssessmentResultResponse::from)
                .toList();
    }

    public AssessmentResultResponse getCurrentUserResult(Long attemptId) {
        AppUser user = userService.getCurrentUser();
        AssessmentAttempt attempt = assessmentAttemptRepository.findByIdAndUser_Id(attemptId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Assessment result not found"));
        return AssessmentResultResponse.from(attempt);
    }
}
