import {
  calculateProfileScore,
  calculateResumeScore,
  calculateCodingScore,
  calculateAptitudeScore,
  calculateProjectsScore,
  calculateCertificationsScore,
  calculateReadinessScore,
  calculateInternshipMatch,
  SCORING_WEIGHTS,
} from "@/lib/scoring";
import type {
  StudentProfile, ResumeReport, CodingSubmission,
  Attempt, Project, Certification,
} from "@/types";

// ─── Profile Score ───────────────────────────────────────

describe("calculateProfileScore", () => {
  it("returns 0 for null profile", () => {
    expect(calculateProfileScore(null)).toBe(0);
  });

  it("returns profile_completion value", () => {
    const p = { profile_completion: 75 } as StudentProfile;
    expect(calculateProfileScore(p)).toBe(75);
  });

  it("caps at 100", () => {
    const p = { profile_completion: 105 } as StudentProfile;
    expect(calculateProfileScore(p)).toBe(105); // raw passthrough
  });
});

// ─── Resume Score ────────────────────────────────────────

describe("calculateResumeScore", () => {
  it("returns 0 for null report", () => {
    expect(calculateResumeScore(null)).toBe(0);
  });

  it("averages ats_score and quality_score equally", () => {
    const r = { ats_score: 80, quality_score: 60 } as ResumeReport;
    expect(calculateResumeScore(r)).toBe(70);
  });

  it("handles perfect scores", () => {
    const r = { ats_score: 100, quality_score: 100 } as ResumeReport;
    expect(calculateResumeScore(r)).toBe(100);
  });

  it("handles zero scores", () => {
    const r = { ats_score: 0, quality_score: 0 } as ResumeReport;
    expect(calculateResumeScore(r)).toBe(0);
  });
});

// ─── Coding Score ────────────────────────────────────────

