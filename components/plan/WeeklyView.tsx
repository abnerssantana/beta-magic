import React, { useMemo } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Calendar, Clock, Youtube, CheckCircle2, CalendarClock, Play, Activity, ExternalLink, Ruler, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Activity as ActivityType, WeeklyBlock, PredictedRaceTime } from '@/types/training';
import { calculateWeeklyStats } from '@/lib/volume-calculator';
import { WorkoutLog } from '@/models/userProfile';

interface WeeklyViewProps {
  week: WeeklyBlock;
  windex: number;
  todayRef: React.RefObject<HTMLDivElement>;
  getActivityPace: (activity: ActivityType) => string;
  convertMinutesToHours: (minutes: number) => string;
  getPredictedRaceTime: (distance: number) => PredictedRaceTime | null;
  completedWorkouts?: WorkoutLog[];
  isAuthenticated: boolean;
  onLogWorkout?: (date: string, activity: ActivityType, dayIndex: number) => void;
}

// Estilos para diferentes tipos de atividades
const activityStyles: Record<string, string> = {
  regular: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800",
  easy: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800",
  recovery: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-800",
  long: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800",
  marathon: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800",
  workout: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800",
  interval: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800",
  strides: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800",
  race: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800",
  off: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700",
  offday: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700",
  threshold: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800",
  walk: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800",
  "força": "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800",
  repetition: "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 ring-1 ring-pink-200 dark:ring-pink-800",
  strength: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800"
};

const innerElementStyles = {
  seriesBox: "bg-black/5 dark:bg-white/5 ring-1 ring-black/10 dark:ring-white/10",
  predictionBox: "bg-black/5 dark:bg-white/5 ring-1 ring-black/10 dark:ring-white/10",
  videoButton: "bg-red-500/80 hover:bg-red-500/60 text-white ring-1 ring-red-400/10 dark:ring-red-400/20",
  completedActivityBox: "bg-green-500/10 dark:bg-green-500/10 ring-1 ring-green-500/20 dark:ring-green-500/20"
};

/**
 * Obter treinos concluídos para um determinado dia e conjunto de atividades
 * @param date Data do dia no formato ISO (YYYY-MM-DD) ou formatada
 * @param activities Lista de atividades do dia
 * @param completedWorkouts Lista de todos os treinos concluídos
 * @param planPath Caminho/identificador do plano
 * @param dayIndex Índice do dia no plano
 * @returns Lista de treinos concluídos que correspondem ao dia
 */
const getCompletedWorkoutsForDay = (
  date: string, 
  activities: ActivityType[], 
  completedWorkouts: WorkoutLog[] = [], 
  planPath?: string, 
  dayIndex?: number
): WorkoutLog[] => {
  // Handle empty input cases
  if (!completedWorkouts?.length || !activities?.length || !date) return [];

  // Normalize date format for comparison (remove time part if present)
  const dayDateStr = date.split('T')[0];

  return completedWorkouts.filter(workout => {
    try {
      // 1. First priority: Check for exact plan day index match
      if (planPath && dayIndex !== undefined && 
          workout.planPath === planPath && 
          workout.planDayIndex === dayIndex) {
        return true;
      }
      
      // 2. Second priority: Check for date match
      const workoutDateStr = workout.date?.split('T')[0];
      if (!workoutDateStr || workoutDateStr !== dayDateStr) {
        return false; // Dates don't match, skip this workout
      }
      
      // 3. If dates match, check for activity type or distance compatibility
      return activities.some(activity => {
        // Match by activity type
        if (workout.activityType === activity.type) {
          return true;
        }
        
        // Match by approximate distance (with 10% tolerance)
        const activityDistance = typeof activity.distance === 'number' ? activity.distance : 0;
        if (activityDistance > 0 && workout.distance) {
          const distanceRatio = Math.abs(workout.distance - activityDistance) / activityDistance;
          return distanceRatio < 0.1; // 10% tolerance
        }
        
        return false;
      });
    } catch (error) {
      console.error("Error comparing workouts:", error, workout);
      return false;
    }
  });
};

// Componente de cartão de atividade com indicador de conclusão
const ActivityCard: React.FC<{
  activity: ActivityType;
  date: string;
  dayIndex: number;
  planPath?: string;
  getActivityPace: (activity: ActivityType) => string;
  convertMinutesToHours: (minutes: number) => string;
  getPredictedRaceTime: (distance: number) => PredictedRaceTime | null;
  completedWorkouts?: WorkoutLog[];
  isAuthenticated: boolean;
  onLogWorkout?: (date: string, activity: ActivityType, dayIndex: number) => void;
}> = ({ 
  activity, 
  date, 
  dayIndex,
  planPath,
  getActivityPace, 
  convertMinutesToHours, 
  getPredictedRaceTime,
  completedWorkouts = [],
  isAuthenticated,
  onLogWorkout
}) => {
  const hasWorkoutSeries = activity.workouts?.some(workout => workout.series);
  
  // Encontrar o treino concluído correspondente a esta data e atividade usando a função melhorada
  const matchingWorkouts = getCompletedWorkoutsForDay(
    date, 
    [activity], 
    completedWorkouts, 
    planPath, 
    dayIndex
  );
  
  const completedWorkout = matchingWorkouts.length > 0 ? matchingWorkouts[0] : undefined;
  const isCompleted = !!completedWorkout;

  const handleLogClick = () => {
    if (onLogWorkout) {
      onLogWorkout(date, activity, dayIndex);
    }
  };

  // Formatar a duração para exibição
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    return hours > 0 
      ? `${hours}h${mins.toString().padStart(2, '0')}`
      : `${mins}min`;
  };

  return (
    <div className={cn(
      "p-4 rounded-lg transition-all duration-200 relative",
      activityStyles[activity.type] || activityStyles.regular,
      isCompleted ? "ring-2 ring-green-500 dark:ring-green-400" : ""
    )}>
      {/* Header com indicador de conclusão */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{activity.note}</span>
        </div>
        
        {/* Indicador de treino concluído */}
        {isAuthenticated && isCompleted && (
          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30">
            <CheckCircle2 className="mr-1.5 h-3 w-3" />
            Concluído
          </Badge>
        )}
      </div>

      {/* Main info */}
      <div className="text-2xl font-extrabold tracking-tight">
        {activity.units === "min" && typeof activity.distance === 'number' && activity.distance > 59
          ? convertMinutesToHours(activity.distance)
          : `${activity.distance} ${activity.units}`}
        {!hasWorkoutSeries && getActivityPace(activity) !== "N/A" && (
          <span className="ml-2 text-sm font-medium opacity-90">
            @ {getActivityPace(activity)} /km
          </span>
        )}
      </div>

      {/* Mostrar detalhes do treino concluído quando aplicável */}
      {isCompleted && completedWorkout && (
        <div className={cn("mt-3 p-3 rounded-md", innerElementStyles.completedActivityBox)}>
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <CheckCircle2 className="mr-1.5 h-4 w-4 text-green-600 dark:text-green-400" />
            {completedWorkout.title}
          </h4>
          
          <div className="grid grid-cols-3 gap-2 text-xs mt-2">
            <div className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              <span>{completedWorkout.distance.toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(completedWorkout.duration)}</span>
            </div>
            {completedWorkout.pace && (
              <div className="flex items-center gap-1">
                <BarChart2 className="h-3 w-3" />
                <span>{completedWorkout.pace}</span>
              </div>
            )}
          </div>
          
          {completedWorkout._id && (
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="mt-2 h-6 text-xs w-full bg-white/50 dark:bg-black/20"
            >
              <Link href={`/dashboard/activities/${completedWorkout._id}`}>
                <ExternalLink className="mr-1.5 h-3 w-3" />
                Ver Detalhes
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Race prediction */}
      {activity.type === "race" && typeof activity.distance === 'number' && getPredictedRaceTime(activity.distance) && (
        <div className={cn("mt-2 p-3 rounded-md", innerElementStyles.predictionBox)}>
          <p className="text-sm font-medium">
            Tempo previsto: {getPredictedRaceTime(activity.distance)?.time}
          </p>
        </div>
      )}

      {/* Workouts */}
      {activity.workouts?.map((workout, widx) => (
        <div key={widx} className="my-2">
          {workout.link ? (
            <Button
              variant="secondary"
              asChild
              className={cn("h-7 text-xs", innerElementStyles.videoButton)}
            >
              <Link href={workout.link} target="_blank" rel="noopener noreferrer">
                <Youtube className="text-white mr-2 h-3 w-3" />
                {workout.note}
              </Link>
            </Button>
          ) : workout.note && (
            <p className="text-xs font-medium mb-2">{workout.note}</p>
          )}

          {workout.series && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
              {workout.series.map((serie, sidx) => (
                <div
                  key={sidx}
                  className={cn("p-3 rounded-md text-center", innerElementStyles.seriesBox)}
                >
                  <div className="text-sm font-medium">{serie.sets}</div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="font-bold">{serie.work}</span>
                    {serie.distance && (
                      <span className="text-xs opacity-90">
                        @ {getActivityPace({
                          ...activity,
                          distance: serie.distance,
                        })} /km
                      </span>
                    )}
                  </div>
                  {serie.rest && (
                    <div className="text-xs mt-1 opacity-75">
                      {serie.rest}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Botão de registrar treino (mostrado apenas para usuários autenticados e treinos não realizados) */}
      {isAuthenticated && !isCompleted && (
        <div className="mt-3">
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full bg-white/30 dark:bg-black/20 hover:bg-white/50 dark:hover:bg-black/30"
            onClick={handleLogClick}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Registrar Treino
          </Button>
        </div>
      )}
    </div>
  );
};

// Cabeçalho do dia
const DayHeader: React.FC<{
  date: string;
  isToday: boolean;
  isPast: boolean;
}> = ({ date, isToday, isPast }) => (
  <div className={cn(
    "flex items-center justify-between py-3 px-2",
    isToday && "text-primary"
  )}>
    <div className="flex items-center gap-3">
      <h3 className="font-medium text-sm tracking-tight">{date}</h3>
      {isToday && (
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary hover:bg-primary/20 ring-1 ring-primary/20"
        >
          Hoje
        </Badge>
      )}
    </div>
    {isPast && (
      <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
    )}
  </div>
);

// Componente principal WeeklyView
const WeeklyView: React.FC<WeeklyViewProps> = ({
  week,
  windex,
  todayRef,
  getActivityPace,
  convertMinutesToHours,
  getPredictedRaceTime,
  completedWorkouts = [],
  isAuthenticated,
  onLogWorkout,
}) => {
  // Extrair planPath dos workouts, se disponível
  const planPath = useMemo(() => {
    if (completedWorkouts && completedWorkouts.length > 0) {
      return completedWorkouts.find(w => w.planPath)?.planPath;
    }
    return undefined;
  }, [completedWorkouts]);

  // Usa o calculador otimizado para obter estatísticas semanais
  const { weeklyVolume, totalWorkouts } = calculateWeeklyStats(
    week.days,
    getActivityPace
  );

  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base sm:text-2xl">
          <span className="-ml-2">Semana {windex + 1}</span>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{weeklyVolume.km.toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{convertMinutesToHours(weeklyVolume.minutes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              <span>{totalWorkouts} treinos</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 py-4">
        <div className="p-1">
          {week.days.map((day, dindex) => (
            <div
              key={dindex}
              ref={day.isToday ? todayRef : null}
              className={cn(
                "rounded-lg bg-card mb-2",
                day.isToday && "ring-1 ring-primary"
              )}
            >
              <DayHeader
                date={day.date}
                isToday={day.isToday}
                isPast={day.isPast}
              />

              <div className="p-2 space-y-2">
                {day.note && (
                  <>
                    <p className="text-xs text-muted-foreground">{day.note}</p>
                    <Separator />
                  </>
                )}

                <div className="space-y-1">
                  {day.activities.map((activity, aindex) => (
                    <ActivityCard
                      key={aindex}
                      activity={activity}
                      date={day.date}
                      dayIndex={dindex}
                      planPath={planPath}
                      getActivityPace={getActivityPace}
                      convertMinutesToHours={convertMinutesToHours}
                      getPredictedRaceTime={getPredictedRaceTime}
                      completedWorkouts={completedWorkouts}
                      isAuthenticated={isAuthenticated}
                      onLogWorkout={onLogWorkout}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyView;