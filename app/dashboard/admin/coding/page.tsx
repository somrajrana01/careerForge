import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminCodingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Coding Questions</h1>
          <p className="text-sm text-muted-foreground">Manage coding-practice question banks.</p>
        </div>
        <Link href="/dashboard/admin" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">Back to dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coding question management</CardTitle>
          <CardDescription>Coding question tools are not configured yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No coding-question management widgets are available yet.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
