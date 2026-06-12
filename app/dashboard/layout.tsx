"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, User, FileText, Code2, Brain, Target,
  Lightbulb, Briefcase, Users, BarChart3, Settings,
  LogOut, Bell, Menu, X, ChevronRight, Moon, Sun,
  ClipboardList, BookOpen, Trophy, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User as UserType, UserRole } from "@/types";

type EnsureUserResponse = {
  data?: UserType;
  success: boolean;
  error?: string;
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
    { label: "My Profile", href: "/dashboard/student/profile", icon: User },
    { label: "Resume Analyzer", href: "/dashboard/student/resume", icon: FileText },
    { label: "Skill Assessments", href: "/dashboard/student/assessments", icon: ClipboardList },
    { label: "Coding Practice", href: "/dashboard/student/coding", icon: Code2 },
    { label: "Aptitude Test", href: "/dashboard/student/aptitude", icon: Brain },
    { label: "Readiness Score", href: "/dashboard/student/readiness", icon: Target },
    { label: "AI Recommendations", href: "/dashboard/student/recommendations", icon: Lightbulb },
    { label: "Internships", href: "/dashboard/student/internships", icon: Briefcase },
  ],
  trainer: [
    { label: "Dashboard", href: "/dashboard/trainer", icon: LayoutDashboard },
    { label: "Students", href: "/dashboard/trainer/students", icon: Users },
    { label: "Batches", href: "/dashboard/trainer/batches", icon: Briefcase },
    { label: "Assessments", href: "/dashboard/trainer/assessments", icon: ClipboardList },
    { label: "Analytics", href: "/dashboard/trainer/analytics", icon: BarChart3 },
  ],
  placement_officer: [
    { label: "Dashboard", href: "/dashboard/placement", icon: LayoutDashboard },
    { label: "Placement Overview", href: "/dashboard/placement/overview", icon: Trophy },
    { label: "Analytics", href: "/dashboard/placement/analytics", icon: BarChart3 },
    { label: "Reports", href: "/dashboard/placement/reports", icon: FileText },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "User Management", href: "/dashboard/admin/users", icon: Users },
    { label: "Assessments", href: "/dashboard/admin/assessments", icon: ClipboardList },
    { label: "Coding Questions", href: "/dashboard/admin/coding", icon: Code2 },
    { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
    { label: "Audit Logs", href: "/dashboard/admin/logs", icon: Shield },
  ],
};

const ROLE_COLORS: Record<UserRole, string> = {
  student: "from-iran-500 to-violet-500",
  trainer: "from-emerald-500 to-teal-500",
  placement_officer: "from-amber-500 to-orange-500",
  admin: "from-rose-500 to-pink-500",
};

const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  trainer: "Trainer",
  placement_officer: "Placement Officer",
  admin: "Administrator",
};

function generateInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/auth/login");
          return;
        }

        const response = await fetch("/api/auth/ensure-user", { method: "POST" });
        const result = (await response.json().catch(() => null)) as EnsureUserResponse | null;

        if (response.ok && result?.data) {
          setUser(result.data);
          return;
        }

        setUser({
          id: authUser.id,
          auth_id: authUser.id,
          email: authUser.email ?? "",
          full_name: authUser.user_metadata?.full_name ?? authUser.email ?? "User",
          role: "student",
          avatar_url: undefined,
          is_active: true,
          email_verified: Boolean(authUser.email_confirmed_at),
          last_login: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserType);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-iran-500 to-violet-500 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const role = (user?.role ?? "student") as UserRole;
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.student;
  const roleColor = ROLE_COLORS[role];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/50">
        <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${roleColor} flex items-center justify-center shrink-0`}>
          <span className="text-xs font-bold text-white">IR</span>
        </div>
        <div>
          <p className="text-sm font-semibold">IRAN</p>
          <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[role]}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard/student" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "nav-item",
                isActive && "active text-foreground bg-accent"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-sm">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      {user && (
        <div className="border-t border-border/50 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 w-full rounded-lg p-2 hover:bg-accent transition-colors text-left">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={user.avatar_url ?? ""} />
                  <AvatarFallback className={`bg-gradient-to-br ${roleColor} text-white text-xs`}>
                    {generateInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user.full_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border/50 shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-56 bg-background border-r border-border/50 flex flex-col md:hidden"
            >
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 shrink-0 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="hidden md:block">
              <h2 className="text-sm font-medium text-muted-foreground">
                {navItems.find((n) => pathname === n.href || (n.href !== "/dashboard/student" && pathname.startsWith(n.href)))?.label ?? "Dashboard"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-iran-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
