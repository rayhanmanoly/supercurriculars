import { Skeleton } from '@/components/ui/skeleton';

export default function MentoringSubjectSkeleton() {
  return (
    <div className="h-screen bg-white w-full">
      <div className="flex-1 p-8">
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex mb-6">
          <Skeleton className="h-10 flex-grow mr-2" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      </div>
    </div>
  );
}
