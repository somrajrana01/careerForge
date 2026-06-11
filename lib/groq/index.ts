import Groq from "groq-sdk";
import { z } from "zod";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

// =====================================================
// ZOD SCHEMAS FOR AI OUTPUTS
// =====================================================

const ResumeAnalysisSchema = z.object({
  ats_score: z.number().min(0).max(100),
  quality_score: z.number().min(0).max(100),
  missing_keywords: z.array(z.string()),
  missing_sections: z.array(z.string()),
  grammar_issues: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  skills_found: z.array(z.string()),
  skills_missing: z.array(z.string()),
  project_quality_analysis: z.object({
    total_projects: z.number(),
    has_github_links: z.boolean(),
    has_live_links: z.boolean(),
    uses_modern_tech: z.boolean(),
    quality_score: z.number().min(0).max(100),
    feedback: z.array(z.string()),
  }),
  full_analysis: z.object({
    contact_info_complete: z.boolean(),
    education_complete: z.boolean(),
    experience_mentioned: z.boolean(),
    skills_section_present: z.boolean(),
    certifications_present: z.boolean(),
    achievements_present: z.boolean(),
    action_verbs_used: z.boolean(),
    quantified_achievements: z.boolean(),
    overall_format: z.string(),
    word_count: z.number(),
  }),
});

const RoadmapSchema = z.object({
  target_role: z.string(),
  overall_duration: z.string(),
  plan_30_days: z.object({
    goals: z.array(z.string()),
    tasks: z.array(z.string()),
    milestones: z.array(z.string()),
    resources: z.array(z.string()),
  }),
  plan_60_days: z.object({
    goals: z.array(z.string()),
    tasks: z.array(z.string()),
    milestones: z.array(z.string()),
    resources: z.array(z.string()),
  }),
  plan_90_days: z.object({
    goals: z.array(z.string()),
    tasks: z.array(z.string()),
    milestones: z.array(z.string()),
    resources: z.array(z.string()),
  }),
});

const SkillGapSchema = z.object({
  summary: z.string(),
  skill_gaps: z.array(
    z.object({
      skill: z.string(),
      current_level: z.string(),
      required_level: z.string(),
      importance: z.enum(["critical", "high", "medium", "low"]),
      resources: z.array(z.string()),
    })
  ),
  priority_skills: z.array(z.string()),
  estimated_learning_time: z.string(),
});

const InterviewPlanSchema = z.object({
  technical_topics: z.array(z.string()),
  behavioral_topics: z.array(z.string()),
  mock_interview_schedule: z.array(z.string()),
  company_specific_tips: z.array(z.string()),
  resources: z.array(z.string()),
  weekly_plan: z.array(
    z.object({
      week: z.number(),
      focus: z.string(),
      activities: z.array(z.string()),
    })
  ),
});

const DSAPlanSchema = z.object({
  weak_areas: z.array(z.string()),
  daily_problems: z.number(),
  topics_to_cover: z.array(
    z.object({
      topic: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      estimated_days: z.number(),
      resources: z.array(z.string()),
    })
  ),
  platforms: z.array(z.string()),
  milestones: z.array(z.string()),
  weekly_schedule: z.array(
    z.object({
      week: z.number(),
      topics: z.array(z.string()),
      problem_count: z.number(),
    })
  ),
});

// =====================================================
// HELPER FUNCTION
// =====================================================

async function callGroqWithSchema<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  fallback: T
): Promise<T> {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return fallback;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = schema.safeParse(parsed);

    if (validated.success) {
      return validated.data;
    }

    console.error("Schema validation failed:", validated.error);
    return fallback;
  } catch (error) {
    console.error("Groq API error:", error);
    return fallback;
  }
}

// =====================================================
// ANALYZE RESUME
// =====================================================

