import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Calendar, Youtube, ArrowRight } from "lucide-react";
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
    'easy': 'Corrida Fácil',
    'recovery': 'Recuperação',
    'threshold': 'Limiar',
    'interval': 'Intervalado',
    'repetition': 'Repetições',
    'long': 'Corrida Longa',
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
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="bg-muted/50 rounded-full p-3 flex-shrink-0">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-base font-medium">Dia de descanso</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Recupere-se hoje. Um bom descanso é essencial para o progresso no treinamento.
              </p>
            </div>
            
            <Button asChild size="sm" variant="outline" className="flex-shrink-0">
              <Link href={`/plano/${activePlan.path}`}>
                Ver Plano
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Cabeçalho com título e badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Treino de Hoje</h3>
            </div>
            <Badge variant="outline" className={getActivityColor(todayWorkout.type)}>
              {getActivityTypeName(todayWorkout.type)}
            </Badge>
          </div>

          {/* Conteúdo principal */}
          <div className="flex items-center gap-4">
            {/* Detalhes do treino */}
            <div className="flex-1">
              <p className="font-medium text-lg">{todayWorkout.title}</p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{todayWorkout.description}</p>
              
              {/* Séries (se existirem) */}
              {todayWorkout.workouts && todayWorkout.workouts.length > 0 && todayWorkout.workouts[0].series && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {todayWorkout.workouts[0].series.slice(0, 3).map((serie: any, sIdx: number) => (
                    <div key={sIdx} className="bg-muted/40 p-2 rounded text-xs">
                      <span className="font-medium">{serie.sets}</span>
                      {serie.work && <span className="ml-1">{serie.work}</span>}
                      {serie.rest && <span className="text-muted-foreground ml-1">/ {serie.rest}</span>}
                    </div>
                  ))}
                  {todayWorkout.workouts[0].series.length > 3 && (
                    <Badge variant="secondary">+{todayWorkout.workouts[0].series.length - 3} séries</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Métricas e botões */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex gap-3">
                <div className="text-center px-3 py-2 bg-muted/50 rounded-lg">
                  <span className="block text-xs text-muted-foreground">Distância</span>
                  <span className="block font-bold">{todayWorkout.distance}</span>
                </div>
                
                <div className="text-center px-3 py-2 bg-muted/50 rounded-lg">
                  <span className="block text-xs text-muted-foreground">Ritmo</span>
                  <span className="block font-bold">{todayWorkout.pace}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {todayWorkout.workouts && todayWorkout.workouts[0] && todayWorkout.workouts[0].link && (
                  <Button variant="outline" size="sm" className="h-9 px-3 bg-rose-500/10 text-rose-600 border-rose-200 hover:bg-rose-500/20" onClick={() => window.open(todayWorkout.workouts[0].link, '_blank')}>
                    <Youtube className="mr-1.5 h-4 w-4" />
                    Vídeo
                  </Button>
                )}
                
                <Button asChild size="sm" className="h-9">
                  <Link href="/dashboard/log">
                    <PlayCircle className="mr-1.5 h-4 w-4" />
                    Registrar
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayWorkout;