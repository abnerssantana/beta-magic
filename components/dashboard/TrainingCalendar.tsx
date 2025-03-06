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
    <div className="space-y-4">
      {activePlan ? (
        <>
          <Card>
            <CardHeader className="py-3 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{activePlan.name}</span>
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
            <CardContent className="px-3 pt-0 pb-3">
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day, index) => {
                  // Get activities for this day
                  const activities = getPlanDay(day);
                  const dayCompletedWorkouts = getCompletedWorkoutsForDate(day);
                  const hasCompletedWorkouts = dayCompletedWorkouts.length > 0;
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[120px] p-1.5 rounded-lg border cursor-pointer text-xs
                        ${isToday(day) ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border'}
                        hover:bg-muted/20 transition-colors duration-200
                      `}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="text-center mb-1">
                        <div className="text-xs uppercase text-muted-foreground">
                          {format(day, 'EEEEEE', { locale: ptBR })}
                        </div>
                        <div className={`text-base font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
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
                            <span className="font-medium truncate text-xs">{activity.type}</span>
                            <span className="text-xs">{activity.distance}</span>
                            
                            {isPast(day) && (
                              <CheckCircle className="h-2.5 w-2.5 text-green-500" />
                            )}
                          </div>
                        ))}
                        
                        {hasCompletedWorkouts && (
                          <div className="text-xs bg-green-500/10 border border-green-500/20 rounded p-1 flex justify-between mt-1">
                            <span className="font-medium">Feito</span>
                            <span>{dayCompletedWorkouts.length}</span>
                          </div>
                        )}
                        
                        {!activities && !hasCompletedWorkouts && (
                          <div className="text-xs text-muted-foreground text-center p-1">
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
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Próximos Treinos</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                {[0, 1, 2].map((offset, index) => {
                  const futureDate = addDays(new Date(), offset + 1);
                  const dayActivities = getPlanDay(futureDate);
                  
                  if (!dayActivities || dayActivities.length === 0) return null;
                  
                  const mainActivity = dayActivities[0];
                  const relativeDay = offset === 0 ? 'Amanhã' : `Em ${offset+1} dias`;
                  const activityName = mainActivity.note || mainActivity.type;
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-1 h-10 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">
                            {relativeDay} - {activityName}
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1 text-xs h-5">
                            <Clock className="h-2.5 w-2.5" />
                            {mainActivity.distance} {mainActivity.units}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="w-full h-8 text-xs mt-2"
                >
                  <Link href={`/plano/${activePlan.path}`}>
                    Ver plano completo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
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