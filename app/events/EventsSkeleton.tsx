import { Skeleton } from '@/components/ui/skeleton';

export default function EventsSkeleton() {
  return (
    <div className="h-screen bg-white w-full">
      <div className="flex-1 p-8">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="flex mb-6 items-center">
          <Skeleton className="h-10 flex-grow mr-2" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-8">
          {[...Array(2)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-64" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