export async function analyzeResume(
  resumeText: string,
  targetRole?: string
): Promise<z.infer<typeof ResumeAnalysisSchema>> {
  const fallback: z.infer<typeof ResumeAnalysisSchema> = {
    ats_score: 50,
    quality_score: 50,
    missing_keywords: [
      "internship",
      "experience",
      "projects",
      "skills",
      "education",
    ],
    missing_sections: ["Summary", "Technical Skills", "Projects"],
    grammar_issues: ["Unable to analyze - please try again"],
    strengths: ["Resume uploaded successfully"],
    weaknesses: ["AI analysis temporarily unavailable"],
    suggestions: [
      "Add a professional summary",
      "Include quantified achievements",
      "Add relevant technical skills",
    ],
    skills_found: [],
    skills_missing: ["Communication", "Problem Solving", "Team Work"],
    project_quality_analysis: {
      total_projects: 0,
      has_github_links: false,
      has_live_links: false,
      uses_modern_tech: false,
      quality_score: 40,
      feedback: ["Add project descriptions with tech stack"],
    },
    full_analysis: {
      contact_info_complete: false,
      education_complete: false,
      experience_mentioned: false,
      skills_section_present: false,
      certifications_present: false,
      achievements_present: false,
      action_verbs_used: false,
      quantified_achievements: false,
      overall_format: "standard",
      word_count: resumeText.split(" ").length,
    },
  };

  const systemPrompt = `You are an expert ATS resume analyzer and career counselor specializing in tech internships for Indian engineering students. Analyze resumes objectively and provide actionable feedback. Always respond with ONLY valid JSON matching the exact schema provided.`;

  const userPrompt = `Analyze this resume for an internship position${targetRole ? ` as ${targetRole}` : ""}. 

Resume Text:
${resumeText.slice(0, 8000)}

Provide analysis in this EXACT JSON format:
{
  "ats_score": <0-100 integer based on ATS compatibility>,
  "quality_score": <0-100 integer overall quality>,
  "missing_keywords": ["keyword1", "keyword2"],
  "missing_sections": ["section1", "section2"],
  "grammar_issues": ["issue1", "issue2"],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"],
  "skills_found": ["skill1", "skill2"],
  "skills_missing": ["skill1", "skill2"],
  "project_quality_analysis": {
    "total_projects": <number>,
    "has_github_links": <boolean>,
    "has_live_links": <boolean>,
    "uses_modern_tech": <boolean>,
    "quality_score": <0-100>,
    "feedback": ["feedback1", "feedback2"]
  },
  "full_analysis": {
    "contact_info_complete": <boolean>,
    "education_complete": <boolean>,
    "experience_mentioned": <boolean>,
    "skills_section_present": <boolean>,
    "certifications_present": <boolean>,
    "achievements_present": <boolean>,
    "action_verbs_used": <boolean>,
    "quantified_achievements": <boolean>,
    "overall_format": "standard|modern|minimal|detailed",
    "word_count": <number>
  }
}`;

  return callGroqWithSchema(
    systemPrompt,
    userPrompt,
    ResumeAnalysisSchema,
    fallback
  );
}

// =====================================================
// GENERATE ROADMAP
// =====================================================

