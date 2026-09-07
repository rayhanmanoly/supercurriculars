import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DashboardSkeleton = () => {
  return (
    <div className="flex-1 p-6 overflow-hidden">
      <div className="p-8 flex flex-1">
        <div className="flex-1 pr-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-48" />
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col items-center space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </CardHeader>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-center">
                <Skeleton className="h-6 w-48" />
              </div>
            </CardHeader>
            <CardContent className="flex justify-around">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="flex-1 mx-2">
                  <div className="flex flex-col items-center p-4 space-y-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-60 pt-14">
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;