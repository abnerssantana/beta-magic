import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { format, addDays, isToday, isPast, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Activity, CheckCircle } from 'lucide-react';
import { PlanSummary } from '@/models';
import { WorkoutLog } from '@/models/userProfile';
import WorkoutDetailsModal from '@/components/dashboard/WorkoutDetailsModal';

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

  // Calculate day index in the training plan - simplified for demonstration
  const getPlanDay = (date: Date) => {
    if (!planWorkouts) return null;
    
    // This is a simplified approach. In a real implementation, you would:
    // 1. Calculate the difference in days between the plan start date and the provided date
    // 2. Get the corresponding day in the plan based on this difference
    
    // For demonstration, we'll use a simple algorithm
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

  return (
    <div className="space-y-6">
      {activePlan ? (
        <>
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle>
                  <span>{activePlan.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {activePlan.nivel}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Hoje
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  // Get activities for this day
                  const activities = getPlanDay(day);
                  const dayCompletedWorkouts = getCompletedWorkoutsForDate(day);
                  const hasCompletedWorkouts = dayCompletedWorkouts.length > 0;
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[150px] p-2 rounded-lg border cursor-pointer
                        ${isToday(day) ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border'}
                        hover:bg-muted/20 transition-colors duration-200
                      `}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="text-center mb-1">
                        <div className="text-xs uppercase text-muted-foreground">
                          {format(day, 'EEEE', { locale: ptBR })}
                        </div>
                        <div className={`text-lg font-bold ${isToday(day) ? 'text-primary' : ''}`}>
                          {format(day, 'd', { locale: ptBR })}
                        </div>
                      </div>
                      
                      <Separator className="my-1" />
                      
                      <div className="space-y-1">
                        {activities && activities.map((activity: any, actIndex: number) => (
                          <div
                            key={actIndex}
                            className={`text-xs p-1 rounded ${getActivityColor(activity.type)} flex justify-between items-center`}
                          >
                            <span className="font-medium truncate">{activity.type}</span>
                            <span>{activity.distance} {activity.units}</span>
                            
                            {isPast(day) && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        ))}
                        
                        {hasCompletedWorkouts && (
                          <div className="text-xs bg-green-500/10 border border-green-500/20 rounded p-1 flex justify-between mt-1">
                            <span className="font-medium">Treino realizado</span>
                            <span>{dayCompletedWorkouts.length}</span>
                          </div>
                        )}
                        
                        {!activities && !hasCompletedWorkouts && (
                          <div className="text-xs text-muted-foreground text-center p-2">
                            Descanso
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Próximos Treinos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-2 h-full min-h-[40px] rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">
                          {index === 0 ? 'Amanhã' : `${index+1} dias`} - {['Corrida fácil', 'Intervalos', 'Longo'][index]}
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {['6:00', '4:30', '5:30'][index]} /km
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Activity className="h-3.5 w-3.5" />
                        {[8, 6, 16][index]} km
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <CalendarIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum plano ativo</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Você ainda não tem um plano de treino ativo. Ative um plano para visualizar seu calendário de treinos.
            </p>
            <Button asChild>
              <Link href="/dashboard/plans">
                Escolher um Plano
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

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