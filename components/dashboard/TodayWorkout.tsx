import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PlayCircle,
  Calendar,
  Youtube,
  ArrowRight,
  Info,
  Zap,
  Heart,
  Clock,
  Target,
  Award,
  Dumbbell,
  Route,
  CalendarDays
} from "lucide-react";
import { PlanSummary } from '@/models';
import { cn } from "@/lib/utils";

interface TodayWorkoutProps {
  activePlan: PlanSummary | null;
  todayWorkout: any;
  currentDate: string;
}

// Função para mapear tipo de atividade para ícone
const getActivityIcon = (type: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    'easy': <Heart className="h-5 w-5" />,
    'recovery': <Heart className="h-5 w-5" />,
    'threshold': <Zap className="h-5 w-5" />,
    'interval': <Zap className="h-5 w-5" />,
    'repetition': <Zap className="h-5 w-5" />,
    'race': <Award className="h-5 w-5" />,
    'offday': <CalendarDays className="h-5 w-5" />,
    'long': <Route className="h-5 w-5" />,
    'marathon': <Route className="h-5 w-5" />,
    'walk': <Route className="h-5 w-5" />,
    'strength': <Dumbbell className="h-5 w-5" />,
    'força': <Dumbbell className="h-5 w-5" />
  };

  return icons[type] || <Route className="h-5 w-5" />;
};

// Função para mapear tipo de atividade para cor
const getActivityColors = (type: string): { bg: string, text: string, border: string, gradient: string } => {
  const types: { [key: string]: { bg: string, text: string, border: string, gradient: string } } = {
    'easy': {
      bg: 'bg-green-500/10',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-500/30',
      gradient: 'from-green-400/20 to-green-500/5'
    },
    'recovery': {
      bg: 'bg-blue-500/10',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30',
      gradient: 'from-blue-400/20 to-blue-500/5'
    },
    'threshold': {
      bg: 'bg-rose-500/10',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/30',
      gradient: 'from-rose-400/20 to-rose-500/5'
    },
    'interval': {
      bg: 'bg-purple-500/10',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-500/30',
      gradient: 'from-purple-400/20 to-purple-500/5'
    },
    'repetition': {
      bg: 'bg-pink-500/15',
      text: 'text-pink-700 dark:text-pink-300',
      border: 'border-pink-500/30',
      gradient: 'from-pink-400/20 to-pink-500/5'
    },
    'race': {
      bg: 'bg-orange-500/15',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-500/30',
      gradient: 'from-orange-400/20 to-orange-500/5'
    },
    'offday': {
      bg: 'bg-gray-500/10',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-500/30',
      gradient: 'from-gray-400/20 to-gray-500/5'
    },
    'long': {
      bg: 'bg-indigo-500/15',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-500/30',
      gradient: 'from-indigo-400/20 to-indigo-500/5'
    },
    'marathon': {
      bg: 'bg-indigo-500/15',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-500/30',
      gradient: 'from-indigo-400/20 to-indigo-500/5'
    },
    'walk': {
      bg: 'bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30',
      gradient: 'from-amber-400/20 to-amber-500/5'
    },
    'strength': {
      bg: 'bg-orange-500/10',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-500/30',
      gradient: 'from-orange-400/20 to-orange-500/5'
    },
    'força': {
      bg: 'bg-orange-500/10',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-500/30',
      gradient: 'from-orange-400/20 to-orange-500/5'
    }
  };

  return types[type] || types['easy'];
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
    'walk': 'Caminhada',
    'strength': 'Treino de Força',
    'força': 'Treino de Força'
  };

  return types[type] || type;
};

// Função para obter dica motivacional baseada no tipo de treino
// Com valor fixo para evitar erro de hidratação
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

// Componente de ritmo com design melhorado
const PaceDisplay = ({ pace, label = "Ritmo" }: { pace: string, label?: string }) => (
  <div className="flex flex-col items-center bg-muted/30 rounded-lg p-3 backdrop-blur-sm">
    <span className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{label}</span>
    <div className="flex items-center">
      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
      <span className="text-base font-bold">{pace}</span>
    </div>
  </div>
);

// Componente de distância com design melhorado
const DistanceDisplay = ({ distance, units = "km" }: { distance: number | string, units?: string }) => (
  <div className="flex flex-col items-center bg-muted/30 rounded-lg p-3 backdrop-blur-sm">
    <span className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Distância</span>
    <div className="flex items-center">
      <Route className="h-4 w-4 mr-2 text-muted-foreground" />
      <span className="text-base font-bold">{distance}</span>
      <span className="text-xs ml-1 text-muted-foreground">{units}</span>
    </div>
  </div>
);

