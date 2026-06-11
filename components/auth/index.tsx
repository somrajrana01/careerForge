"use client";

import { type ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-border bg-background/80 p-8 shadow-sm backdrop-blur">
        {children}
      </div>
    </div>
  );
}
