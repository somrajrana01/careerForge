// =====================================================
// IRAN - Readiness Scoring Engine
// Deterministic formula - NO AI
// =====================================================

import type {
  ReadinessScore,
  ReadinessCategory,
  StudentProfile,
  ResumeReport,
  Attempt,
  CodingSubmission,
  Project,
  Certification,
} from "@/types";

// Weights (must sum to 1.0)
export const SCORING_WEIGHTS = {
  profile: 0.15,
  resume: 0.25,
  coding: 0.25,
  aptitude: 0.15,
  projects: 0.10,
  certifications: 0.10,
};

// =====================================================
// COMPONENT SCORE CALCULATORS
// =====================================================

export function calculateProfileScore(profile: StudentProfile | null): number {
  if (!profile) return 0;
  return profile.profile_completion;
}

export function calculateResumeScore(report: ResumeReport | null): number {
  if (!report) return 0;

  const atsWeight = 0.5;
  const qualityWeight = 0.5;

  const score =
    report.ats_score * atsWeight + report.quality_score * qualityWeight;

  return Math.round(Math.min(100, Math.max(0, score)));
}

export function calculateCodingScore(
  submissions: CodingSubmission[]
): number {
  if (!submissions || submissions.length === 0) return 0;

  const evaluated = submissions.filter((s) => s.status === "evaluated");
  if (evaluated.length === 0) return 0;

  // Average completion percentage weighted by difficulty
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const sub of evaluated) {
    const difficultyMultiplier = 1; // Could adjust by difficulty if available
    totalWeightedScore += sub.completion_percentage * difficultyMultiplier;
    totalWeight += difficultyMultiplier;
  }

  const avgScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  // Bonus for volume of submissions
  const volumeBonus = Math.min(10, submissions.length * 2);

  return Math.round(Math.min(100, avgScore + volumeBonus));
}

export function calculateAptitudeScore(attempts: Attempt[]): number {
  if (!attempts || attempts.length === 0) return 0;

  const completed = attempts.filter(
    (a) =>
      a.status === "completed" &&
      a.assessment_id &&
      typeof a.percentage === "number"
  );
  if (completed.length === 0) return 0;

  // Take best attempts per assessment
  const bestByAssessment = new Map<string, number>();
  for (const attempt of completed) {
    const current = bestByAssessment.get(attempt.assessment_id) ?? 0;
    if (attempt.percentage > current) {
      bestByAssessment.set(attempt.assessment_id, attempt.percentage);
    }
  }

  const scores = Array.from(bestByAssessment.values());
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  return Math.round(Math.min(100, avgScore));
}

export function calculateProjectsScore(projects: Project[]): number {
  if (!projects || projects.length === 0) return 0;

  let score = 0;

  // Points for having projects
  if (projects.length >= 1) score += 20;
  if (projects.length >= 2) score += 15;
  if (projects.length >= 3) score += 10;

  // Points for project quality
  for (const project of projects.slice(0, 4)) {
    if (project.github_url) score += 8;
    if (project.live_url) score += 5;
    if (project.description && project.description.length > 100) score += 5;
    if (project.tech_stack && project.tech_stack.length >= 3) score += 5;
    if (project.highlights && project.highlights.length > 0) score += 5;
    score += Math.min(10, (project.complexity_score ?? 0));
  }

  return Math.round(Math.min(100, score));
}

export function calculateCertificationsScore(
  certifications: Certification[]
): number {
  if (!certifications || certifications.length === 0) return 0;

  let score = 0;

  // Points per certification
  if (certifications.length >= 1) score += 30;
  if (certifications.length >= 2) score += 20;
  if (certifications.length >= 3) score += 15;
  if (certifications.length >= 5) score += 10;

  // Bonus for verified certifications
  const verified = certifications.filter((c) => c.verified).length;
  score += verified * 5;

  // Bonus for certs with URLs (proof)
  const withUrl = certifications.filter((c) => c.credential_url).length;
  score += withUrl * 3;

  return Math.round(Math.min(100, score));
}

// =====================================================
// MAIN READINESS SCORE CALCULATOR
// =====================================================

export interface ReadinessInput {
  profile: StudentProfile | null;
  latestResumeReport: ResumeReport | null;
  codingSubmissions: CodingSubmission[];
  aptitudeAttempts: Attempt[];
  projects: Project[];
  certifications: Certification[];
  userId: string;
}

export interface ReadinessResult {
  overall_score: number;
  category: ReadinessCategory;
  profile_score: number;
  resume_score: number;
  coding_score: number;
  aptitude_score: number;
  projects_score: number;
  certifications_score: number;
  explanation: string;
  improvement_areas: string[];
  breakdown: ComponentBreakdown[];
}

export interface ComponentBreakdown {
  name: string;
  score: number;
  weight: number;
  weighted_contribution: number;
  status: "excellent" | "good" | "needs_work" | "missing";
}

export function calculateReadinessScore(input: ReadinessInput): ReadinessResult {
  const profileScore = calculateProfileScore(input.profile);
  const resumeScore = calculateResumeScore(input.latestResumeReport);
  const codingScore = calculateCodingScore(input.codingSubmissions);
  const aptitudeScore = calculateAptitudeScore(input.aptitudeAttempts);
  const projectsScore = calculateProjectsScore(input.projects);
  const certificationsScore = calculateCertificationsScore(
    input.certifications
  );

  // Weighted overall score
  const overallScore =
    profileScore * SCORING_WEIGHTS.profile +
    resumeScore * SCORING_WEIGHTS.resume +
    codingScore * SCORING_WEIGHTS.coding +
    aptitudeScore * SCORING_WEIGHTS.aptitude +
    projectsScore * SCORING_WEIGHTS.projects +
    certificationsScore * SCORING_WEIGHTS.certifications;

  const roundedScore = Math.round(overallScore * 10) / 10;

  // Determine category
  let category: ReadinessCategory;
  if (roundedScore <= 40) category = "not_ready";
  else if (roundedScore <= 60) category = "needs_improvement";
  else if (roundedScore <= 80) category = "internship_ready";
  else category = "highly_ready";

  // Build breakdown
  const breakdown: ComponentBreakdown[] = [
    {
      name: "Profile Completion",
      score: profileScore,
      weight: SCORING_WEIGHTS.profile,
      weighted_contribution: profileScore * SCORING_WEIGHTS.profile,
      status: getStatus(profileScore),
    },
    {
      name: "Resume Quality",
      score: resumeScore,
      weight: SCORING_WEIGHTS.resume,
      weighted_contribution: resumeScore * SCORING_WEIGHTS.resume,
      status: getStatus(resumeScore),
    },
    {
      name: "Coding Performance",
      score: codingScore,
      weight: SCORING_WEIGHTS.coding,
      weighted_contribution: codingScore * SCORING_WEIGHTS.coding,
      status: getStatus(codingScore),
    },
    {
      name: "Aptitude Performance",
      score: aptitudeScore,
      weight: SCORING_WEIGHTS.aptitude,
      weighted_contribution: aptitudeScore * SCORING_WEIGHTS.aptitude,
      status: getStatus(aptitudeScore),
    },
    {
      name: "Projects",
      score: projectsScore,
      weight: SCORING_WEIGHTS.projects,
      weighted_contribution: projectsScore * SCORING_WEIGHTS.projects,
      status: getStatus(projectsScore),
    },
    {
      name: "Certifications",
      score: certificationsScore,
      weight: SCORING_WEIGHTS.certifications,
      weighted_contribution: certificationsScore * SCORING_WEIGHTS.certifications,
      status: getStatus(certificationsScore),
    },
  ];

  // Generate improvement areas (sorted by impact)
  const improvementAreas = breakdown
    .filter((b) => b.score < 70)
    .sort(
      (a, b) =>
        (b.weight * (70 - b.score)) - (a.weight * (70 - a.score))
    )
    .map((b) => generateImprovementMessage(b.name, b.score));

  // Generate explanation
  const explanation = generateExplanation(
    roundedScore,
    category,
    breakdown
  );

  return {
    overall_score: roundedScore,
    category,
    profile_score: profileScore,
    resume_score: resumeScore,
    coding_score: codingScore,
    aptitude_score: aptitudeScore,
    projects_score: projectsScore,
    certifications_score: certificationsScore,
    explanation,
    improvement_areas: improvementAreas,
    breakdown,
  };
}

function getStatus(
  score: number
): "excellent" | "good" | "needs_work" | "missing" {
  if (score === 0) return "missing";
  if (score < 40) return "needs_work";
  if (score < 70) return "good";
  return "excellent";
}

