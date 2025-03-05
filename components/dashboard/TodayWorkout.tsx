import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Calendar, Activity, Youtube } from "lucide-react";
import { PlanSummary } from '@/models';

interface TodayWorkoutProps {
  activePlan: PlanSummary | null;
  todayWorkout: any;
  currentDate: string;
}

// Função para mapear tipo de atividade para cor
const getActivityColor = (type: string) => {
  const types: {[key: string]: string} = {
    'easy': 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30',
    'recovery': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    'threshold': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    'interval': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    'repetition': 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30',
    'long': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    'marathon': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    'race': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
    'offday': 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30',
    'walk': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
  };
  
  return types[type] || 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
};

// Função para mapear o tipo de atividade para um nome legível
const getActivityTypeName = (type: string): string => {
  const types: Record<string, string> = {
    'easy': 'Fácil',
    'recovery': 'Recuperação',
    'threshold': 'Limiar',
    'interval': 'Intervalado',
    'repetition': 'Repetições',
    'long': 'Longo',
    'marathon': 'Maratona',
    'race': 'Competição',
    'offday': 'Descanso',
    'walk': 'Caminhada'
  };
  
  return types[type] || type;
};

export const TodayWorkout: React.FC<TodayWorkoutProps> = ({ activePlan, todayWorkout, currentDate }) => {
  if (!activePlan) {
    return null;
  }

  if (!todayWorkout) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhum treino hoje</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            Hoje parece ser um dia de descanso ou você está fora do período do plano.
            Verifique o calendário para ver seus próximos treinos.
          </p>
          <Button asChild>
            <Link href={`/plano/${activePlan.path}`}>
              Ver Plano Completo
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            <span>Treino de Hoje</span>
          </div>
          <Badge variant="outline" className={getActivityColor(todayWorkout.type)}>
            {getActivityTypeName(todayWorkout.type)}
          </Badge>
        </CardTitle>
        <CardDescription>
          {currentDate}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1">
            <p className="text-lg font-semibold mb-1">{todayWorkout.title}</p>
            <p className="text-sm text-muted-foreground mb-4">{todayWorkout.description}</p>
            
            {/* Exibir detalhes dos workouts quando existirem */}
            {todayWorkout.workouts && todayWorkout.workouts.length > 0 && (
              <div className="mt-2 space-y-2">
                {todayWorkout.workouts.map((workout: any, idx: number) => (
                  <div key={idx} className="p-2 bg-muted/30 rounded-md">
                    {workout.note && <p className="text-xs font-medium mb-1">{workout.note}</p>}
                    
                    {workout.series && workout.series.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {workout.series.map((serie: any, sIdx: number) => (
                          <div key={sIdx} className="bg-muted/40 p-2 rounded text-xs">
                            <div className="font-medium">{serie.sets}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span>{serie.work}</span>
                              {serie.rest && <span className="text-muted-foreground">/ {serie.rest}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {workout.link && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="mt-2 h-7 text-xs bg-rose-500/80 hover:bg-rose-500/60 text-white"
                        onClick={() => window.open(workout.link, '_blank')}
                      >
                        <Youtube className="text-white mr-2 h-3 w-3" />
                        Ver exemplo em vídeo
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap md:flex-col gap-3 w-full md:w-auto">
            <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg min-w-24 md:w-full">
              <span className="text-xs text-muted-foreground">Distância</span>
              <span className="text-lg font-bold">{todayWorkout.distance}</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg min-w-24 md:w-full">
              <span className="text-xs text-muted-foreground">Ritmo</span>
              <span className="text-lg font-bold">{todayWorkout.pace}</span>
            </div>
            
            <div className="flex gap-2 w-full justify-between md:justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="flex-1 md:flex-none"
              >
                <Link href={`/plano/${activePlan.path}`}>
                  Ver Plano
                </Link>
              </Button>
              
              <Button 
                asChild
                size="sm"
                className="flex-1 md:flex-none"
              >
                <Link href="/dashboard/log">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Registrar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayWorkout;