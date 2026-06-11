"use client";

import { useEffect, useState } from "react";
import { Shield, RefreshCw, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/types";

const ACTION_COLORS: Record<string, string> = {
  user_registered: "text-emerald-400 bg-emerald-500/10",
  resume_analyzed: "text-iran-400 bg-iran-500/10",
  readiness_calculated: "text-violet-400 bg-violet-500/10",
  assessment_created: "text-amber-400 bg-amber-500/10",
  user_deactivated: "text-rose-400 bg-rose-500/10",
  role_changed: "text-teal-400 bg-teal-500/10",
};

export default function AuditLogsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<(AuditLog & { users?: { full_name: string; email: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const loadLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("*, users(full_name, email)")
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setLogs((data ?? []) as any[]);
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, [page]);

  const exportCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Resource Type", "Resource ID"];
    const rows = filtered.map((l) => [
      l.created_at, (l as any).users?.email ?? l.user_id ?? "system",
      l.action, l.resource_type ?? "", l.resource_id ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit_logs_${Date.now()}.csv`; a.click();
  };

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.action.toLowerCase().includes(q) ||
      (l as any).users?.email?.toLowerCase().includes(q) ||
      (l.resource_type ?? "").toLowerCase().includes(q);
    const matchAction = filterAction === "all" || l.action === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-rose-400" />Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground">System activity and user action history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Export
          </Button>
          <Button variant="outline" size="sm" onClick={loadLogs}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="pl-9" />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border/50">
                <tr>
                  {["Timestamp", "User", "Action", "Resource", "Details"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">No logs found</td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="text-xs font-medium">{(log as any).users?.full_name ?? "System"}</p>
                        <p className="text-[10px] text-muted-foreground">{(log as any).users?.email ?? ""}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium font-mono",
                          ACTION_COLORS[log.action] ?? "text-muted-foreground bg-muted"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground">
                        {log.resource_type && (
                          <span>{log.resource_type}{log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ""}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground max-w-[200px]">
                        {log.new_values && (
                          <span className="font-mono text-[10px] truncate block">
                            {JSON.stringify(log.new_values).slice(0, 60)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {logs.length} entries (page {page + 1})
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