function generateImprovementMessage(name: string, score: number): string {
  const messages: Record<string, Record<string, string>> = {
    "Profile Completion": {
      missing: "Complete your student profile to unlock all features",
      needs_work: `Your profile is ${score}% complete — add education, skills, and links`,
      good: "Add more skills and a bio to strengthen your profile",
    },
    "Resume Quality": {
      missing: "Upload your resume for AI-powered ATS analysis",
      needs_work: "Your resume needs significant improvement — follow the AI suggestions",
      good: "Improve resume ATS score by adding more keywords",
    },
    "Coding Performance": {
      missing: "Start solving coding problems to build your score",
      needs_work: "Practice more DSA problems — aim for 50+ problems",
      good: "Solve medium/hard problems to boost your coding score",
    },
    "Aptitude Performance": {
      missing: "Take aptitude assessments to demonstrate your skills",
      needs_work: "Improve quantitative and logical reasoning skills",
      good: "Focus on verbal reasoning to improve overall aptitude",
    },
    Projects: {
      missing: "Add projects to showcase your practical skills",
      needs_work: "Build more substantial projects with GitHub links",
      good: "Add live demos and detailed descriptions to existing projects",
    },
    Certifications: {
      missing: "Earn certifications to validate your technical skills",
      needs_work: "Get at least 2-3 recognized certifications",
      good: "Add more domain-specific certifications",
    },
  };

  const status = getStatus(score);
  return (
    messages[name]?.[status] ??
    `Improve your ${name} score from ${score}/100`
  );
}

function generateExplanation(
  score: number,
  category: ReadinessCategory,
  breakdown: ComponentBreakdown[]
): string {
  const categoryMessages = {
    not_ready: `Your current readiness score of ${score}/100 indicates you are Not Ready for internships yet. Focus on completing your profile, uploading a resume, and building fundamental skills.`,
    needs_improvement: `Your readiness score of ${score}/100 shows you Need Improvement before applying for internships. You're making progress but need to strengthen your core competencies.`,
    internship_ready: `Congratulations! Your readiness score of ${score}/100 means you're Internship Ready. You have a solid foundation — now focus on quality applications and interview preparation.`,
    highly_ready: `Excellent! Your readiness score of ${score}/100 makes you Highly Ready for internships. You're a strong candidate — focus on targeting top companies and negotiating well.`,
  };

  const topStrengths = breakdown
    .filter((b) => b.score >= 70)
    .map((b) => b.name.toLowerCase())
    .slice(0, 2);

  const topWeaknesses = breakdown
    .filter((b) => b.score < 50)
    .map((b) => b.name.toLowerCase())
    .slice(0, 2);

  let explanation = categoryMessages[category];

  if (topStrengths.length > 0) {
    explanation += ` Your strongest areas are ${topStrengths.join(" and ")}.`;
  }

  if (topWeaknesses.length > 0) {
    explanation += ` Priority improvements needed in ${topWeaknesses.join(" and ")}.`;
  }

  return explanation;
}

// =====================================================
// INTERNSHIP MATCHING ALGORITHM
// =====================================================

