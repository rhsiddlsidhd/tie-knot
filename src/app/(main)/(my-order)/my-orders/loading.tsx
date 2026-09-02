import { Card, CardContent, CardHeader } from "@/ui/components/atoms/card";
import { Skeleton } from "@/ui/components/atoms/skeleton";

export default function MyOrdersLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex items-start justify-between gap-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
