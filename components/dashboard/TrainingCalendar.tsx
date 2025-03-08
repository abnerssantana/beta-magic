import React, { useState, useEffect } from 'react';
import { format, addDays, isToday, isPast, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Timer,
  Ruler,
  Zap,
  Clock,
  Heart,
  Activity,
  ExternalLink,
  Settings
} from 'lucide-react';
import { PlanSummary } from '@/models';
import { WorkoutLog } from '@/models/userProfile';
import Link from 'next/link';

interface TrainingCalendarProps {
  activePlan: PlanSummary | null;
  planWorkouts: any[] | null;
  completedWorkouts?: WorkoutLog[];
  weekProgress?: number;
}

export function TrainingCalendar({
  activePlan,
  planWorkouts,
  completedWorkouts = [],
  weekProgress = 0
}: TrainingCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>(() => {
    // Inicializa com a semana atual
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  });

  useEffect(() => {
    // Define the days of the current week
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    setWeekDays(days);
  }, [currentDate]);

  const goToPreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Map activity type to icon and color
  const getActivityTypeInfo = (activityType: string) => {
    const types: { [key: string]: { color: string, icon: React.ReactNode, label: string } } = {
      'easy': {
        color: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
        icon: <Heart className="h-3 w-3" />,
        label: 'Fácil'
      },
      'recovery': {
        color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
        icon: <Clock className="h-3 w-3" />,
        label: 'Recup.'
      },
      'threshold': {
        color: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
        icon: <Timer className="h-3 w-3" />,
        label: 'Limiar'
      },
      'interval': {
        color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
        icon: <Zap className="h-3 w-3" />,
        label: 'Interv.'
      },
      'repetition': {
        color: 'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30',
        icon: <Activity className="h-3 w-3" />,
        label: 'Repet.'
      },
      'race': {
        color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
        icon: <Timer className="h-3 w-3" />,
        label: 'Prova'
      },
      'long': {
        color: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        icon: <Ruler className="h-3 w-3" />,
        label: 'Longa'
      },
      'marathon': {
        color: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        icon: <Ruler className="h-3 w-3" />,
        label: 'Maratona'
      },
      'walk': {
        color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
        icon: <Activity className="h-3 w-3" />,
        label: 'Caminhada'
      },
      'offday': {
        color: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30',
        icon: <Clock className="h-3 w-3" />,
        label: 'Descanso'
      }
    };

    return types[activityType] || {
      color: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30',
      icon: <Activity className="h-3 w-3" />,
      label: 'Outro'
    };
  };

  // Calculate day index in the training plan
  const getPlanDay = (date: Date) => {
    if (!planWorkouts) return null;

    // Get the day of the week (0-6)
    const dayOfWeek = date.getDay();

    // If workouts exist, return the corresponding day's workout or null
    return planWorkouts[dayOfWeek] ? planWorkouts[dayOfWeek].activities : null;
  };

  // Get completed workouts for a specific date
  const getCompletedWorkoutsForDate = (date: Date) => {
    return completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return isSameDay(workoutDate, date);
    });
  };

  // Handle day click to navigate to the plan page
  const handleDayClick = () => {
    if (activePlan?.path) {
      router.push(`/plano/${activePlan.path}`);
    }
  };

  // Format distance or duration
  const formatValue = (value: number | string, units: string) => {
    if (units === 'min' && typeof value === 'number' && value > 59) {
      const hours = Math.floor(value / 60);
      const mins = value % 60;
      return `${hours}h${mins > 0 ? mins : ''}`;
    }
    return `${value}${units === 'min' ? 'm' : 'km'}`;
  };

  // No Active Plan State
  if (!activePlan) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-2">Nenhum plano ativo</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Ative um plano para visualizar seu calendário de treinos.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link href="/dashboard/plans">
                Escolher um Plano
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-3">
          {/* Header com título e botões de ação */}
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg">Calendário de Treino</CardTitle>
          </div>

          {/* Progresso Semanal */}
          <div className="space-y-1 pb-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso Semanal</span>
              <span className="font-medium">{weekProgress}%</span>
            </div>
            <Progress value={weekProgress} className="h-1.5" />
          </div>

          {/* Navegação entre semanas */}
          <div className="flex items-center justify-between pb-1">
            <p className="text-xs text-muted-foreground">
              {format(weekDays[0], 'dd MMM', { locale: ptBR })} - {format(weekDays[6], 'dd MMM', { locale: ptBR })}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        {/* Weekly Grid View - Desktop optimization */}
        <div className="hidden md:grid md:grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const activities = getPlanDay(day);
            const dayCompletedWorkouts = getCompletedWorkoutsForDate(day);
            const hasCompletedWorkouts = dayCompletedWorkouts.length > 0;
            const isCurrentDay = isToday(day);

            return (
              <div
                key={`grid-${index}`}
                className={`
                  p-2 rounded-lg cursor-pointer text-xs
                  ${isCurrentDay ? 'bg-primary/5 ring-1 ring-primary/20' : ''}
                  ${hasCompletedWorkouts ? 'bg-green-500/5 ring-1 ring-green-500/20' : 'bg-muted/20'}
                  hover:bg-muted/40 transition-colors duration-200
                `}
                onClick={handleDayClick}
              >
                <div className="text-center mb-2">
                  <div className="text-xs uppercase text-muted-foreground font-medium">
                    {format(day, 'EEEE', { locale: ptBR })}
                  </div>
                  <div className={`text-xl font-bold ${isCurrentDay ? 'text-primary' : hasCompletedWorkouts ? 'text-green-600 dark:text-green-400' : ''}`}>
                    {format(day, 'd', { locale: ptBR })}
                  </div>
                </div>

                <div className="h-px bg-border/30 my-2" />

                <div className="space-y-1.5">
                  {activities && activities.map((activity: any, actIndex: number) => {
                    const { color, icon, label } = getActivityTypeInfo(activity.type);
                    return (
                      <div
                        key={actIndex}
                        className={`
                          p-1.5 rounded-md ${color}
                          ring-1 ring-inset
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            {icon}
                            <span className="text-xs font-medium">{label}</span>
                          </div>

                          {hasCompletedWorkouts && (
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Ruler className="h-2.5 w-2.5" />
                            <span>{formatValue(activity.distance, activity.units)}</span>
                          </div>

                          {activity.type !== 'offday' && (
                            <div className="flex items-center gap-1">
                              <Timer className="h-2.5 w-2.5" />
                              <span>5:20/km</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {(!activities || activities.length === 0) && (
                    <div className="text-xs text-muted-foreground flex items-center justify-center p-2 bg-muted/30 rounded-md">
                      <Clock className="h-3 w-3 mr-1" />
                      Dia de descanso
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* List View - Mobile optimization */}
        <div className="md:hidden space-y-2">
          {weekDays.map((day, index) => {
            const activities = getPlanDay(day);
            const dayCompletedWorkouts = getCompletedWorkoutsForDate(day);
            const hasCompletedWorkouts = dayCompletedWorkouts.length > 0;
            const isCurrentDay = isToday(day);

            return (
              <div
                key={`list-${index}`}
                className={`
                  p-3 rounded-lg cursor-pointer 
                  ${isCurrentDay ? 'bg-primary/5 ring-1 ring-primary/20' : ''}
                  ${hasCompletedWorkouts ? 'bg-green-500/5 ring-1 ring-green-500/20' : 'bg-muted/20'}
                  hover:bg-muted/40 transition-colors duration-200
                `}
                onClick={handleDayClick}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`rounded-full size-8 flex items-center justify-center
                      ${isCurrentDay ? 'bg-primary/10 text-primary' :
                        hasCompletedWorkouts ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                          'bg-muted'}
                    `}>
                      <span className="text-sm font-bold">
                        {format(day, 'd', { locale: ptBR })}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {format(day, 'EEEE', { locale: ptBR })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(day, 'dd/MM', { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  {hasCompletedWorkouts && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Concluído
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 pl-9">
                  {activities && activities.map((activity: any, actIndex: number) => {
                    const { color, icon, label } = getActivityTypeInfo(activity.type);
                    return (
                      <div
                        key={actIndex}
                        className={`
                          p-2 rounded-md ${color} 
                          ring-1 ring-inset
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {icon}
                            <span className="text-xs font-medium">{label}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs">
                              <Ruler className="h-2.5 w-2.5" />
                              <span>{formatValue(activity.distance, activity.units)}</span>
                            </div>

                            {activity.type !== 'offday' && (
                              <div className="flex items-center gap-1 text-xs">
                                <Timer className="h-2.5 w-2.5" />
                                <span>5:20/km</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(!activities || activities.length === 0) && (
                    <div className="text-xs text-muted-foreground flex items-center p-2 bg-muted/30 rounded-md">
                      <Clock className="h-3 w-3 mr-1" />
                      Dia de descanso
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default TrainingCalendar;