export function calculateInternshipMatch(
  studentSkills: string[],
  studentCgpa: number,
  studentBranch: string,
  studentYear: number,
  internship: {
    required_skills: string[];
    preferred_skills: string[];
    min_cgpa?: number;
    eligible_branches: string[];
    eligible_years: number[];
  }
): {
  match_percentage: number;
  matching_skills: string[];
  missing_skills: string[];
  recommendations: string[];
} {
  const normalizedStudentSkills = studentSkills.map((s) => s.toLowerCase().trim());
  const normalizedRequired = internship.required_skills.map((s) =>
    s.toLowerCase().trim()
  );
  const normalizedPreferred = internship.preferred_skills.map((s) =>
    s.toLowerCase().trim()
  );

  // Skills matching (60% weight)
  const matchingRequired = normalizedRequired.filter((skill) =>
    normalizedStudentSkills.some(
      (s) => s.includes(skill) || skill.includes(s)
    )
  );
  const matchingPreferred = normalizedPreferred.filter((skill) =>
    normalizedStudentSkills.some(
      (s) => s.includes(skill) || skill.includes(s)
    )
  );

  const requiredScore =
    normalizedRequired.length > 0
      ? (matchingRequired.length / normalizedRequired.length) * 40
      : 40;
  const preferredScore =
    normalizedPreferred.length > 0
      ? (matchingPreferred.length / normalizedPreferred.length) * 20
      : 20;

  // Eligibility (40% weight)
  let eligibilityScore = 0;

  // CGPA check
  if (!internship.min_cgpa || studentCgpa >= internship.min_cgpa) {
    eligibilityScore += 15;
  }

  // Branch check
  if (
    internship.eligible_branches.length === 0 ||
    internship.eligible_branches.some(
      (b) =>
        b.toLowerCase() === studentBranch?.toLowerCase() ||
        b === "Any" ||
        b === "All"
    )
  ) {
    eligibilityScore += 15;
  }

  // Year check
  if (
    internship.eligible_years.length === 0 ||
    internship.eligible_years.includes(studentYear)
  ) {
    eligibilityScore += 10;
  }

  const totalScore = Math.round(
    requiredScore + preferredScore + eligibilityScore
  );

  const missingSkills = normalizedRequired
    .filter(
      (skill) =>
        !normalizedStudentSkills.some(
          (s) => s.includes(skill) || skill.includes(s)
        )
    )
    .map((s) => internship.required_skills[normalizedRequired.indexOf(s)]);

  const recommendations: string[] = [];
  if (missingSkills.length > 0) {
    recommendations.push(
      `Learn these required skills: ${missingSkills.slice(0, 3).join(", ")}`
    );
  }
  if (internship.min_cgpa && studentCgpa < internship.min_cgpa) {
    recommendations.push(
      `This role requires CGPA ≥ ${internship.min_cgpa} (yours: ${studentCgpa})`
    );
  }
  if (totalScore >= 70) {
    recommendations.push("Strong match — apply soon before deadline");
  } else if (totalScore >= 50) {
    recommendations.push(
      "Moderate match — upskill in required areas then apply"
    );
  }

  return {
    match_percentage: Math.min(100, totalScore),
    matching_skills: [
      ...matchingRequired.map(
        (s) => internship.required_skills[normalizedRequired.indexOf(s)]
      ),
      ...matchingPreferred.map(
        (s) =>
          internship.preferred_skills[normalizedPreferred.indexOf(s)]
      ),
    ].filter(Boolean),
    missing_skills: missingSkills,
    recommendations,
  };
}

// =====================================================
// TESTS
// =====================================================

export const scoringTests = {
  testProfileScore: () => {
    const mockProfile = {
      profile_completion: 75,
    } as StudentProfile;
    const score = calculateProfileScore(mockProfile);
    console.assert(score === 75, "Profile score should match completion");
  },

  testCodingScore: () => {
    const submissions: CodingSubmission[] = [
      {
        status: "evaluated",
        completion_percentage: 80,
      } as CodingSubmission,
      {
        status: "evaluated",
        completion_percentage: 60,
      } as CodingSubmission,
    ];
    const score = calculateCodingScore(submissions);
    console.assert(score > 0, "Coding score should be > 0");
    console.assert(score <= 100, "Coding score should be <= 100");
  },

  testOverallScore: () => {
    const result = calculateReadinessScore({
      profile: { profile_completion: 80 } as StudentProfile,
      latestResumeReport: { ats_score: 75, quality_score: 70 } as ResumeReport,
      codingSubmissions: [
        { status: "evaluated", completion_percentage: 70 } as CodingSubmission,
      ],
      aptitudeAttempts: [
        {
          status: "completed",
          percentage: 65,
          assessment_id: "test1",
        } as Attempt,
      ],
      projects: [
        {
          github_url: "https://github.com",
          tech_stack: ["React", "Node.js", "MongoDB"],
          complexity_score: 7,
        } as Project,
        {
          github_url: "https://github.com",
          tech_stack: ["Python", "Flask"],
          complexity_score: 5,
        } as Project,
      ],
      certifications: [
        { verified: true, credential_url: "https://cert.com" } as Certification,
        { verified: false } as Certification,
      ],
      userId: "test-user",
    });

    console.assert(result.overall_score > 0, "Score should be > 0");
    console.assert(result.overall_score <= 100, "Score should be <= 100");
    console.assert(result.category !== undefined, "Category should exist");
    console.log("Overall score:", result.overall_score, result.category);
  },
};
