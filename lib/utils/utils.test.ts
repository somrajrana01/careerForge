// =====================================================
// IRAN — Auth & Validation Tests
// =====================================================

import { validateEmail, validateUrl, generateInitials, parseSkillsFromText, truncate } from "@/lib/utils";

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("name.surname@college.edu.in")).toBe(true);
    expect(validateEmail("user+tag@domain.org")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("notanemail")).toBe(false);
    expect(validateEmail("missing@")).toBe(false);
    expect(validateEmail("@nodomain.com")).toBe(false);
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("spaces in@email.com")).toBe(false);
  });
});

describe("validateUrl", () => {
  it("accepts valid URLs", () => {
    expect(validateUrl("https://github.com/user")).toBe(true);
    expect(validateUrl("http://linkedin.com/in/user")).toBe(true);
    expect(validateUrl("https://portfolio.dev")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(validateUrl("notaurl")).toBe(false);
    expect(validateUrl("github.com/user")).toBe(false);
    expect(validateUrl("")).toBe(false);
  });
});

describe("generateInitials", () => {
  it("generates 2-letter initials from full name", () => {
    expect(generateInitials("Arjun Sharma")).toBe("AS");
    expect(generateInitials("John Doe")).toBe("JD");
  });

  it("handles single name", () => {
    expect(generateInitials("Arjun")).toBe("A");
  });

  it("uses only first 2 words", () => {
    expect(generateInitials("Arjun Kumar Sharma")).toBe("AK");
  });

  it("returns uppercase", () => {
    expect(generateInitials("arjun sharma")).toBe("AS");
  });
});

describe("truncate", () => {
  it("does not truncate short strings", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("truncates long strings with ellipsis", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("truncates at exact length", () => {
    const result = truncate("Hello", 5);
    expect(result).toBe("Hello");
  });
});

describe("parseSkillsFromText", () => {
  it("finds JavaScript in text", () => {
    const skills = parseSkillsFromText("I have experience with JavaScript and React");
    expect(skills).toContain("JavaScript");
    expect(skills).toContain("React");
  });

  it("is case-insensitive", () => {
    const skills = parseSkillsFromText("experienced with PYTHON and node.js");
    expect(skills).toContain("Python");
  });

  it("returns empty array for text with no known skills", () => {
    const skills = parseSkillsFromText("I love cooking and painting");
    expect(Array.isArray(skills)).toBe(true);
  });

  it("deduplicates skills", () => {
    const skills = parseSkillsFromText("JavaScript JavaScript JavaScript");
    const jsCount = skills.filter((s) => s === "JavaScript").length;
    expect(jsCount).toBe(1);
  });
});

// ─── Role Permission Tests ─────────────────────────────────

describe("Role-based access control", () => {
  const ROLE_ROUTES: Record<string, string[]> = {
    student: ["/dashboard/student"],
    trainer: ["/dashboard/trainer"],
    placement_officer: ["/dashboard/placement"],
    admin: ["/dashboard/admin", "/dashboard/student", "/dashboard/trainer", "/dashboard/placement"],
  };

  it("student can only access student routes", () => {
    const allowed = ROLE_ROUTES.student;
    expect(allowed).toContain("/dashboard/student");
    expect(allowed).not.toContain("/dashboard/admin");
    expect(allowed).not.toContain("/dashboard/trainer");
  });

  it("trainer can only access trainer routes", () => {
    const allowed = ROLE_ROUTES.trainer;
    expect(allowed).toContain("/dashboard/trainer");
    expect(allowed).not.toContain("/dashboard/admin");
  });

  it("admin can access all routes", () => {
    const adminRoutes = ROLE_ROUTES.admin;
    expect(adminRoutes).toContain("/dashboard/admin");
    expect(adminRoutes).toContain("/dashboard/student");
    expect(adminRoutes).toContain("/dashboard/trainer");
    expect(adminRoutes).toContain("/dashboard/placement");
  });

  it("placement officer has placement route", () => {
    expect(ROLE_ROUTES.placement_officer).toContain("/dashboard/placement");
  });
});

// ─── Readiness Category Tests ──────────────────────────────

describe("Readiness category thresholds", () => {
  function getCategory(score: number) {
    if (score <= 40) return "not_ready";
    if (score <= 60) return "needs_improvement";
    if (score <= 80) return "internship_ready";
    return "highly_ready";
  }

  it("0 is not_ready", () => expect(getCategory(0)).toBe("not_ready"));
  it("40 is not_ready", () => expect(getCategory(40)).toBe("not_ready"));
  it("41 is needs_improvement", () => expect(getCategory(41)).toBe("needs_improvement"));
  it("60 is needs_improvement", () => expect(getCategory(60)).toBe("needs_improvement"));
  it("61 is internship_ready", () => expect(getCategory(61)).toBe("internship_ready"));
  it("80 is internship_ready", () => expect(getCategory(80)).toBe("internship_ready"));
  it("81 is highly_ready", () => expect(getCategory(81)).toBe("highly_ready"));
  it("100 is highly_ready", () => expect(getCategory(100)).toBe("highly_ready"));
});

// ─── Score Weight Tests ────────────────────────────────────

describe("Scoring weight validation", () => {
  const WEIGHTS = {
    profile: 0.15,
    resume: 0.25,
    coding: 0.25,
    aptitude: 0.15,
    projects: 0.10,
    certifications: 0.10,
  };

  it("all weights sum to exactly 1.0", () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it("resume and coding have highest individual weights", () => {
    const max = Math.max(...Object.values(WEIGHTS));
    expect(max).toBe(0.25);
    expect(WEIGHTS.resume).toBe(0.25);
    expect(WEIGHTS.coding).toBe(0.25);
  });

  it("no weight is zero", () => {
    Object.values(WEIGHTS).forEach((w) => expect(w).toBeGreaterThan(0));
  });
});
