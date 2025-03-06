import React, { useState, useEffect } from 'react';
import { format, addDays, isToday, isPast, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { PlanSummary } from '@/models';
import { WorkoutLog } from '@/models/userProfile';
import WorkoutDetailsModal from '@/components/dashboard/WorkoutDetailsModal';
import Link from 'next/link';

interface TrainingCalendarProps {
  activePlan: PlanSummary | null;
  planWorkouts: any[] | null;
  completedWorkouts?: WorkoutLog[];
}

export function TrainingCalendar({ activePlan, planWorkouts, completedWorkouts = [] }: TrainingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Map activity type to a specific color
  const getActivityColor = (activityType: string) => {
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
    
    return types[activityType] || 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30';
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

  // Handle day click to open the modal
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // No Active Plan State
  if (!activePlan) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 flex flex-col items-center text-center">
        <div className="rounded-full bg-muted p-2 mb-3">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium mb-2">Nenhum plano ativo</h3>
        <p className="text-xs text-muted-foreground max-w-md mb-3">
          Ative um plano para visualizar seu calendário de treinos.
        </p>
        <Button asChild size="sm" className="h-8 text-xs">
          <Link href="/dashboard/plans">
            Escolher um Plano
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <CardHeader className="py-2 px-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="truncate">{activePlan.name}</span>
            <Badge variant="outline" className="text-xs">
              {activePlan.nivel}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="h-7 w-7 p-0">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-7 text-xs">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek} className="h-7 w-7 p-0">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <div className="px-0 pt-0 pb-2">
        {/* Weekly Grid View - Optimized for desktop */}
        <div className="hidden md:grid md:grid-cols-7 gap-1.5 mb-2">
          {weekDays.map((day, index) => {
            const activities = getPlanDay(day);
            const dayCompletedWorkouts = getCompletedWorkoutsForDate(day);
            const hasCompletedWorkouts = dayCompletedWorkouts.length > 0;
            
            return (
              <div
                key={`grid-${index}`}
                className={`
                  min-h-[120px] p-1.5 rounded-lg cursor-pointer text-xs
                  ${isToday(day) ? 'bg-primary/5 ring-1 ring-primary/30' : ''}
                  ${hasCompletedWorkouts ? 'bg-green-500/10 ring-1 ring-green-500/30' : 'bg-muted/30'}
                  hover:bg-muted/50 transition-colors duration-200
                `}
                onClick={() => handleDayClick(day)}
              >
                <div className="text-center mb-1">
                  <div className="text-xs uppercase text-muted-foreground">
                    {format(day, 'EEEEEE', { locale: ptBR })}
                  </div>
                  <div className={`text-base font-semibold ${isToday(day) ? 'text-primary' : hasCompletedWorkouts ? 'text-green-600 dark:text-green-400' : ''}`}>
                    {format(day, 'd', { locale: ptBR })}
                  </div>
                </div>
                
                <div className="h-px bg-border/50 my-1" />
                
                <div className="space-y-1">
                  {activities && activities.map((activity: any, actIndex: number) => (
                    <div
                      key={actIndex}
                      className={`text-xs p-1 rounded ${getActivityColor(activity.type)} flex justify-between items-center`}
                    >
                      <span className="font-medium truncate text-xs">{activity.type}</span>
                      <span className="text-xs">{activity.distance}</span>
                      
                      {hasCompletedWorkouts && (
                        <CheckCircle className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  ))}
                  
                  {!activities && (
                    <div className="text-xs text-muted-foreground text-center p-1">
                      Descanso
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* List View - Optimized for mobile */}
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
                  p-2 rounded-lg cursor-pointer text-sm
                  ${isCurrentDay ? 'bg-primary/5 ring-1 ring-primary/30' : ''}
                  ${hasCompletedWorkouts ? 'bg-green-500/10 ring-1 ring-green-500/30' : 'bg-muted/30'}
                  hover:bg-muted/50 transition-colors duration-200
                `}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`text-base font-semibold ${isCurrentDay ? 'text-primary' : hasCompletedWorkouts ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {format(day, 'EEEE', { locale: ptBR })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(day, 'd MMM', { locale: ptBR })}
                    </div>
                  </div>
                  
                  {hasCompletedWorkouts && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                      Concluído
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 mt-2">
                  {activities && activities.map((activity: any, actIndex: number) => (
                    <div
                      key={actIndex}
                      className={`text-xs p-1.5 rounded ${getActivityColor(activity.type)} flex justify-between items-center`}
                    >
                      <span className="font-medium truncate text-xs">{activity.note || activity.type}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">{activity.distance} {activity.units}</span>
                        {hasCompletedWorkouts && (
                          <CheckCircle className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {!activities && (
                    <div className="text-xs text-muted-foreground text-center p-1">
                      Dia de descanso
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workout Details Modal */}
      {selectedDate && (
        <WorkoutDetailsModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          date={selectedDate}
          plannedActivities={getPlanDay(selectedDate) || []}
          completedWorkouts={getCompletedWorkoutsForDate(selectedDate)}
          activePlanPath={activePlan?.path}
        />
      )}
    </div>
  );
}

export default TrainingCalendar;