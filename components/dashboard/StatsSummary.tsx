import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, 
  BarChart2, 
  Clock, 
  Calendar, 
  Flame,
  Award,
  Zap,
  TrendingUp,
  Timer,
  Ruler
} from "lucide-react";
import { WorkoutLog } from '@/models/userProfile';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
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
        avgDuration: 0,
        mostRecentWorkout: null,
        currentMonthDistance: 0,
        currentMonthActivities: 0,
        longestDistance: 0,
        fastestPace: "N/A",
        activityTypes: {},
        totalCalories: 0
      };
    }

    // Sort workouts by date (most recent first)
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const mostRecentWorkout = sortedWorkouts[0];
    
    // Calculate activity type distribution
    const activityTypes: Record<string, number> = {};
    workouts.forEach(workout => {
      const type = workout.activityType;
      activityTypes[type] = (activityTypes[type] || 0) + 1;
    });
    
    // Calculate average distance and duration
    const avgDistance = totalDistance / workouts.length;
    const avgDuration = totalDuration / workouts.length;
    
    // Find workout with longest distance
    const longestWorkout = workouts.reduce(
      (longest, current) => (current.distance > longest.distance ? current : longest),
      workouts[0]
    );
    
    // Calculate fastest pace (if available)
    let fastestPace = "N/A";
    let fastestPaceSeconds = Infinity;
    
    workouts.forEach(workout => {
      if (workout.pace) {
        const pace = workout.pace.replace(/\/km$/, '').trim();
        const [minutes, seconds] = pace.split(':').map(Number);
        const paceInSeconds = minutes * 60 + seconds;
        
        if (paceInSeconds < fastestPaceSeconds) {
          fastestPaceSeconds = paceInSeconds;
          fastestPace = workout.pace;
        }
      }
    });
    
    // Current month stats
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const currentMonthWorkouts = workouts.filter(workout => {
      const workoutDate = parseISO(workout.date);
      return isWithinInterval(workoutDate, { start: monthStart, end: monthEnd });
    });
    
    const currentMonthDistance = currentMonthWorkouts.reduce(
      (sum, workout) => sum + workout.distance, 
      0
    );
    
    // Estimate calories (very rough estimate: ~100 kcal per km for average runner)
    const totalCalories = Math.round(totalDistance * 100);

    return {
      avgPace: calculateAveragePace(totalDistance, totalDuration),
      avgDistance: avgDistance,
      avgDuration: avgDuration,
      mostRecentWorkout: mostRecentWorkout,
      currentMonthDistance: currentMonthDistance,
      currentMonthActivities: currentMonthWorkouts.length,
      longestDistance: longestWorkout.distance,
      fastestPace: fastestPace,
      activityTypes: activityTypes,
      totalCalories
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

  // Find primary activity type
  const getPrimaryActivityType = (): string => {
    if (Object.keys(stats.activityTypes).length === 0) return "N/A";
    
    return Object.entries(stats.activityTypes)
      .sort(([, a], [, b]) => b - a)[0][0];
  };

  // Format activity type for display
  const formatActivityType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'easy': 'Corrida Fácil',
      'recovery': 'Recuperação',
      'threshold': 'Limiar',
      'interval': 'Intervalado',
      'repetition': 'Repetições',
      'race': 'Competição',
      'long': 'Corrida Longa'
    };
    
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Resumo das Atividades</h2>
        
        {/* Primary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Atividades</p>
                <p className="text-2xl font-bold">{totalActivities}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Ruler className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Distância Total</p>
                <p className="text-2xl font-bold">{totalDistance.toFixed(1)} km</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tempo Total</p>
                <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-rose-500/5 border-rose-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Flame className="h-8 w-8 text-rose-500" />
              <div>
                <p className="text-sm text-muted-foreground">Calorias Queimadas</p>
                <p className="text-2xl font-bold">{stats.totalCalories.toLocaleString()} kcal</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Advanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Performance Insights */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Ritmo Médio</p>
                    <p className="text-lg font-semibold">{stats.avgPace}</p>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Ritmo Mais Rápido</p>
                    <p className="text-lg font-semibold">{stats.fastestPace}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Distância Média</p>
                    <p className="text-lg font-semibold">{stats.avgDistance.toFixed(2)} km</p>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Maior Distância</p>
                    <p className="text-lg font-semibold">{stats.longestDistance.toFixed(2)} km</p>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Tipo Principal de Treino</p>
                  <p className="text-lg font-semibold">{formatActivityType(getPrimaryActivityType())}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Current Month Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Mês Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Distância do Mês</p>
                    <p className="text-lg font-semibold">{stats.currentMonthDistance.toFixed(1)} km</p>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Atividades do Mês</p>
                    <p className="text-lg font-semibold">{stats.currentMonthActivities}</p>
                  </div>
                </div>
                
                {stats.mostRecentWorkout && (
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                    <p className="text-xs text-muted-foreground">Último Treino</p>
                    <p className="text-lg font-semibold">{stats.mostRecentWorkout.title}</p>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(stats.mostRecentWorkout.date), "d MMM", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        {stats.mostRecentWorkout.distance.toFixed(1)} km
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Duração Média por Treino</p>
                  <p className="text-lg font-semibold">{formatDuration(stats.avgDuration)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;