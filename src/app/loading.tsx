import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-16 w-3/4" />
      <Skeleton className="h-40 w-full" />
    </main>
  );
}
