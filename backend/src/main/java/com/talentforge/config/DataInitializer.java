package com.talentforge.config;

import com.talentforge.assessment.entity.AssessmentType;
import com.talentforge.assessment.entity.Question;
import com.talentforge.assessment.repository.QuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedQuestionBank(QuestionRepository questionRepository) {
        return args -> {
            if (questionRepository.count() == 0) {
                questionRepository.saveAll(List.of(
                        question("Which keyword creates an immutable variable binding in modern JavaScript?", "const", "var", "switch", "yield", "A", AssessmentType.SKILL, "EASY"),
                        question("Which HTTP status code indicates a successful resource creation?", "200", "201", "204", "400", "B", AssessmentType.SKILL, "EASY"),
                        question("In SQL, which clause filters grouped records?", "WHERE", "ORDER BY", "HAVING", "LIMIT", "C", AssessmentType.SKILL, "MEDIUM"),
                        question("A train travels 120 km in 2 hours. What is its average speed?", "40 km/h", "50 km/h", "60 km/h", "80 km/h", "C", AssessmentType.APTITUDE, "EASY"),
                        question("If 5 workers finish a task in 12 days, how many days do 10 workers need at the same rate?", "3", "6", "12", "24", "B", AssessmentType.APTITUDE, "EASY"),
                        question("Find the next number: 2, 6, 12, 20, 30", "36", "40", "42", "44", "C", AssessmentType.APTITUDE, "MEDIUM")
                ));
            }
        };
    }

    private Question question(String title, String optionA, String optionB, String optionC, String optionD,
                              String correctAnswer, AssessmentType category, String difficulty) {
        Question question = new Question();
        question.setTitle(title);
        question.setOptionA(optionA);
        question.setOptionB(optionB);
        question.setOptionC(optionC);
        question.setOptionD(optionD);
        question.setCorrectAnswer(correctAnswer);
        question.setCategory(category);
        question.setDifficulty(difficulty);
        return question;
    }
}
