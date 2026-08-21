import { Skeleton } from "@/ui/components/atoms";

export default function ProductsLoading() {
  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-center gap-3">
            <Skeleton className="h-10 w-48 sm:h-12 sm:w-64" />
            <Skeleton className="h-4 w-72" />
          </div>

          <div className="mb-8 space-y-4">
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-35 rounded-md" />
              <Skeleton className="h-9 w-35 rounded-md" />
            </div>
          </div>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[1/1.618] w-full rounded-2xl" />
                <Skeleton className="h-2.5 w-1/3" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
