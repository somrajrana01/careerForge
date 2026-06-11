import { type ReactNode } from "react";

interface DashboardShellProps {
  title?: string;
  children: ReactNode;
}

export function DashboardShell({ title, children }: DashboardShellProps) {
  return (
    <section className="space-y-6 px-4 py-6 sm:px-6">
      {title ? <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">Manage your workspace with ease.</p>
      </div> : null}
      <div className="rounded-3xl border border-border bg-background/80 p-6 shadow-sm">{children}</div>
    </section>
  );
}
