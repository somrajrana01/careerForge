import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlacementOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Placement Overview</h1>
          <p className="text-sm text-muted-foreground">Track student placement readiness at a glance.</p>
        </div>
        <Link href="/dashboard/placement" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">Back to dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Overview widgets are not configured yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No placement overview data is available yet.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