export async function generateRoadmap(
  targetRole: string,
  currentSkills: string[],
  readinessScore: number,
  weakAreas: string[]
): Promise<z.infer<typeof RoadmapSchema>> {
  const fallback: z.infer<typeof RoadmapSchema> = {
    target_role: targetRole,
    overall_duration: "90 days",
    plan_30_days: {
      goals: [
        "Build strong foundation",
        "Complete profile",
        "Start DSA practice",
      ],
      tasks: [
        "Complete your Supabase profile",
        "Upload resume and get analyzed",
        "Solve 2-3 easy LeetCode problems daily",
        "Start one online course relevant to your target role",
      ],
      milestones: [
        "Profile 100% complete",
        "Resume ATS score above 70",
        "30 DSA problems solved",
      ],
      resources: [
        "LeetCode",
        "GeeksforGeeks",
        "Coursera",
        "YouTube tutorials",
      ],
    },
    plan_60_days: {
      goals: [
        "Intermediate skill development",
        "Build projects",
        "Networking",
      ],
      tasks: [
        "Complete a full-stack or domain-specific project",
        "Contribute to open source",
        "Connect with professionals on LinkedIn",
        "Take 2 relevant certifications",
      ],
      milestones: [
        "2 projects on GitHub",
        "1 certification completed",
        "50+ LinkedIn connections in field",
      ],
      resources: [
        "GitHub",
        "LinkedIn Learning",
        "Udemy",
        "freeCodeCamp",
      ],
    },
    plan_90_days: {
      goals: [
        "Interview preparation",
        "Applications",
        "Final polish",
      ],
      tasks: [
        "Apply to 20+ internships",
        "Practice mock interviews",
        "Prepare system design basics",
        "Optimize resume with feedback",
      ],
      milestones: [
        "5+ interview calls",
        "Internship offer",
        "Readiness score above 75",
      ],
      resources: [
        "Glassdoor",
        "Internshala",
        "LinkedIn Jobs",
        "Pramp for mock interviews",
      ],
    },
  };

  const systemPrompt = `You are an expert career counselor for Indian engineering students preparing for tech internships. Create actionable, realistic roadmaps. Respond with ONLY valid JSON.`;

  const userPrompt = `Create a 90-day internship preparation roadmap for:
- Target Role: ${targetRole}
- Current Skills: ${currentSkills.join(", ")}
- Current Readiness Score: ${readinessScore}/100
- Weak Areas: ${weakAreas.join(", ")}

Respond with EXACT JSON:
{
  "target_role": "${targetRole}",
  "overall_duration": "90 days",
  "plan_30_days": {
    "goals": ["goal1", "goal2", "goal3"],
    "tasks": ["task1", "task2", "task3", "task4"],
    "milestones": ["milestone1", "milestone2"],
    "resources": ["resource1", "resource2", "resource3"]
  },
  "plan_60_days": {
    "goals": ["goal1", "goal2", "goal3"],
    "tasks": ["task1", "task2", "task3", "task4"],
    "milestones": ["milestone1", "milestone2"],
    "resources": ["resource1", "resource2", "resource3"]
  },
  "plan_90_days": {
    "goals": ["goal1", "goal2", "goal3"],
    "tasks": ["task1", "task2", "task3", "task4"],
    "milestones": ["milestone1", "milestone2"],
    "resources": ["resource1", "resource2", "resource3"]
  }
}`;

  return callGroqWithSchema(systemPrompt, userPrompt, RoadmapSchema, fallback);
}

// =====================================================
// GENERATE SKILL GAP ANALYSIS
// =====================================================

export async function generateSkillGapAnalysis(
  studentSkills: string[],
  targetRole: string,
  resumeSkillsMissing: string[]
): Promise<z.infer<typeof SkillGapSchema>> {
  const fallback: z.infer<typeof SkillGapSchema> = {
    summary: `Based on your profile, you have foundational skills but need to strengthen several areas for a ${targetRole} internship.`,
    skill_gaps: [
      {
        skill: "Data Structures & Algorithms",
        current_level: "beginner",
        required_level: "intermediate",
        importance: "critical",
        resources: ["LeetCode", "GeeksforGeeks", "Strivers DSA Sheet"],
      },
      {
        skill: "System Design Basics",
        current_level: "none",
        required_level: "basic",
        importance: "high",
        resources: ["Gaurav Sen YouTube", "System Design Primer GitHub"],
      },
      ...resumeSkillsMissing.slice(0, 3).map((skill) => ({
        skill,
        current_level: "beginner",
        required_level: "intermediate",
        importance: "medium" as const,
        resources: [`${skill} tutorials on YouTube`, `${skill} documentation`],
      })),
    ],
    priority_skills: [
      "DSA",
      "System Design",
      ...resumeSkillsMissing.slice(0, 2),
    ],
    estimated_learning_time: "60-90 days with consistent effort",
  };

  const systemPrompt = `You are an expert technical recruiter analyzing skill gaps for Indian engineering students. Provide specific, actionable skill gap analysis. Respond with ONLY valid JSON.`;

  const userPrompt = `Analyze skill gaps for:
- Target Role: ${targetRole}
- Student's Current Skills: ${studentSkills.join(", ")}
- Skills Missing from Resume: ${resumeSkillsMissing.join(", ")}

Return JSON with this structure:
{
  "summary": "2-3 sentence overview",
  "skill_gaps": [
    {
      "skill": "skill name",
      "current_level": "none|beginner|intermediate|advanced",
      "required_level": "beginner|intermediate|advanced|expert",
      "importance": "critical|high|medium|low",
      "resources": ["resource1", "resource2"]
    }
  ],
  "priority_skills": ["skill1", "skill2", "skill3"],
  "estimated_learning_time": "X weeks/months"
}`;

  return callGroqWithSchema(systemPrompt, userPrompt, SkillGapSchema, fallback);
}

