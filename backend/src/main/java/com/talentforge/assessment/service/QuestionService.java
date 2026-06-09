package com.talentforge.assessment.service;

import com.talentforge.assessment.dto.QuestionRequest;
import com.talentforge.assessment.dto.QuestionResponse;
import com.talentforge.assessment.entity.AssessmentType;
import com.talentforge.assessment.entity.Question;
import com.talentforge.assessment.repository.QuestionRepository;
import com.talentforge.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;

    public QuestionService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request) {
        Question question = new Question();
        applyRequest(question, request);
        return QuestionResponse.from(questionRepository.save(question));
    }

    public List<QuestionResponse> getQuestions(AssessmentType category) {
        List<Question> questions = category == null
                ? questionRepository.findAll()
                : questionRepository.findByCategoryOrderByIdAsc(category);
        return questions.stream().map(QuestionResponse::from).toList();
    }

    @Transactional
    public QuestionResponse updateQuestion(Long id, QuestionRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        applyRequest(question, request);
        return QuestionResponse.from(questionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        questionRepository.delete(question);
    }

    private void applyRequest(Question question, QuestionRequest request) {
        question.setTitle(request.title().trim());
        question.setOptionA(request.optionA().trim());
        question.setOptionB(request.optionB().trim());
        question.setOptionC(request.optionC().trim());
        question.setOptionD(request.optionD().trim());
        question.setCorrectAnswer(request.correctAnswer().trim().toUpperCase());
        question.setCategory(request.category());
        question.setDifficulty(request.difficulty().trim().toUpperCase());
    }
}
