import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Activity, Clock, Youtube, BarChart2 } from "lucide-react";
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
    'race': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
    'offday': 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30',
    'long': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    'marathon': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
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
        <CardContent className="p-4 flex flex-col sm:flex-row items-center text-center sm:text-left gap-3">
          <div className="bg-muted/50 rounded-full p-2 sm:mr-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium">Nenhum treino hoje</h3>
            <p className="text-xs text-muted-foreground">
              Aproveite o dia de descanso ou ajuste seu plano para registrar seu treino.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="mt-2 sm:mt-0 self-center shrink-0 h-8 text-xs">
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
      <CardHeader className="pb-0 pt-3 px-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-primary" />
            <span>Treino de Hoje</span>
          </div>
          <Badge variant="outline" className={getActivityColor(todayWorkout.type)}>
            {getActivityTypeName(todayWorkout.type)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1">
            <p className="text-base font-medium mb-1">{todayWorkout.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{todayWorkout.description}</p>
            
            {/* Exibir detalhes dos workouts quando existirem */}
            {todayWorkout.workouts && todayWorkout.workouts.length > 0 && (
              <div className="mt-2 space-y-2">
                {todayWorkout.workouts.map((workout: any, idx: number) => (
                  <div key={idx} className="p-2 bg-muted/30 rounded-md">
                    {workout.note && <p className="text-xs font-medium mb-1">{workout.note}</p>}
                    
                    {workout.series && workout.series.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {workout.series.slice(0, 3).map((serie: any, sIdx: number) => (
                          <div key={sIdx} className="bg-muted/40 p-1.5 rounded text-xs">
                            <div className="font-medium">{serie.sets}</div>
                            <div className="flex items-center justify-between mt-1 text-xs">
                              <span className="text-xs">{serie.work}</span>
                              {serie.rest && <span className="text-xs text-muted-foreground">/ {serie.rest}</span>}
                            </div>
                          </div>
                        ))}
                        {workout.series.length > 3 && (
                          <div className="bg-muted/40 p-1.5 rounded text-xs flex items-center justify-center">
                            +{workout.series.length - 3} séries
                          </div>
                        )}
                      </div>
                    )}
                    
                    {workout.link && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="mt-2 h-7 text-xs bg-rose-500/80 hover:bg-rose-500/60 text-white"
                        onClick={() => window.open(workout.link, '_blank')}
                      >
                        <Youtube className="text-white mr-1.5 h-3 w-3" />
                        Ver vídeo
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0">
            <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg w-full sm:w-24">
              <span className="text-xs text-muted-foreground">Distância</span>
              <span className="text-base font-bold">{todayWorkout.distance}</span>
            </div>
            
            <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg w-full sm:w-24">
              <span className="text-xs text-muted-foreground">Ritmo</span>
              <span className="text-base font-bold">{todayWorkout.pace}</span>
            </div>
            
            <div className="flex flex-col gap-2 w-full sm:w-24">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="h-8 text-xs"
              >
                <Link href={`/plano/${activePlan.path}`}>
                  Ver Plano
                </Link>
              </Button>
              
              <Button 
                asChild
                size="sm"
                className="h-8 text-xs"
              >
                <Link href="/dashboard/log">
                  <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
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