// =====================================================
// GENERATE INTERVIEW PREPARATION
// =====================================================

export async function generateInterviewPreparation(
  targetRole: string,
  skills: string[],
  weakAreas: string[]
): Promise<z.infer<typeof InterviewPlanSchema>> {
  const fallback: z.infer<typeof InterviewPlanSchema> = {
    technical_topics: [
      "Data Structures (Arrays, LinkedList, Trees, Graphs)",
      "Algorithms (Sorting, Searching, Dynamic Programming)",
      "OOPS Concepts",
      "Database basics (SQL queries)",
      "Operating System concepts",
      "Computer Networks fundamentals",
    ],
    behavioral_topics: [
      "Tell me about yourself",
      "Why do you want this internship?",
      "Describe a challenging project",
      "How do you handle deadlines?",
      "Teamwork examples",
    ],
    mock_interview_schedule: [
      "Week 1: Self-introduction + basic technical",
      "Week 2: DSA focused rounds",
      "Week 3: Project walkthrough",
      "Week 4: Full mock with peer/mentor",
    ],
    company_specific_tips: [
      "Research company tech stack before interview",
      "Prepare questions to ask the interviewer",
      "Review recent company news and products",
      "Practice coding on whiteboard/paper",
    ],
    resources: [
      "InterviewBit",
      "LeetCode",
      "Pramp.com for mock interviews",
      "Glassdoor for company-specific questions",
      "YouTube: TechLead, Clement Mihailescu",
    ],
    weekly_plan: [
      {
        week: 1,
        focus: "Foundation & Self Introduction",
        activities: [
          "Prepare 2-minute self-intro",
          "Review project details",
          "Solve 10 easy DSA problems",
        ],
      },
      {
        week: 2,
        focus: "Technical Deep Dive",
        activities: [
          "Solve 15 medium DSA problems",
          "Review CS fundamentals",
          "Practice coding questions",
        ],
      },
      {
        week: 3,
        focus: "Mock Interviews",
        activities: [
          "3 mock interviews on Pramp",
          "Record yourself answering questions",
          "Work on communication style",
        ],
      },
      {
        week: 4,
        focus: "Final Polish",
        activities: [
          "Review all weak areas",
          "Full dress rehearsal interview",
          "Prepare thoughtful questions",
        ],
      },
    ],
  };

  const systemPrompt = `You are an expert interview coach for software engineering internships in India. Create comprehensive, practical interview preparation plans. Respond with ONLY valid JSON.`;

  const userPrompt = `Create interview preparation plan for:
- Target Role: ${targetRole}
- Current Skills: ${skills.join(", ")}
- Weak Areas: ${weakAreas.join(", ")}

Return JSON:
{
  "technical_topics": ["topic1", "topic2"],
  "behavioral_topics": ["topic1", "topic2"],
  "mock_interview_schedule": ["week1", "week2", "week3", "week4"],
  "company_specific_tips": ["tip1", "tip2"],
  "resources": ["resource1", "resource2"],
  "weekly_plan": [
    {"week": 1, "focus": "focus area", "activities": ["activity1", "activity2"]}
  ]
}`;

  return callGroqWithSchema(
    systemPrompt,
    userPrompt,
    InterviewPlanSchema,
    fallback
  );
}

