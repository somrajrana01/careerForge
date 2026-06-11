"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, Filter, Loader2, CheckCircle2,
  XCircle, Shield, Edit, Trash2, RefreshCw,
  UserCheck, UserX, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, generateInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/types";

const ROLE_COLORS: Record<string, string> = {
  student: "bg-iran-500/10 text-iran-400 border-iran-500/20",
  trainer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  placement_officer: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  admin: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const loadUsers = async () => {
    const query = supabase.from("users").select("*").order("created_at", { ascending: false });
    const { data } = await query;
    setUsers((data ?? []) as User[]);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const toggleActive = async (user: User) => {
    setUpdating(user.id);
    const { error } = await supabase.from("users")
      .update({ is_active: !user.is_active })
      .eq("id", user.id);

    if (!error) {
      setUsers(users.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast({ title: user.is_active ? "User deactivated" : "User activated" });
    }
    setUpdating(null);
  };

  const changeRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    const { error } = await supabase.from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (!error) {
      setUsers(users.map((u) => u.id === userId ? { ...u, role: newRole as any } : u));
      toast({ title: "Role updated", description: `User role changed to ${newRole}` });
    }
    setUpdating(null);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "active" ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    students: users.filter((u) => u.role === "student").length,
    staff: users.filter((u) => u.role !== "student").length,
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton" />
      <div className="h-96 skeleton rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">Manage all platform users and roles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Active", value: stats.active, color: "text-emerald-400" },
          { label: "Students", value: stats.students, color: "text-iran-400" },
          { label: "Staff", value: stats.staff, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-3 text-center">
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="trainer">Trainer</SelectItem>
            <SelectItem value="placement_officer">Placement</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadUsers}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
        </Button>
      </div>

      {/* Users table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50">
              <tr>
                {["User", "Role", "Status", "Verified", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={user.avatar_url ?? ""} />
                          <AvatarFallback className="text-xs bg-muted">
                            {generateInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <Select
                        value={user.role}
                        onValueChange={(v) => changeRole(user.id, v)}
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className={cn("h-6 text-[10px] px-2 w-36 border font-medium", ROLE_COLORS[user.role])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="trainer">Trainer</SelectItem>
                          <SelectItem value="placement_officer">Placement Officer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Active status */}
                    <td className="py-3 px-4">
                      <span className={cn(
                        "flex items-center gap-1 text-xs font-medium w-fit",
                        user.is_active ? "text-emerald-400" : "text-muted-foreground"
                      )}>
                        {user.is_active
                          ? <CheckCircle2 className="h-3.5 w-3.5" />
                          : <XCircle className="h-3.5 w-3.5" />}
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Email verified */}
                    <td className="py-3 px-4">
                      {user.email_verified
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        : <XCircle className="h-4 w-4 text-muted-foreground" />}
                    </td>

                    {/* Joined date */}
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleActive(user)}
                        disabled={updating === user.id}
                      >
                        {updating === user.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : user.is_active
                          ? <UserX className="h-3.5 w-3.5" />
                          : <UserCheck className="h-3.5 w-3.5" />}
                        <span className="ml-1">{user.is_active ? "Deactivate" : "Activate"}</span>
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {users.length} users
          </p>
        </div>
      </div>
    </div>
  );
}
