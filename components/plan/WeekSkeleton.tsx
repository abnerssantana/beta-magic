import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const WeekSkeleton: React.FC = () => {
  // Create an array of 7 days for the skeleton
  const days = Array.from({ length: 7 });

  return (
    <Card className="mt-2 animate-in fade-in-0 duration-300">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 py-4">
        <div className="p-1 space-y-2">
          {days.map((_, index) => (
            <Card key={index} className="rounded-lg bg-card mb-2">
              <div className="py-3 px-2 flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
              </div>

              <div className="p-2 space-y-2">
                <div className="space-y-1">
                  {/* Random number of activities per day (1-3) */}
                  {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, actIndex) => (
                    <div key={actIndex} className="rounded-lg p-4 bg-muted/30">
                      <div className="flex justify-between mb-3">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-6 w-28 mb-2" />
                      {/* Sometimes show workout details */}
                      {Math.random() > 0.5 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map((_, wIndex) => (
                            <Skeleton key={wIndex} className="h-16 rounded-md" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeekSkeleton;