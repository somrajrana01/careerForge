import { type ReactNode } from "react";

interface StudentPanelProps {
  title: string;
  children: ReactNode;
}

export function StudentPanel({ title, children }: StudentPanelProps) {
  return (
    <div className="rounded-3xl border border-border bg-background/80 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