// Componente de série único para visualização mais clara
const SeriesItem = ({ serie, workoutType, index }: { serie: any, workoutType: string, index: number }) => {
  const colors = getActivityColors(workoutType);

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all duration-300",
      colors.border,
      colors.bg,
      "hover:bg-opacity-20"
    )}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
        <Badge variant="outline" className={cn("bg-white/10 dark:bg-black/10", colors.text, colors.border)}>
          {serie.sets}
        </Badge>

        <div className="flex-1 font-medium">
          {serie.work}
        </div>

        {serie.distance && (
          <Badge variant="outline" className="bg-black/5 dark:bg-white/5">
            {serie.distance}
          </Badge>
        )}
      </div>

      {serie.rest && (
        <div className="text-xs text-muted-foreground mt-2 pl-2 border-l-2 border-muted flex items-center">
          <Clock className="h-3 w-3 mr-1 inline" />
          <span>Recuperação: {serie.rest}</span>
        </div>
      )}
    </div>
  );
};

export const TodayWorkout: React.FC<TodayWorkoutProps> = ({ activePlan, todayWorkout, currentDate }) => {
  if (!activePlan) {
    return null;
  }

  // Quando não há treino (dia de descanso)
  if (!todayWorkout) {
    return (
      <Card className="border-primary/20 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-400/20 to-blue-500/5 h-2 w-full" />
        <CardContent className="p-4 pt-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="rounded-full p-3 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="h-6 w-6 text-blue-500 dark:text-blue-300" />
            </div>

            <div className="flex-1">
              <h3 className="text-base font-medium flex items-center gap-2">Dia de Descanso</h3>
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  "O descanso é tão importante quanto o treino. Seu corpo está se fortalecendo hoje para os próximos desafios."
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Aproveite para se recuperar. Considere fazer alongamentos leves, hidratação extra ou técnicas de recuperação como compressão ou banho gelado.
              </p>
            </div>

            <Button asChild size="sm" variant="outline" className="mt-2 sm:mt-0 flex-shrink-0 w-full sm:w-auto border-blue-200 dark:border-blue-800">
              <Link href={`/plano/${activePlan.path}`}>
                Ver Plano Completo
                <ArrowRight className="ml-2 h-4 w-4" />
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
  const activityName = getActivityTypeName(workoutType);

  // Obter dica motivacional
  const motivationalTip = getMotivationalTip(workoutType);

  return (
    <Card className={cn("overflow-hidden border-2 p-0", colors.border)}>
      <CardContent className="p-4 pt-5">
        <div className="flex flex-col space-y-4">
          {/* Cabeçalho com título e botão de registro */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className={cn("rounded-full p-2", colors.bg)}>
                {icon}
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Treino de Hoje</span>
                <h3 className={cn("font-semibold", colors.text)}>{activityName}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="h-8">
                <Link href="/dashboard/log">
                  <PlayCircle className="mr-1.5 h-4 w-4" />
                  Registrar Treino
                </Link>
              </Button>

              {/* Vídeo do treino (se existir) */}
              {todayWorkout.workouts && todayWorkout.workouts[0] && todayWorkout.workouts[0].link && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9",
                    "bg-rose-500/10 text-rose-600 border-rose-200",
                    "hover:bg-rose-500/20 dark:text-rose-300 dark:border-rose-900/50"
                  )}
                  onClick={() => window.open(todayWorkout.workouts[0].link, '_blank')}
                >
                  <Youtube className="mr-1.5 h-4 w-4" />
                  Vídeo do Treino
                </Button>
              )}
            </div>
          </div>
          {/* Título do treino */}
          <h4 className="font-bold text-xl">
            {todayWorkout.title || `Treino de ${activityName}`}
          </h4>

          {/* Métricas - sempre em 2 colunas */}
          <div className="grid grid-cols-2 gap-3">
            <DistanceDisplay distance={todayWorkout.distance} />
            {todayWorkout.pace ? (
              <PaceDisplay pace={todayWorkout.pace} />
            ) : (
              <div className="flex flex-col items-center bg-muted/30 rounded-lg p-3 backdrop-blur-sm">
                <span className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Tipo</span>
                <div className="flex items-center">
                  <span className="text-lg font-bold">{activityName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Séries - 4 colunas no desktop, 1 no mobile */}
          {hasSeries && (
            <div className="mt-2">
              <h5 className="text-sm font-semibold flex items-center gap-1 mb-3">
                <Zap className={cn("h-4 w-4", colors.text)} />
                <span>Detalhes do Treino</span>
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {todayWorkout.workouts[0].series.map((serie: any, sIdx: number) => (
                  <SeriesItem
                    key={sIdx}
                    serie={serie}
                    workoutType={workoutType}
                    index={sIdx}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dica motivacional + Nota do dia (na mesma linha) */}
          <div className="grid grid-cols-1  gap-4 mt-3">
            {/* Dica motivacional */}
            <div className={cn(
              "p-3 rounded-lg border",
              colors.border,
              "bg-opacity-5 backdrop-blur-sm bg-gradient-to-r",
              colors.gradient
            )}>
              <div className="flex gap-2">
                <Target className={cn("h-5 w-5 flex-shrink-0 mt-0.5 my-auto", colors.text)} />
                <p className="text-sm leading-relaxed">{motivationalTip}</p>
              </div>
            </div>

            {todayWorkout.note && (
              <div className="p-3 bg-muted/20 rounded-lg border border-muted/30 flex gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm">{todayWorkout.note}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayWorkout;