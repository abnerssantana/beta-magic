import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Activity, 
  Clock, 
  ChevronUp,
  ChevronDown,
  Minus,
  Route,
  Repeat
} from "lucide-react";
import { WorkoutLog } from '@/models/userProfile';
import { format, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface StatsOverviewProps {
  workouts: WorkoutLog[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ workouts }) => {
  // Calculate basic stats
  const totalDistance = useMemo(() => 
    workouts.reduce((sum, workout) => sum + workout.distance, 0),
    [workouts]
  );
  
  const totalDuration = useMemo(() => 
    workouts.reduce((sum, workout) => sum + workout.duration, 0),
    [workouts]
  );
  
  const totalActivities = workouts.length;

  // Calculate advanced stats
  const stats = useMemo(() => {
    if (workouts.length === 0) {
      return {
        avgPace: "N/A",
        avgDistance: 0,
        currentMonthDistance: 0,
        prevMonthDistance: 0,
        consistencyStreak: 0
      };
    }

    // Sort workouts by date (most recent first)
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Calculate average distance
    const avgDistance = totalDistance / workouts.length;
    
    // Current month stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const currentMonthWorkouts = workouts.filter(workout => {
      const workoutDate = parseISO(workout.date);
      return workoutDate >= monthStart && workoutDate <= monthEnd;
    });
    
    // Previous month stats for comparison
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const prevMonthWorkouts = workouts.filter(workout => {
      const workoutDate = parseISO(workout.date);
      return workoutDate >= prevMonthStart && workoutDate <= prevMonthEnd;
    });
    
    const currentMonthDistance = currentMonthWorkouts.reduce(
      (sum, workout) => sum + workout.distance, 
      0
    );
    
    const prevMonthDistance = prevMonthWorkouts.reduce(
      (sum, workout) => sum + workout.distance, 
      0
    );

    // Simplified consistency - just count consecutive days with workouts
    let consistencyStreak = 0;
    
    // Add some basic stats
    return {
      avgPace: calculateAveragePace(totalDistance, totalDuration),
      avgDistance,
      currentMonthDistance,
      prevMonthDistance,
      consistencyStreak: workouts.length > 0 ? Math.min(7, workouts.length) : 0 // Simplified for visual example
    };
  }, [workouts, totalDistance, totalDuration]);

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    return hours > 0 
      ? `${hours}h${mins.toString().padStart(2, '0')}`
      : `${mins}min`;
  };

  // Calculate average pace
  function calculateAveragePace(totalDistance: number, totalDuration: number): string {
    if (totalDistance === 0) return "N/A";
    
    const paceMinutes = totalDuration / totalDistance;
    const paceMinutesInt = Math.floor(paceMinutes);
    const paceSeconds = Math.round((paceMinutes - paceMinutesInt) * 60);
    
    return `${paceMinutesInt}:${paceSeconds.toString().padStart(2, '0')}/km`;
  }

  // Calculate month-over-month progress percentage
  const monthProgress = useMemo(() => {
    if (stats.prevMonthDistance === 0) return 100;
    const change = stats.currentMonthDistance - stats.prevMonthDistance;
    return Math.round((change / stats.prevMonthDistance) * 100);
  }, [stats.currentMonthDistance, stats.prevMonthDistance]);

  // Determine the month names
  const currentMonthName = format(new Date(), 'MMM', { locale: ptBR });
  const prevMonthName = format(subMonths(new Date(), 1), 'MMM', { locale: ptBR });

  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      <Card className="bg-primary/5 border-primary/20 col-span-2 sm:col-span-1">
        <CardContent className="p-3 flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Atividades</p>
            <p className="text-lg font-semibold">{totalActivities}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-blue-500/5 border-blue-500/20 col-span-2 sm:col-span-1">
        <CardContent className="p-3 flex items-center gap-2">
          <Route className="h-6 w-6 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">Distância</p>
            <p className="text-lg font-semibold">{totalDistance.toFixed(1)} km</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-orange-500/5 border-orange-500/20 col-span-2 sm:col-span-1">
        <CardContent className="p-3 flex items-center gap-2">
          <Clock className="h-6 w-6 text-orange-500" />
          <div>
            <p className="text-xs text-muted-foreground">Tempo</p>
            <p className="text-lg font-semibold">{formatDuration(totalDuration)}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-green-500/5 border-green-500/20 col-span-2 sm:col-span-1">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Mês Atual</p>
              <p className="text-lg font-semibold">{stats.currentMonthDistance.toFixed(1)} km</p>
            </div>
          </div>
          <div className="flex items-center">
            {monthProgress > 0 ? (
              <div className="flex items-center text-green-500 text-xs font-medium">
                <ChevronUp className="h-3 w-3" />
                <span>{monthProgress}%</span>
              </div>
            ) : monthProgress < 0 ? (
              <div className="flex items-center text-red-500 text-xs font-medium">
                <ChevronDown className="h-3 w-3" />
                <span>{Math.abs(monthProgress)}%</span>
              </div>
            ) : (
              <div className="flex items-center text-muted-foreground text-xs">
                <Minus className="h-3 w-3" />
                <span>0%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;