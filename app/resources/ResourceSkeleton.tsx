import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ResourceSkeleton() {
  return (
    <div className="flex-1 p-8 w-full">
      {/* Title */}
      <Skeleton className="h-8 w-48 mb-6" />
      
      {/* Search bar and filter button */}
      <div className="flex mb-6 items-center w-full">
        <Skeleton className="h-10 flex-1 mr-2" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Content sections */}
      <div className="space-y-6">
        <Card className="p-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[300px]" />
            ))}
          </div>
        </Card>
        
        <Card className="p-6">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[300px]" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}