// =====================================================
// GENERATE DSA PLAN
// =====================================================

export async function generateDSAPlan(
  codingScore: number,
  targetRole: string
): Promise<z.infer<typeof DSAPlanSchema>> {
  const fallback: z.infer<typeof DSAPlanSchema> = {
    weak_areas: [
      "Dynamic Programming",
      "Graph Algorithms",
      "Tree Traversals",
      "Binary Search variations",
    ],
    daily_problems: codingScore < 40 ? 2 : codingScore < 70 ? 3 : 5,
    topics_to_cover: [
      {
        topic: "Arrays & Strings",
        priority: "high",
        estimated_days: 7,
        resources: ["LeetCode Arrays", "NeetCode Arrays playlist"],
      },
      {
        topic: "Linked Lists",
        priority: "high",
        estimated_days: 5,
        resources: ["LeetCode LinkedList", "GeeksforGeeks"],
      },
      {
        topic: "Trees & Binary Search Trees",
        priority: "high",
        estimated_days: 10,
        resources: ["Striver's Tree Sheet", "LeetCode Trees"],
      },
      {
        topic: "Dynamic Programming",
        priority: "medium",
        estimated_days: 14,
        resources: ["Aditya Verma DP Playlist", "LeetCode DP"],
      },
      {
        topic: "Graphs",
        priority: "medium",
        estimated_days: 10,
        resources: ["Striver's Graph Series", "LeetCode Graphs"],
      },
    ],
    platforms: ["LeetCode", "GeeksforGeeks", "HackerRank", "Codeforces"],
    milestones: [
      "50 easy problems solved",
      "30 medium problems solved",
      "5 hard problems attempted",
      "Complete Striver's SDE Sheet",
    ],
    weekly_schedule: [
      { week: 1, topics: ["Arrays", "Strings"], problem_count: 15 },
      { week: 2, topics: ["Linked Lists", "Stacks"], problem_count: 15 },
      { week: 3, topics: ["Trees", "BST"], problem_count: 15 },
      { week: 4, topics: ["Graphs", "BFS/DFS"], problem_count: 15 },
    ],
  };

  const systemPrompt = `You are an expert DSA coach for competitive programming and technical interviews. Create structured DSA learning plans. Respond with ONLY valid JSON.`;

  const userPrompt = `Create DSA improvement plan for:
- Current Coding Score: ${codingScore}/100
- Target Role: ${targetRole}

Return JSON:
{
  "weak_areas": ["area1", "area2"],
  "daily_problems": <number>,
  "topics_to_cover": [
    {"topic": "name", "priority": "high|medium|low", "estimated_days": <number>, "resources": ["r1", "r2"]}
  ],
  "platforms": ["platform1", "platform2"],
  "milestones": ["milestone1", "milestone2"],
  "weekly_schedule": [
    {"week": 1, "topics": ["t1", "t2"], "problem_count": <number>}
  ]
}`;

  return callGroqWithSchema(systemPrompt, userPrompt, DSAPlanSchema, fallback);
}

// =====================================================
// GENERATE INTERNSHIP RECOMMENDATIONS
// =====================================================

export async function generateInternshipRecommendations(
  profile: {
    skills: string[];
    target_role: string;
    cgpa: number;
    branch: string;
    year: number;
  },
  matchedInternships: Array<{ title: string; company: string; match: number }>
): Promise<{ recommendations: string[]; next_steps: string[] }> {
  const fallback = {
    recommendations: [
      "Apply to startups for higher acceptance rates",
      "Build a strong GitHub portfolio",
      "Get referrals through LinkedIn connections",
      "Apply to 20+ internships to increase chances",
      "Prepare domain-specific projects",
    ],
    next_steps: [
      "Complete your profile to 100%",
      "Upload and optimize your resume",
      "Take at least 3 skill assessments",
      "Solve 50+ DSA problems",
      "Build 2 full-stack projects",
    ],
  };

  return fallback;
}
