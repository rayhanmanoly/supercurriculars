import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function PortfolioSkeleton() {
  return (
    <div className="flex-1 p-8">
      {/* Title and Progress Card */}
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex mb-6">
        <Card className="w-[300px] p-4 mr-4">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-12 w-16" />
          </div>
        </Card>
        <Skeleton className="h-[116px] w-[200px]" /> {/* Filter card */}
      </div>

      {/* Activities sections */}
      <div className="space-y-8">
        <div>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="w-[90%]">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[300px]" />
              ))}
            </div>
          </div>
        </div>

        <div>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="w-[90%]">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[300px]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}