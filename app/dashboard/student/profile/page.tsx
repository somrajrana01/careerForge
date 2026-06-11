"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Github,
  Linkedin,
  Globe,
  GraduationCap,
  Code,
  Plus,
  X,
  Loader2,
  Save,
  Award,
  FolderOpen,
  CheckCircle2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { ENGINEERING_BRANCHES, COMMON_TECH_SKILLS, INDIAN_STATES } from "@/lib/utils";
import type { StudentProfile, Certification, Project } from "@/types";

const profileSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  institution: z.string().optional(),
  degree: z.string().optional(),
  branch: z.string().optional(),
  year_of_study: z.coerce.number().min(1).max(6).optional(),
  graduation_year: z.coerce.number().min(2020).max(2030).optional(),
  cgpa: z.coerce.number().min(0).max(10).optional(),
  target_role: z.string().optional(),
  github_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  linkedin_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  portfolio_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddCert, setShowAddCert] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated. Please log in again.");
        return;
      }

      try {
        await fetch("/api/auth/ensure-user", { method: "POST" });
      } catch {
        // keep going
      }

      const { data: userData, error: userLookupError } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (userLookupError) {
        console.error("Failed to load user row:", userLookupError);
      }

      const appUserId = userData?.id ?? user.id;
      setUserId(appUserId);

      const defaultName = userData?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "";

      const { data: profileData } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", appUserId)
        .maybeSingle();

      if (profileData) {
        const p = profileData as StudentProfile;
        setProfile(p);
        setSkills(p.skills ?? []);
        reset({
          full_name: defaultName,
          phone: p.phone ?? "",
          institution: p.institution ?? "",
          degree: p.degree ?? "",
          branch: p.branch ?? "",
          year_of_study: p.year_of_study,
          graduation_year: p.graduation_year,
          cgpa: p.cgpa,
          target_role: p.target_role ?? "",
          github_url: p.github_url ?? "",
          linkedin_url: p.linkedin_url ?? "",
          portfolio_url: p.portfolio_url ?? "",
          bio: p.bio ?? "",
          city: p.city ?? "",
          state: p.state ?? "",
        });
      } else {
        setProfile({ user_id: appUserId, profile_completion: 0 } as StudentProfile);
        setSkills([]);
        reset({
          full_name: defaultName,
          phone: "",
          institution: "",
          degree: "",
          branch: "",
          year_of_study: undefined,
          graduation_year: undefined,
          cgpa: undefined,
          target_role: "",
          github_url: "",
          linkedin_url: "",
          portfolio_url: "",
          bio: "",
          city: "",
          state: "",
        });
      }

      const { data: certsData } = await supabase
        .from("certifications")
        .select("*")
        .eq("user_id", appUserId)
        .order("created_at", { ascending: false });

      setCertifications((certsData ?? []) as Certification[]);

      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", appUserId)
        .order("created_at", { ascending: false });

      setProjects((projectsData ?? []) as Project[]);
    } catch (err) {
      console.error("Profile load error:", err);
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  }, [reset, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      if (!userId) {
        throw new Error("Missing user id");
      }

      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ full_name: data.full_name })
        .eq("id", userId);

      if (userUpdateError) {
        console.warn("User name update failed:", userUpdateError);
      }

      const profilePayload = {
        user_id: userId,
        phone: data.phone || null,
        institution: data.institution || null,
        degree: data.degree || null,
        branch: data.branch || null,
        year_of_study: data.year_of_study || null,
        graduation_year: data.graduation_year || null,
        cgpa: data.cgpa || null,
        target_role: data.target_role || null,
        github_url: data.github_url || null,
        linkedin_url: data.linkedin_url || null,
        portfolio_url: data.portfolio_url || null,
        bio: data.bio || null,
        city: data.city || null,
        state: data.state || null,
        skills,
      };

      const { error } = await supabase
        .from("student_profiles")
        .upsert(profilePayload, { onConflict: "user_id" });

      if (error) throw error;

      await fetch("/api/profile/completion", { method: "POST" });

      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });

      loadData();
    } catch {
      toast({
        title: "Save failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton" />
        <div className="h-96 skeleton rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border-rose-500/30 bg-rose-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-sm text-rose-400">Error Loading Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={loadData}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Complete your profile to improve your readiness score</p>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Profile Completion</span>
          <span className="text-sm font-bold text-iran-400">{profile?.profile_completion ?? 0}%</span>
        </div>
        <Progress value={profile?.profile_completion ?? 0} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1.5">
          {profile?.profile_completion === 100 ? "Profile complete!" : "Add more details to improve your readiness score"}
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="personal">
            <User className="h-3.5 w-3.5 mr-1.5" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="education">
            <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
            Education
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Code className="h-3.5 w-3.5 mr-1.5" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="portfolio">
            <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
            Portfolio
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TabsContent value="personal" className="glass-card p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input {...register("full_name")} placeholder="Arjun Sharma" />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...register("phone")} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input {...register("city")} placeholder="Bengaluru" />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Bio <span className="text-muted-foreground">(max 500 chars)</span>
              </Label>
              <Textarea
                {...register("bio")}
                placeholder="Brief introduction about yourself, your interests, and career goals..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Github className="h-3 w-3" />
                  GitHub URL
                </Label>
                <Input {...register("github_url")} placeholder="https://github.com/username" />
                {errors.github_url && <p className="text-xs text-destructive">{errors.github_url.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Linkedin className="h-3 w-3" />
                  LinkedIn URL
                </Label>
                <Input {...register("linkedin_url")} placeholder="https://linkedin.com/in/username" />
                {errors.linkedin_url && <p className="text-xs text-destructive">{errors.linkedin_url.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Portfolio URL
                </Label>
                <Input {...register("portfolio_url")} placeholder="https://yourportfolio.com" />
                {errors.portfolio_url && <p className="text-xs text-destructive">{errors.portfolio_url.message}</p>}
              </div>
            </div>

            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-iran-500 to-violet-500 text-white border-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </TabsContent>

          <TabsContent value="education" className="glass-card p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Institution / College *</Label>
                <Input {...register("institution")} placeholder="Indian Institute of Technology, Delhi" />
              </div>
              <div className="space-y-1.5">
                <Label>Degree</Label>
                <Controller
                  name="degree"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent>
                        {["B.Tech", "B.E.", "MCA", "M.Tech", "M.Sc", "BCA", "B.Sc"].map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Branch / Specialization</Label>
                <Controller
                  name="branch"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENGINEERING_BRANCHES.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Year of Study</Label>
                <Controller
                  name="year_of_study"
                  control={control}
                  render={({ field }) => (
                    <Select value={String(field.value ?? "")} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            Year {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Graduation Year</Label>
                <Input {...register("graduation_year")} type="number" placeholder="2025" min={2020} max={2030} />
              </div>
              <div className="space-y-1.5">
                <Label>CGPA (out of 10)</Label>
                <Input {...register("cgpa")} type="number" step="0.01" placeholder="8.5" min={0} max={10} />
              </div>
              <div className="space-y-1.5">
                <Label>Target Internship Role</Label>
                <Input {...register("target_role")} placeholder="e.g. Software Development Intern" />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-iran-500 to-violet-500 text-white border-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save Education"}
            </Button>
          </TabsContent>

          <TabsContent value="skills" className="glass-card p-5 space-y-4">
            <div>
              <Label>Technical Skills</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Add skills you know (at least 5 recommended)</p>
              <div className="flex gap-2 mt-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder="Type a skill and press Enter"
                />
                <Button type="button" variant="outline" onClick={() => addSkill(skillInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Quick Add Common Skills</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_TECH_SKILLS.filter((s) => !skills.includes(s))
                  .slice(0, 16)
                  .map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="text-xs px-2 py-0.5 rounded-full border border-border hover:border-iran-500/50 hover:text-iran-400 transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
              </div>
            </div>

            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-iran-500 to-violet-500 text-white border-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Skills
            </Button>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  Certifications ({certifications.length})
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddCert(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>

              {certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No certifications added yet</p>
              ) : (
                <div className="space-y-2">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{cert.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cert.issuer} • {cert.issue_date?.split("-")[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cert.verified && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                        <button
                          type="button"
                          onClick={async () => {
                            await supabase.from("certifications").delete().eq("id", cert.id);
                            setCertifications(certifications.filter((c) => c.id !== cert.id));
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddCert && (
                <AddCertForm
                  userId={userId}
                  onAdd={(cert) => {
                    setCertifications([cert, ...certifications]);
                    setShowAddCert(false);
                  }}
                  onCancel={() => setShowAddCert(false)}
                />
              )}
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-iran-400" />
                  Projects ({projects.length})
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddProject(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>

              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No projects added yet</p>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div key={project.id} className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{project.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {project.tech_stack?.slice(0, 4).map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await supabase.from("projects").delete().eq("id", project.id);
                            setProjects(projects.filter((p) => p.id !== project.id));
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddProject && (
                <AddProjectForm
                  userId={userId}
                  onAdd={(project) => {
                    setProjects([project, ...projects]);
                    setShowAddProject(false);
                  }}
                  onCancel={() => setShowAddProject(false)}
                />
              )}
            </div>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
}

function AddCertForm({
  userId,
  onAdd,
  onCancel,
}: {
  userId: string;
  onAdd: (c: Certification) => void;
  onCancel: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", issuer: "", issue_date: "", credential_url: "" });

  const save = async () => {
    if (!form.name || !form.issuer) {
      toast({ title: "Name and issuer required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("certifications")
      .insert({ ...form, user_id: userId, skills: [] })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast({ title: "Error saving", variant: "destructive" });
      return;
    }

    onAdd(data as Certification);
    toast({ title: "Certification added" });
  };

  return (
    <div className="mt-4 p-4 border border-border/50 rounded-lg space-y-3">
      <h4 className="text-sm font-medium">Add Certification</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AWS Cloud Practitioner" />
        </div>
        <div className="space-y-1.5">
          <Label>Issuer *</Label>
          <Input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="Amazon Web Services" />
        </div>
        <div className="space-y-1.5">
          <Label>Issue Date</Label>
          <Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Credential URL</Label>
          <Input value={form.credential_url} onChange={(e) => setForm({ ...form, credential_url: e.target.value })} placeholder="https://..." />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function AddProjectForm({
  userId,
  onAdd,
  onCancel,
}: {
  userId: string;
  onAdd: (p: Project) => void;
  onCancel: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", github_url: "", live_url: "", tech_stack: "" });

  const save = async () => {
    if (!form.title) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const tech = form.tech_stack
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...form,
        user_id: userId,
        tech_stack: tech,
        highlights: [],
        complexity_score: 5,
        is_ongoing: false,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast({ title: "Error saving", variant: "destructive" });
      return;
    }

    onAdd(data as Project);
    toast({ title: "Project added" });
  };

  return (
    <div className="mt-4 p-4 border border-border/50 rounded-lg space-y-3">
      <h4 className="text-sm font-medium">Add Project</h4>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="E-commerce Web App" />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>GitHub URL</Label>
            <Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label>Live URL</Label>
            <Input value={form.live_url} onChange={(e) => setForm({ ...form, live_url: e.target.value })} placeholder="https://..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Tech Stack (comma separated)</Label>
          <Input value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} placeholder="React, Node.js, MongoDB" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}