import React from 'react';
import Link from 'next/link';
import { 
  Play, 
  Calendar, 
  Youtube, 
  CheckCircle2, 
  CalendarClock,
  Clock, 
  Target, 
  Info, 
  Heart,
  Activity,
  Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlanSummary } from '@/models';

interface TodayWorkoutProps {
  activePlan: PlanSummary | null;
  todayWorkout: any;
  currentDate: string;
}

// Função para mapear tipo de atividade para ícone
const getActivityIcon = (type: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    'easy': <Heart className="h-4 w-4" />,
    'recovery': <Heart className="h-4 w-4" />,
    'threshold': <Zap className="h-4 w-4" />,
    'interval': <Zap className="h-4 w-4" />,
    'repetition': <Zap className="h-4 w-4" />,
    'race': <Target className="h-4 w-4" />,
    'offday': <CalendarClock className="h-4 w-4" />,
    'long': <Activity className="h-4 w-4" />,
    'marathon': <Activity className="h-4 w-4" />,
    'walk': <Activity className="h-4 w-4" />
  };

  return icons[type] || <Activity className="h-4 w-4" />;
};

// Função para mapear tipo de atividade para cor
const getActivityColors = (type: string): { bg: string, text: string, border: string } => {
  const types: { [key: string]: { bg: string, text: string, border: string } } = {
    'easy': {
      bg: 'bg-green-500/10',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-500/30'
    },
    'recovery': {
      bg: 'bg-blue-500/10',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30'
    },
    'threshold': {
      bg: 'bg-rose-500/10',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/30'
    },
    'interval': {
      bg: 'bg-purple-500/10',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-500/30'
    },
    'repetition': {
      bg: 'bg-pink-500/15',
      text: 'text-pink-700 dark:text-pink-300',
      border: 'border-pink-500/30'
    },
    'race': {
      bg: 'bg-orange-500/15',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-500/30'
    },
    'offday': {
      bg: 'bg-gray-500/10',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-500/30'
    },
    'long': {
      bg: 'bg-indigo-500/15',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-500/30'
    },
    'marathon': {
      bg: 'bg-indigo-500/15',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-500/30'
    },
    'walk': {
      bg: 'bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30'
    }
  };

  return types[type] || types['easy'];
};

// Função para obter dica motivacional baseada no tipo de treino
const getMotivationalTip = (workoutType: string): string => {
  const tips: Record<string, string> = {
    'easy': 'Mantenha a conversa fácil, deve ser possível conversar durante toda corrida.',
    'recovery': 'Recuperação é parte essencial do treinamento. Aproveite o ritmo mais lento!',
    'threshold': 'Limiar: mantenha um ritmo desafiador mas sustentável!',
    'interval': 'Mantenha o foco no ritmo constante durante cada repetição.',
    'repetition': 'Estes tiros são chave para melhorar sua velocidade!',
    'long': 'As corridas longas constroem sua base aeróbica. Aproveite a jornada!',
    'race': 'É dia de competição! Todo seu treino preparou você para hoje.',
    'default': 'Cada corrida te aproxima dos seus objetivos!'
  };

  const typeKey = workoutType in tips ? workoutType : 'default';
  return tips[typeKey];
};

export const TodayWorkout: React.FC<TodayWorkoutProps> = ({ activePlan, todayWorkout, currentDate }) => {
  if (!activePlan) {
    return null;
  }

  // Quando não há treino (dia de descanso)
  if (!todayWorkout) {
    return (
      <Card className="border-primary/20 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-400/20 to-blue-500/5 h-1 w-full" />
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="rounded-full p-2 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-300" />
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-medium">Dia de Descanso</h3>
              <p className="text-xs text-muted-foreground mt-1">
                O descanso é tão importante quanto o treino. Seu corpo está se fortalecendo hoje para os próximos desafios.
              </p>
            </div>

            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link href={`/plano/${activePlan.path}`}>
                Ver Plano
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verificar se existem séries
  const hasSeries = todayWorkout.workouts &&
    todayWorkout.workouts.length > 0 &&
    todayWorkout.workouts[0].series &&
    todayWorkout.workouts[0].series.length > 0;

  // Obter o tipo de treino
  const workoutType = todayWorkout.type || "easy";
  const colors = getActivityColors(workoutType);
  const icon = getActivityIcon(workoutType);

  // Obter dica motivacional
  const motivationalTip = getMotivationalTip(workoutType);

  return (
    <Card className={cn("overflow-hidden border", colors.border)}>
      <CardContent className="p-3">
        <div className="flex flex-col space-y-3">
          {/* Cabeçalho com título e botão de registro */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("rounded-full p-1.5", colors.bg)}>
                {icon}
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Treino de Hoje</span>
                <h3 className={cn("text-sm font-medium", colors.text)}>{todayWorkout.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button asChild size="sm" className="h-7 text-xs px-2">
                <Link href="/dashboard/log">
                  <Play className="mr-1 h-3 w-3" />
                  Registrar
                </Link>
              </Button>

              {/* Vídeo do treino (se existir) */}
              {todayWorkout.workouts && todayWorkout.workouts[0] && todayWorkout.workouts[0].link && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 text-xs px-2",
                    "bg-rose-500/10 text-rose-600 border-rose-200",
                    "hover:bg-rose-500/20 dark:text-rose-300 dark:border-rose-900/50"
                  )}
                  onClick={() => window.open(todayWorkout.workouts[0].link, '_blank')}
                >
                  <Youtube className="mr-1 h-3 w-3" />
                  Vídeo
                </Button>
              )}
            </div>
          </div>

          {/* Métricas - sempre em 2 colunas */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex flex-col items-center bg-muted/30 rounded-md p-2">
              <span className="text-xs text-muted-foreground mb-0.5">Distância</span>
              <span className="text-sm font-medium">{todayWorkout.distance}</span>
            </div>
            
            <div className="flex flex-col items-center bg-muted/30 rounded-md p-2">
              <span className="text-xs text-muted-foreground mb-0.5">Ritmo</span>
              <span className="text-sm font-medium">{todayWorkout.pace}</span>
            </div>
          </div>

          {/* Séries - versão compacta */}
          {hasSeries && (
            <div className="mt-1">
              <h5 className="text-xs font-medium flex items-center gap-1 mb-1.5">
                <Zap className={cn("h-3 w-3", colors.text)} />
                <span>Detalhes do Treino</span>
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                {todayWorkout.workouts[0].series.slice(0, 4).map((serie: any, sIdx: number) => (
                  <div
                    key={sIdx}
                    className="bg-muted/20 p-1.5 rounded-md text-xs"
                  >
                    <div className="font-medium">{serie.sets}</div>
                    <div className="text-muted-foreground">{serie.work}</div>
                    {serie.rest && (
                      <div className="text-xs mt-0.5 text-muted-foreground/70">
                        {serie.rest}
                      </div>
                    )}
                  </div>
                ))}
                {todayWorkout.workouts[0].series.length > 4 && (
                  <div className="bg-muted/20 p-1.5 rounded-md text-xs flex items-center justify-center text-muted-foreground">
                    +{todayWorkout.workouts[0].series.length - 4} séries
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dica motivacional */}
          <div className={cn(
            "p-2 rounded-md border text-xs",
            colors.border,
            "bg-opacity-5"
          )}>
            <div className="flex gap-1.5">
              <Target className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", colors.text)} />
              <p>{motivationalTip}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayWorkout;