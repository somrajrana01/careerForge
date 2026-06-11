// =====================================================
// IRAN - Seed Data Script
// Run: npx ts-node supabase/seed/seed.ts
// =====================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// =====================================================
// SAMPLE INTERNSHIPS
// =====================================================

const internships = [
  {
    company_name: "Google",
    title: "Software Engineering Intern",
    description: "Work on Google's core infrastructure products. You'll collaborate with engineers to design and build scalable systems.",
    required_skills: ["Python", "Java", "C++", "Data Structures", "Algorithms"],
    preferred_skills: ["Machine Learning", "Distributed Systems", "Go"],
    location: "Bengaluru",
    is_remote: false,
    duration_months: 3,
    stipend_min: 80000,
    stipend_max: 120000,
    openings: 10,
    category: "Software Development",
    min_cgpa: 7.5,
    eligible_branches: ["Computer Science Engineering", "Information Technology", "Electronics and Communication Engineering"],
    eligible_years: [3, 4],
  },
  {
    company_name: "Microsoft",
    title: "Frontend Developer Intern",
    description: "Build next-generation web experiences for Microsoft 365 products used by millions.",
    required_skills: ["JavaScript", "TypeScript", "React", "CSS", "HTML"],
    preferred_skills: ["Next.js", "TailwindCSS", "GraphQL", "Testing"],
    location: "Hyderabad",
    is_remote: true,
    duration_months: 6,
    stipend_min: 70000,
    stipend_max: 100000,
    openings: 5,
    category: "Frontend Development",
    min_cgpa: 7.0,
    eligible_branches: ["Computer Science Engineering", "Information Technology"],
    eligible_years: [3, 4],
  },
  {
    company_name: "Amazon",
    title: "Backend Engineering Intern",
    description: "Design and implement features for Amazon's e-commerce platform and AWS services.",
    required_skills: ["Java", "Python", "REST API", "SQL", "System Design"],
    preferred_skills: ["AWS", "Docker", "Kubernetes", "Microservices"],
    location: "Bengaluru",
    is_remote: false,
    duration_months: 3,
    stipend_min: 90000,
    stipend_max: 130000,
    openings: 8,
    category: "Backend Development",
    min_cgpa: 7.0,
    eligible_branches: ["Computer Science Engineering", "Information Technology", "Electronics and Communication Engineering"],
    eligible_years: [3, 4],
  },
  {
    company_name: "Flipkart",
    title: "Full Stack Developer Intern",
    description: "Build scalable features for India's largest e-commerce platform.",
    required_skills: ["JavaScript", "React", "Node.js", "MongoDB", "SQL"],
    preferred_skills: ["TypeScript", "Docker", "Redis", "Kafka"],
    location: "Bengaluru",
    is_remote: false,
    duration_months: 6,
    stipend_min: 50000,
    stipend_max: 80000,
    openings: 15,
    category: "Full Stack Development",
    min_cgpa: 6.5,
    eligible_branches: ["Computer Science Engineering", "Information Technology"],
    eligible_years: [2, 3, 4],
  },
  {
    company_name: "Zomato",
    title: "ML Engineering Intern",
    description: "Work on recommendation systems and demand forecasting models.",
    required_skills: ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics"],
    preferred_skills: ["PyTorch", "Spark", "Airflow", "MLflow"],
    location: "Gurugram",
    is_remote: true,
    duration_months: 4,
    stipend_min: 45000,
    stipend_max: 70000,
    openings: 5,
    category: "Machine Learning",
    min_cgpa: 7.5,
    eligible_branches: ["Computer Science Engineering", "Data Science", "Artificial Intelligence & ML"],
    eligible_years: [3, 4],
  },
  {
    company_name: "Razorpay",
    title: "Backend Engineer Intern",
    description: "Build payment infrastructure that processes millions of transactions daily.",
    required_skills: ["Java", "Python", "REST API", "PostgreSQL", "Redis"],
    preferred_skills: ["Kafka", "Docker", "AWS", "Microservices"],
    location: "Bengaluru",
    is_remote: false,
    duration_months: 6,
    stipend_min: 60000,
    stipend_max: 90000,
    openings: 6,
    category: "Backend Development",
    min_cgpa: 7.0,
    eligible_branches: ["Computer Science Engineering", "Information Technology"],
    eligible_years: [3, 4],
  },
  {
    company_name: "Swiggy",
    title: "Android Developer Intern",
    description: "Develop features for the Swiggy Android app used by 10M+ users.",
    required_skills: ["Kotlin", "Android", "Java", "REST API", "Git"],
    preferred_skills: ["Jetpack Compose", "MVVM", "Coroutines", "Room"],
    location: "Bengaluru",
    is_remote: false,
    duration_months: 3,
    stipend_min: 45000,
    stipend_max: 65000,
    openings: 4,
    category: "Mobile Development",
    min_cgpa: 6.5,
    eligible_branches: ["Computer Science Engineering", "Information Technology"],
    eligible_years: [3, 4],
  },
  {
    company_name: "CRED",
    title: "Data Science Intern",
    description: "Analyze user behavior data to improve credit score models and personalization.",
    required_skills: ["Python", "SQL", "Pandas", "Data Analysis", "Statistics"],
    preferred_skills: ["Machine Learning", "Tableau", "Spark", "A/B Testing"],
    location: "Bengaluru",
    is_remote: true,
    duration_months: 3,
    stipend_min: 40000,
    stipend_max: 60000,
    openings: 3,
    category: "Data Science",
    min_cgpa: 7.0,
    eligible_branches: ["Computer Science Engineering", "Data Science", "Artificial Intelligence & ML"],
    eligible_years: [3, 4],
  },
  {
    company_name: "Infosys",
    title: "Software Developer Trainee",
    description: "Enterprise software development training program.",
    required_skills: ["Java", "SQL", "OOP", "Git"],
    preferred_skills: ["Spring Boot", "Angular", "Agile"],
    location: "Mysuru",
    is_remote: false,
    duration_months: 12,
    stipend_min: 25000,
    stipend_max: 40000,
    openings: 100,
    category: "Software Development",
    min_cgpa: 6.0,
    eligible_branches: ["Any"],
    eligible_years: [4],
  },
  {
    company_name: "TCS",
    title: "Ninja Intern",
    description: "Learn enterprise technologies with TCS Global Learning Campus.",
    required_skills: ["Java", "Python", "C", "SQL", "Data Structures"],
    preferred_skills: ["Cloud", "DevOps", "Agile"],
    location: "Multiple Locations",
    is_remote: false,
    duration_months: 6,
    stipend_min: 20000,
    stipend_max: 35000,
    openings: 200,
    category: "Software Development",
    min_cgpa: 5.5,
    eligible_branches: ["Any"],
    eligible_years: [4],
  },
];

// =====================================================
// SAMPLE CODING QUESTIONS
// =====================================================

const codingQuestions = [
  {
    title: "Two Sum",
    problem_statement: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.`,
    difficulty: "easy",
    tags: ["Array", "Hash Table"],
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
    sample_input: "nums = [2,7,11,15], target = 9",
    sample_output: "[0,1]",
    explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    hints: ["Use a hash map to store seen values", "For each element, check if target - element exists in hash map"],
  },
  {
    title: "Valid Parentheses",
    problem_statement: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    difficulty: "easy",
    tags: ["Stack", "String"],
    sample_input: "s = \"()[]{}\"",
    sample_output: "true",
    hints: ["Use a stack", "Push opening brackets, pop when closing"],
  },
  {
    title: "Longest Substring Without Repeating Characters",
    problem_statement: "Given a string s, find the length of the longest substring without repeating characters.",
    difficulty: "medium",
    tags: ["Sliding Window", "Hash Table", "String"],
    constraints: "0 <= s.length <= 5 * 10^4",
    sample_input: "s = \"abcabcbb\"",
    sample_output: "3",
    explanation: "The answer is 'abc', with the length of 3.",
    hints: ["Use sliding window technique", "Use a set or map to track characters"],
  },
  {
    title: "Merge Two Sorted Lists",
    problem_statement: "You are given the heads of two sorted linked lists list1 and list2.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.",
    difficulty: "easy",
    tags: ["Linked List", "Recursion"],
    sample_input: "list1 = [1,2,4], list2 = [1,3,4]",
    sample_output: "[1,1,2,3,4,4]",
    hints: ["Use a dummy head node", "Compare heads of both lists iteratively"],
  },
  {
    title: "Maximum Subarray",
    problem_statement: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    difficulty: "medium",
    tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
    sample_input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
    sample_output: "6",
    explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
    hints: ["Kadane's Algorithm", "Keep track of current sum and max sum"],
  },
  {
    title: "Binary Tree Level Order Traversal",
    problem_statement: "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
    difficulty: "medium",
    tags: ["Tree", "BFS", "Queue"],
    sample_input: "root = [3,9,20,null,null,15,7]",
    sample_output: "[[3],[9,20],[15,7]]",
    hints: ["Use BFS with a queue", "Track level boundaries"],
  },
  {
    title: "Climbing Stairs",
    problem_statement: "You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    difficulty: "easy",
    tags: ["Dynamic Programming", "Math", "Memoization"],
    sample_input: "n = 3",
    sample_output: "3",
    explanation: "1+1+1, 1+2, 2+1",
    hints: ["This is similar to Fibonacci", "dp[i] = dp[i-1] + dp[i-2]"],
  },
  {
    title: "Word Search",
    problem_statement: "Given an m x n grid of characters board and a string word, return true if word exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.",
    difficulty: "medium",
    tags: ["Backtracking", "DFS", "Matrix"],
    sample_input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"",
    sample_output: "true",
    hints: ["Use DFS + backtracking", "Mark visited cells during DFS"],
  },
  {
    title: "LRU Cache",
    problem_statement: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.\n- int get(int key) Return the value of the key if it exists, otherwise return -1.\n- void put(int key, int value) Update or insert the value. Evict the LRU key if capacity is reached.",
    difficulty: "hard",
    tags: ["Hash Table", "Linked List", "Design"],
    constraints: "1 <= capacity <= 3000\nAll operations must be O(1)",
    hints: ["Use HashMap + Doubly Linked List", "Move accessed nodes to front"],
  },
  {
    title: "Merge K Sorted Lists",
    problem_statement: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.",
    difficulty: "hard",
    tags: ["Linked List", "Heap", "Divide and Conquer"],
    hints: ["Use a min-heap of size k", "Or use divide and conquer approach"],
  },
];

// =====================================================
// SKILL ASSESSMENTS
// =====================================================

const sampleAssessments = [
  {
    title: "JavaScript Fundamentals",
    description: "Test your JavaScript knowledge including closures, prototypes, async/await, and ES6+ features.",
    type: "skill",
    category: "JavaScript",
    difficulty: "medium",
    duration_minutes: 30,
    passing_score: 60,
    is_timed: true,
    tags: ["JavaScript", "Frontend", "Web"],
    questions: [
      {
        question_text: "What is the output of: console.log(typeof null)?",
        options: [{ id: "A", text: "null" }, { id: "B", text: "object" }, { id: "C", text: "undefined" }, { id: "D", text: "string" }],
        correct_answer: "B",
        explanation: "typeof null returns 'object' — a historical bug in JavaScript",
        difficulty: "easy",
      },
      {
        question_text: "Which method returns a new array without modifying the original?",
        options: [{ id: "A", text: "push()" }, { id: "B", text: "splice()" }, { id: "C", text: "map()" }, { id: "D", text: "sort()" }],
        correct_answer: "C",
        explanation: "map() creates and returns a new array",
        difficulty: "easy",
      },
      {
        question_text: "What is a closure in JavaScript?",
        options: [
          { id: "A", text: "A function that takes another function as argument" },
          { id: "B", text: "A function that remembers its outer scope even after the outer function returns" },
          { id: "C", text: "An immediately invoked function expression" },
          { id: "D", text: "A method to close browser connections" },
        ],
        correct_answer: "B",
        difficulty: "medium",
      },
      {
        question_text: "What does Promise.all() do?",
        options: [
          { id: "A", text: "Runs promises sequentially" },
          { id: "B", text: "Returns the first resolved promise" },
          { id: "C", text: "Runs promises in parallel and resolves when all resolve" },
          { id: "D", text: "Catches all rejected promises" },
        ],
        correct_answer: "C",
        difficulty: "medium",
      },
      {
        question_text: "What is event delegation?",
        options: [
          { id: "A", text: "Adding event listeners to each child element" },
          { id: "B", text: "Using a parent element to handle events from children" },
          { id: "C", text: "Preventing default browser behavior" },
          { id: "D", text: "Creating custom browser events" },
        ],
        correct_answer: "B",
        difficulty: "medium",
      },
    ],
  },
  {
    title: "Python Basics Assessment",
    description: "Core Python concepts including data structures, OOP, decorators, and generators.",
    type: "skill",
    category: "Python",
    difficulty: "easy",
    duration_minutes: 25,
    passing_score: 60,
    is_timed: true,
    tags: ["Python", "Programming"],
    questions: [
      {
        question_text: "Which is NOT a valid Python data type?",
        options: [{ id: "A", text: "list" }, { id: "B", text: "tuple" }, { id: "C", text: "array" }, { id: "D", text: "dict" }],
        correct_answer: "C",
        difficulty: "easy",
        explanation: "'array' is not a built-in Python type (use list instead or import array module)",
      },
      {
        question_text: "What is the difference between a list and a tuple?",
        options: [
          { id: "A", text: "Lists are ordered, tuples are not" },
          { id: "B", text: "Lists are mutable, tuples are immutable" },
          { id: "C", text: "Lists can hold multiple types, tuples cannot" },
          { id: "D", text: "There is no difference" },
        ],
        correct_answer: "B",
        difficulty: "easy",
      },
      {
        question_text: "What does the 'self' parameter in Python class methods represent?",
        options: [
          { id: "A", text: "The class itself" },
          { id: "B", text: "The current instance of the class" },
          { id: "C", text: "A static method" },
          { id: "D", text: "The parent class" },
        ],
        correct_answer: "B",
        difficulty: "easy",
      },
    ],
  },
  {
    title: "Aptitude Test — Quantitative",
    description: "Quantitative reasoning test covering arithmetic, algebra, and problem solving.",
    type: "aptitude",
    category: "Quantitative",
    difficulty: "medium",
    duration_minutes: 30,
    passing_score: 60,
    is_timed: true,
    tags: ["Aptitude", "Quantitative"],
    questions: [
      {
        question_text: "If a train travels 360 km in 4 hours, what is its speed in m/s?",
        options: [{ id: "A", text: "25 m/s" }, { id: "B", text: "90 m/s" }, { id: "C", text: "100 m/s" }, { id: "D", text: "15 m/s" }],
        correct_answer: "A",
        explanation: "Speed = 360/4 = 90 km/h = 90 × 1000/3600 = 25 m/s",
        difficulty: "easy",
        section: "quantitative",
      },
      {
        question_text: "A can complete a work in 12 days, B in 15 days. Together, how many days to complete?",
        options: [{ id: "A", text: "6.67 days" }, { id: "B", text: "7 days" }, { id: "C", text: "8 days" }, { id: "D", text: "9 days" }],
        correct_answer: "A",
        explanation: "Combined rate = 1/12 + 1/15 = 9/60. Days = 60/9 ≈ 6.67",
        difficulty: "medium",
        section: "quantitative",
      },
      {
        question_text: "What is the next number: 2, 6, 12, 20, 30, ?",
        options: [{ id: "A", text: "40" }, { id: "B", text: "42" }, { id: "C", text: "45" }, { id: "D", text: "38" }],
        correct_answer: "B",
        explanation: "Pattern: n(n+1). 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42",
        difficulty: "medium",
        section: "logical",
      },
    ],
  },
  {
    title: "Data Structures & Algorithms",
    description: "Test your DSA knowledge — arrays, trees, graphs, sorting, and complexity analysis.",
    type: "skill",
    category: "DSA",
    difficulty: "hard",
    duration_minutes: 45,
    passing_score: 60,
    is_timed: true,
    tags: ["DSA", "Algorithms", "Computer Science"],
    questions: [
      {
        question_text: "What is the time complexity of Binary Search?",
        options: [{ id: "A", text: "O(n)" }, { id: "B", text: "O(log n)" }, { id: "C", text: "O(n log n)" }, { id: "D", text: "O(1)" }],
        correct_answer: "B",
        explanation: "Binary search halves the search space each time → O(log n)",
        difficulty: "easy",
      },
      {
        question_text: "Which data structure uses LIFO (Last In First Out)?",
        options: [{ id: "A", text: "Queue" }, { id: "B", text: "Heap" }, { id: "C", text: "Stack" }, { id: "D", text: "Graph" }],
        correct_answer: "C",
        difficulty: "easy",
      },
      {
        question_text: "What is the worst-case time complexity of QuickSort?",
        options: [{ id: "A", text: "O(n log n)" }, { id: "B", text: "O(n²)" }, { id: "C", text: "O(log n)" }, { id: "D", text: "O(n)" }],
        correct_answer: "B",
        explanation: "When pivot is always the min/max element → O(n²)",
        difficulty: "medium",
      },
      {
        question_text: "In a BST, what is the time complexity of search in best case?",
        options: [{ id: "A", text: "O(n)" }, { id: "B", text: "O(log n)" }, { id: "C", text: "O(1)" }, { id: "D", text: "O(n log n)" }],
        correct_answer: "C",
        explanation: "Best case: element is at root → O(1)",
        difficulty: "medium",
      },
    ],
  },
];

// =====================================================
// SEED FUNCTION
// =====================================================

async function seed() {
  console.log("🌱 Starting IRAN database seed...\n");

  // Step 1: Get or create admin user
  let adminUserId: string;
  const { data: existingAdmin } = await supabase
    .from("users")
    .select("id")
    .eq("email", "admin@iran.dev")
    .single();

  if (existingAdmin) {
    adminUserId = existingAdmin.id;
    console.log("✅ Admin user found:", adminUserId);
  } else {
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: "admin@iran.dev",
      password: "demo1234",
      email_confirm: true,
    });
    if (!authUser.user) { console.error("Failed to create admin auth user"); return; }

    const { data: newAdmin } = await supabase.from("users").insert({
      auth_id: authUser.user.id,
      email: "admin@iran.dev",
      full_name: "System Admin",
      role: "admin",
      email_verified: true,
    }).select().single();

    adminUserId = newAdmin!.id;
    console.log("✅ Created admin user:", adminUserId);
  }

  // Step 2: Seed internships
  console.log("\n📋 Seeding internships...");
  for (const internship of internships) {
    const { error } = await supabase.from("internships").upsert(
      { ...internship, is_active: true, apply_url: `https://careers.${internship.company_name.toLowerCase().replace(/\s/g, "")}.com` },
      { onConflict: "title,company_name" }
    );
    if (error) console.error("  ❌ Error:", error.message);
    else console.log(`  ✅ ${internship.company_name} - ${internship.title}`);
  }

  // Step 3: Seed coding questions
  console.log("\n💻 Seeding coding questions...");
  const { data: existingCreator } = await supabase.from("users").select("id").eq("role", "admin").limit(1).single();
  const creatorId = existingCreator?.id ?? adminUserId;

  for (const q of codingQuestions) {
    const { error } = await supabase.from("coding_questions").upsert(
      { ...q, created_by: creatorId, is_active: true, hints: q.hints ?? [], time_limit_ms: 2000, memory_limit_mb: 256 },
      { onConflict: "title" }
    );
    if (error) console.error("  ❌ Error:", error.message);
    else console.log(`  ✅ ${q.title} (${q.difficulty})`);
  }

  // Step 4: Seed assessments
  console.log("\n📝 Seeding assessments...");
  for (const assessment of sampleAssessments) {
    const { questions: qs, ...assessmentData } = assessment;

    const { data: existingAss } = await supabase.from("assessments").select("id").eq("title", assessmentData.title).single();
    let assessmentId: string;

    if (existingAss) {
      assessmentId = existingAss.id;
    } else {
      const { data: newAss, error } = await supabase.from("assessments").insert({
        ...assessmentData,
        created_by: creatorId,
        is_active: true,
        randomize_questions: false,
        total_questions: qs.length,
      }).select().single();

      if (error) { console.error("  ❌ Error:", error.message); continue; }
      assessmentId = newAss!.id;
    }

    // Seed questions
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      await supabase.from("questions").upsert({
        assessment_id: assessmentId,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation ?? null,
        difficulty: q.difficulty as any,
        section: (q as any).section ?? null,
        marks: 1,
        order_index: i,
        tags: [],
      }, { onConflict: "assessment_id,order_index" });
    }

    console.log(`  ✅ ${assessmentData.title} (${qs.length} questions)`);
  }

  // Step 5: Create demo student
  console.log("\n👤 Creating demo student...");
  const { data: existingStudent } = await supabase.from("users").select("id").eq("email", "student@iran.dev").single();
  if (!existingStudent) {
    const { data: authStudent } = await supabase.auth.admin.createUser({
      email: "student@iran.dev",
      password: "demo1234",
      email_confirm: true,
    });
    if (authStudent.user) {
      const { data: studentUser } = await supabase.from("users").insert({
        auth_id: authStudent.user.id,
        email: "student@iran.dev",
        full_name: "Arjun Sharma",
        role: "student",
        email_verified: true,
      }).select().single();

      if (studentUser) {
        await supabase.from("student_profiles").insert({
          user_id: studentUser.id,
          institution: "Indian Institute of Technology, Delhi",
          degree: "B.Tech",
          branch: "Computer Science Engineering",
          year_of_study: 3,
          graduation_year: 2025,
          cgpa: 8.2,
          skills: ["JavaScript", "Python", "React", "Node.js", "SQL", "Git", "HTML/CSS"],
          target_role: "Software Development Intern",
          github_url: "https://github.com/arjunsharma",
          linkedin_url: "https://linkedin.com/in/arjunsharma",
          bio: "Passionate CS student at IIT Delhi with interest in full-stack development and ML.",
          profile_completion: 75,
          languages: ["English", "Hindi"],
          target_companies: ["Google", "Microsoft", "Amazon"],
        });
        console.log("  ✅ Demo student created: student@iran.dev / demo1234");
      }
    }
  } else {
    console.log("  ✅ Demo student already exists");
  }

  // Create demo trainer
  const { data: existingTrainer } = await supabase.from("users").select("id").eq("email", "trainer@iran.dev").single();
  if (!existingTrainer) {
    const { data: authTrainer } = await supabase.auth.admin.createUser({
      email: "trainer@iran.dev",
      password: "demo1234",
      email_confirm: true,
    });
    if (authTrainer.user) {
      await supabase.from("users").insert({
        auth_id: authTrainer.user.id,
        email: "trainer@iran.dev",
        full_name: "Prof. Rajesh Kumar",
        role: "trainer",
        email_verified: true,
      });
      console.log("  ✅ Demo trainer created: trainer@iran.dev / demo1234");
    }
  }

  console.log("\n🎉 Seed complete!");
  console.log("\nDemo credentials:");
  console.log("  Student:  student@iran.dev / demo1234");
  console.log("  Trainer:  trainer@iran.dev / demo1234");
  console.log("  Admin:    admin@iran.dev / demo1234");
}

seed().catch(console.error);
