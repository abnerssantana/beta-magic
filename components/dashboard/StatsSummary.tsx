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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm flex items-center">
              <Dumbbell className="mr-2 h-4 w-4" />
              Treinos Completados
            </span>
            <span className="text-3xl font-bold">{userSummary.completedWorkouts}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Quilômetros Totais
            </span>
            <span className="text-3xl font-bold">{userSummary.totalDistance} km</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm flex items-center">
              <Zap className="mr-2 h-4 w-4" />
              Sequência de Treinos
            </span>
            <span className="text-3xl font-bold">{userSummary.streakDays} dias</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-orange-500/5 border-orange-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm flex items-center">
              <Award className="mr-2 h-4 w-4" />
              Próximo Objetivo
            </span>
            <span className="text-3xl font-bold">{userSummary.nextMilestone}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSummary;