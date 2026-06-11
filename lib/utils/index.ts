import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ReadinessCategory } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getReadinessCategoryInfo(
  category: ReadinessCategory
): { label: string; color: string; bg: string; description: string } {
  const map = {
    not_ready: {
      label: "Not Ready",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      description: "Significant improvements needed before applying",
    },
    needs_improvement: {
      label: "Needs Improvement",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      description: "Getting closer — keep working on key areas",
    },
    internship_ready: {
      label: "Internship Ready",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      description: "Ready to apply for internships",
    },
    highly_ready: {
      label: "Highly Ready",
      color: "text-iran-400",
      bg: "bg-iran-500/10 border-iran-500/20",
      description: "Excellent candidate — target top companies",
    },
  };
  return map[category];
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-iran-400";
  if (score >= 40) return "text-amber-400";
  return "text-rose-400";
}

export function getScoreGradient(score: number): string {
  if (score >= 80) return "from-emerald-500 to-teal-500";
  if (score >= 60) return "from-iran-500 to-violet-500";
  if (score >= 40) return "from-amber-500 to-orange-500";
  return "from-rose-500 to-red-500";
}

export function getDifficultyColor(difficulty: string): string {
  const map: Record<string, string> = {
    easy: "text-emerald-400 bg-emerald-500/10",
    medium: "text-amber-400 bg-amber-500/10",
    hard: "text-rose-400 bg-rose-500/10",
  };
  return map[difficulty] ?? "text-muted-foreground";
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function generateInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function parseSkillsFromText(text: string): string[] {
  // Common tech skills to look for
  const knownSkills = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
    "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express", "FastAPI",
    "Django", "Flask", "Spring Boot", "MongoDB", "PostgreSQL", "MySQL",
    "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Git", "GitHub",
    "REST API", "GraphQL", "HTML", "CSS", "TailwindCSS", "Sass",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
    "Data Analysis", "Pandas", "NumPy", "SQL", "NoSQL", "Linux",
  ];

  const found: string[] = [];
  const upperText = text.toUpperCase();

  for (const skill of knownSkills) {
    if (upperText.includes(skill.toUpperCase())) {
      found.push(skill);
    }
  }

  return [...new Set(found)];
}

export function generateColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#22c55e", "#14b8a6",
    "#06b6d4", "#3b82f6",
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PROGRAMMING_LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh",
];

export const ENGINEERING_BRANCHES = [
  "Computer Science Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Data Science",
  "Artificial Intelligence & ML",
  "Cyber Security",
];

export const COMMON_TECH_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++",
  "React", "Next.js", "Node.js", "Express", "FastAPI",
  "MongoDB", "PostgreSQL", "MySQL", "Redis",
  "Docker", "Kubernetes", "AWS", "Git",
  "Machine Learning", "Deep Learning", "Data Analysis",
  "REST API", "GraphQL", "HTML/CSS", "TailwindCSS",
];
