import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Settings, ChevronRight, Activity, Calendar } from "lucide-react";
import { PlanSummary } from '@/models';

interface ActivePlanCardProps {
  activePlan: PlanSummary | null;
  weekProgress: number;
}

export const ActivePlanCard: React.FC<ActivePlanCardProps> = ({ activePlan, weekProgress }) => {
  if (!activePlan) {
    return (
      <Card className="overflow-hidden border-border/50">
        <CardHeader className="bg-muted/20 p-3">
          <CardTitle className="text-sm">Plano de Treino Ativo</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="rounded-full bg-muted p-2 mb-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-2">Nenhum plano ativo</h3>
            <p className="text-xs text-muted-foreground max-w-md mb-3">
              Selecione um plano para começar a acompanhar seu progresso.
            </p>
            <Button asChild size="sm" className="h-8 text-xs">
              <Link href="/dashboard/plans">
                Escolher um Plano
                <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/50">
      <CardHeader className="bg-muted/20 p-3">
        <CardTitle className="text-sm">Plano de Treino Ativo</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">{activePlan.name}</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="text-xs">
                  {activePlan.nivel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {activePlan.coach}
                </span>
                <span className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1 inline" />
                  {activePlan.duration}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="h-8 text-xs"
              >
                <Link href={`/dashboard/plans/${activePlan.path}/settings`}>
                  <Settings className="mr-1.5 h-3.5 w-3.5" />
                  Config.
                </Link>
              </Button>
              <Button 
                size="sm" 
                asChild 
                className="h-8 text-xs"
              >
                <Link href={`/plano/${activePlan.path}`}>
                  Ver
                  <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso Semanal</span>
              <span className="font-medium">{weekProgress}%</span>
            </div>
            <Progress value={weekProgress} className="h-1.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivePlanCard;