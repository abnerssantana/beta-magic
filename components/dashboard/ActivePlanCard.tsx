import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Settings, ChevronRight, Activity } from "lucide-react";
import { PlanSummary } from '@/models';

interface ActivePlanCardProps {
  activePlan: PlanSummary | null;
  weekProgress: number;
}

export const ActivePlanCard: React.FC<ActivePlanCardProps> = ({ activePlan, weekProgress }) => {
  if (!activePlan) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle>Plano de Treino Ativo</CardTitle>
          <CardDescription>
            Seu plano atual e progresso semanal
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum plano ativo</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Você ainda não selecionou um plano de treinamento. Escolha um plano para começar a acompanhar seu progresso.
            </p>
            <Button asChild>
              <Link href="/dashboard/plans">
                Escolher um Plano
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle>Plano de Treino Ativo</CardTitle>
        <CardDescription>
          Seu plano atual e progresso semanal
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{activePlan.name}</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="text-xs">
                  {activePlan.nivel}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {activePlan.coach}
                </span>
                <span className="text-sm text-muted-foreground">
                  • {activePlan.duration}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/plans/${activePlan.path}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/plano/${activePlan.path}`}>
                  Ver Plano
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso Semanal</span>
              <span className="font-medium">{weekProgress}%</span>
            </div>
            <Progress value={weekProgress} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivePlanCard;