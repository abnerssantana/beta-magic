import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Activity, Zap, Award } from "lucide-react";

interface StatsSummaryProps {
  userSummary: {
    totalDistance: number;
    completedWorkouts: number;
    streakDays: number;
    nextMilestone: string;
  };
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ userSummary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs sm:text-sm flex items-center">
              <Dumbbell className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
              Treinos
            </span>
            <span className="text-xl sm:text-2xl font-bold">{userSummary.completedWorkouts}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs sm:text-sm flex items-center">
              <Activity className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
              Total km
            </span>
            <span className="text-xl sm:text-2xl font-bold">{userSummary.totalDistance}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs sm:text-sm flex items-center">
              <Zap className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
              Sequência
            </span>
            <span className="text-xl sm:text-2xl font-bold">{userSummary.streakDays}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-orange-500/5 border-orange-500/20">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs sm:text-sm flex items-center">
              <Award className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
              Objetivo
            </span>
            <span className="text-xl sm:text-2xl font-bold">{userSummary.nextMilestone}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSummary;