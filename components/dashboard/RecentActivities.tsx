import React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Calendar, 
  Clock, 
  BarChart2, 
  PlusCircle, 
  Link2,  
} from "lucide-react";
import { WorkoutLog } from '@/models/userProfile';

interface RecentActivitiesProps {
  completedWorkouts?: WorkoutLog[];
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ completedWorkouts = [] }) => {
  // Ordenar workouts por data, do mais recente para o mais antigo
  const sortedWorkouts = [...completedWorkouts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3); // Pegar apenas os 3 mais recentes para uma exibição mais compacta

  // Formatar a duração (minutos) para hh:mm:ss
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes % 1) * 60);
    
    return hours > 0 
      ? `${hours}h${mins.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para obter a cor baseada no tipo de atividade
  const getActivityColor = (type: string): string => {
    const types: Record<string, string> = {
      'easy': 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30',
      'recovery': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
      'threshold': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
      'interval': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
      'repetition': 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30',
      'race': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
      'long': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      'walk': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
      'strength': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30'
    };
    
    return types[type] || 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="p-3">
        <CardTitle className="text-sm">Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          {sortedWorkouts.length > 0 ? (
            <>
              {sortedWorkouts.map((workout, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-1 self-stretch rounded-full ${getActivityColor(workout.activityType)}`} />
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1">
                          <h4 className="text-sm font-medium">{workout.title}</h4>
                          {/* Indicador de treino vinculado ao plano */}
                          {workout.planPath && workout.planDayIndex !== undefined && (
                            <Badge variant="outline" className="ml-1 h-5 text-[10px] bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
                              <Link2 className="mr-1 h-3 w-3" />
                              Plano
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(parseISO(workout.date), "d MMM", { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            <span>{workout.distance.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(workout.duration)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Badge variant="outline" className={`${getActivityColor(workout.activityType)} text-xs h-5`}>
                        {workout.activityType}
                      </Badge>
                    </div>
                    
                    {workout.pace && (
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        <BarChart2 className="h-3 w-3 text-primary" />
                        <span className="font-medium">{workout.pace}</span>
                        
                        {/* Fonte do treino (Strava) */}
                        {workout.source === 'strava' && (
                          <Badge variant="outline" className="ml-auto text-[10px] h-4 bg-orange-500/5 border-orange-500/20 text-orange-600 dark:text-orange-400">
                            Strava
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="h-8 text-xs"
                >
                  <Link href="/dashboard/activities">
                    Ver todas
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="h-8 text-xs ml-2"
                >
                  <Link href="/dashboard/log">
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                    Registrar
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">
                Você ainda não registrou nenhum treino.
              </p>
              <Button variant="default" size="sm" asChild className="h-8 text-xs">
                <Link href="/dashboard/log">
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  Registrar treino
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;