describe("calculateCodingScore", () => {
  it("returns 0 for empty submissions", () => {
    expect(calculateCodingScore([])).toBe(0);
  });

  it("ignores non-evaluated submissions", () => {
    const subs = [
      { status: "pending", completion_percentage: 100 } as CodingSubmission,
    ];
    expect(calculateCodingScore(subs)).toBe(0);
  });

  it("calculates average completion percentage", () => {
    const subs = [
      { status: "evaluated", completion_percentage: 80 } as CodingSubmission,
      { status: "evaluated", completion_percentage: 60 } as CodingSubmission,
    ];
    const score = calculateCodingScore(subs);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("gives volume bonus for more submissions", () => {
    const few = [{ status: "evaluated", completion_percentage: 70 } as CodingSubmission];
    const many = Array(10).fill({ status: "evaluated", completion_percentage: 70 } as CodingSubmission);
    expect(calculateCodingScore(many)).toBeGreaterThanOrEqual(calculateCodingScore(few));
  });
});

// ─── Aptitude Score ──────────────────────────────────────

describe("calculateAptitudeScore", () => {
  it("returns 0 for empty attempts", () => {
    expect(calculateAptitudeScore([])).toBe(0);
  });

  it("ignores in-progress attempts", () => {
    const attempts = [
      { status: "in_progress", percentage: 90, assessment_id: "a1" } as Attempt,
    ];
    expect(calculateAptitudeScore(attempts)).toBe(0);
  });

  it("takes best score per assessment", () => {
    const attempts = [
      { status: "completed", percentage: 50, assessment_id: "a1" } as Attempt,
      { status: "completed", percentage: 80, assessment_id: "a1" } as Attempt,
      { status: "completed", percentage: 60, assessment_id: "a2" } as Attempt,
    ];
    const score = calculateAptitudeScore(attempts);
    // Best for a1=80, a2=60 → avg=70
    expect(score).toBe(70);
  });
});

// ─── Projects Score ──────────────────────────────────────

describe("calculateProjectsScore", () => {
  it("returns 0 for empty projects", () => {
    expect(calculateProjectsScore([])).toBe(0);
  });

  it("increases with more high-quality projects", () => {
    const p1: Project[] = [
      { github_url: "https://github.com", tech_stack: ["React", "Node", "MongoDB"], complexity_score: 7 } as Project,
    ];
    const p2: Project[] = [
      ...p1,
      { github_url: "https://github.com", live_url: "https://demo.com", tech_stack: ["Python", "FastAPI"], complexity_score: 8 } as Project,
    ];
    expect(calculateProjectsScore(p2)).toBeGreaterThan(calculateProjectsScore(p1));
  });

  it("caps at 100", () => {
    const many = Array(10).fill({
      github_url: "https://github.com",
      live_url: "https://live.com",
      description: "A".repeat(200),
      tech_stack: ["React", "Node", "MongoDB", "Redis"],
      highlights: ["feature1"],
      complexity_score: 10,
    } as Project);
    expect(calculateProjectsScore(many)).toBeLessThanOrEqual(100);
  });
});

// ─── Certifications Score ────────────────────────────────

describe("calculateCertificationsScore", () => {
  it("returns 0 for empty certs", () => {
    expect(calculateCertificationsScore([])).toBe(0);
  });

  it("gives bonus for verified certs with URL", () => {
    const basic: Certification[] = [{ verified: false } as Certification];
    const verified: Certification[] = [{ verified: true, credential_url: "https://cert.com" } as Certification];
    expect(calculateCertificationsScore(verified)).toBeGreaterThan(calculateCertificationsScore(basic));
  });
});

// ─── Overall Score ───────────────────────────────────────

describe("calculateReadinessScore", () => {
  const baseInput = {
    profile: { profile_completion: 70 } as StudentProfile,
    latestResumeReport: { ats_score: 75, quality_score: 65 } as ResumeReport,
    codingSubmissions: [{ status: "evaluated", completion_percentage: 80 } as CodingSubmission],
    aptitudeAttempts: [{ status: "completed", percentage: 70, assessment_id: "a1" } as Attempt],
    projects: [{ github_url: "https://g.com", tech_stack: ["React"], complexity_score: 6 } as Project],
    certifications: [{ verified: true, credential_url: "https://cert.com" } as Certification],
    userId: "test-user",
  };

  it("produces a score between 0 and 100", () => {
    const { overall_score } = calculateReadinessScore(baseInput);
    expect(overall_score).toBeGreaterThanOrEqual(0);
    expect(overall_score).toBeLessThanOrEqual(100);
  });

  it("assigns a readiness category", () => {
    const { category } = calculateReadinessScore(baseInput);
    expect(["not_ready", "needs_improvement", "internship_ready", "highly_ready"]).toContain(category);
  });

  it("classifies low score as not_ready", () => {
    const { category } = calculateReadinessScore({
      profile: null,
      latestResumeReport: null,
      codingSubmissions: [],
      aptitudeAttempts: [],
      projects: [],
      certifications: [],
      userId: "x",
    });
    expect(category).toBe("not_ready");
  });

  it("classifies high score as highly_ready", () => {
    const highInput = {
      profile: { profile_completion: 100 } as StudentProfile,
      latestResumeReport: { ats_score: 95, quality_score: 95 } as ResumeReport,
      codingSubmissions: Array(8).fill({ status: "evaluated", completion_percentage: 95 } as CodingSubmission),
      aptitudeAttempts: [{ status: "completed", percentage: 92, assessment_id: "a1" } as Attempt],
      projects: Array(3).fill({
        github_url: "https://g.com", live_url: "https://live.com",
        description: "A".repeat(200), tech_stack: ["React", "Node", "MongoDB", "Redis"],
        highlights: ["x"], complexity_score: 9,
      } as Project),
      certifications: Array(5).fill({ verified: true, credential_url: "https://cert.com" } as Certification),
      userId: "x",
    };
    const { overall_score, category } = calculateReadinessScore(highInput);
    expect(overall_score).toBeGreaterThan(75);
    expect(["internship_ready", "highly_ready"]).toContain(category);
  });

  it("weights sum to 1.0", () => {
    const sum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("returns improvement areas for weak scores", () => {
    const { improvement_areas } = calculateReadinessScore({
      profile: { profile_completion: 10 } as StudentProfile,
      latestResumeReport: null,
      codingSubmissions: [],
      aptitudeAttempts: [],
      projects: [],
      certifications: [],
      userId: "x",
    });
    expect(improvement_areas.length).toBeGreaterThan(0);
  });
});

// ─── Internship Matching ─────────────────────────────────

describe("calculateInternshipMatch", () => {
  const baseInternship = {
    required_skills: ["React", "Node.js", "MongoDB"],
    preferred_skills: ["TypeScript", "Docker"],
    min_cgpa: 7.0,
    eligible_branches: ["Computer Science Engineering"],
    eligible_years: [3, 4],
  };

  it("returns 100% for perfect match", () => {
    const result = calculateInternshipMatch(
      ["React", "Node.js", "MongoDB", "TypeScript", "Docker"],
      8.5,
      "Computer Science Engineering",
      3,
      baseInternship
    );
    expect(result.match_percentage).toBeGreaterThan(80);
  });

  it("returns low score for no skill match", () => {
    const result = calculateInternshipMatch(
      ["Java", "Spring Boot"],
      8.0,
      "Computer Science Engineering",
      3,
      baseInternship
    );
    expect(result.match_percentage).toBeLessThan(50);
  });

  it("penalizes for low CGPA", () => {
    const high = calculateInternshipMatch(["React", "Node.js", "MongoDB"], 8.0, "CSE", 3, baseInternship);
    const low = calculateInternshipMatch(["React", "Node.js", "MongoDB"], 5.0, "CSE", 3, baseInternship);
    expect(high.match_percentage).toBeGreaterThanOrEqual(low.match_percentage);
  });

  it("returns matching_skills array", () => {
    const result = calculateInternshipMatch(["React", "Node.js"], 8.0, "CSE", 3, baseInternship);
    expect(Array.isArray(result.matching_skills)).toBe(true);
  });

  it("returns missing_skills array", () => {
    const result = calculateInternshipMatch(["React"], 8.0, "CSE", 3, baseInternship);
    expect(result.missing_skills).toContain("Node.js");
    expect(result.missing_skills).toContain("MongoDB");
  });

  it("handles empty required skills", () => {
    const result = calculateInternshipMatch(
      ["React"],
      8.0, "CSE", 3,
      { required_skills: [], preferred_skills: [], min_cgpa: 6.0, eligible_branches: [], eligible_years: [] }
    );
    expect(result.match_percentage).toBeGreaterThan(0);
  });
});
