import React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, Clock, BarChart2 } from "lucide-react";
import { WorkoutLog } from '@/models/userProfile';

interface RecentActivitiesProps {
  completedWorkouts?: WorkoutLog[];
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ completedWorkouts = [] }) => {
  // Ordenar workouts por data, do mais recente para o mais antigo
  const sortedWorkouts = [...completedWorkouts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5); // Pegar apenas os 5 mais recentes

  // Formatar a duração (minutos) para hh:mm:ss
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes % 1) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para obter a cor baseada no tipo de atividade
  const getActivityColor = (type: string): string => {
    const types: Record<string, string> = {
      'easy': 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30',
      'recovery': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
      'threshold': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
      'interval': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
      'repetition': 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30',
      'race': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30'
    };
    
    return types[type] || 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
        <CardDescription>
          Seus treinos mais recentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedWorkouts.length > 0 ? (
            sortedWorkouts.map((workout, index) => (
              <div key={index} className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className={`w-1.5 self-stretch rounded-full ${getActivityColor(workout.activityType)}`} />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{workout.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(parseISO(workout.date), "d 'de' MMMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5" />
                          <span>{workout.distance} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDuration(workout.duration)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className={getActivityColor(workout.activityType)}>
                      {workout.activityType}
                    </Badge>
                  </div>
                  
                  {workout.pace && (
                    <div className="mt-2 flex items-center gap-1 text-sm">
                      <BarChart2 className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">Ritmo: {workout.pace}</span>
                    </div>
                  )}
                  
                  {workout.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{workout.notes}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                Você ainda não registrou nenhum treino.
              </p>
              <Button variant="link" asChild>
                <Link href="/dashboard/log">
                  Registrar treino manual
                </Link>
              </Button>
            </div>
          )}
          
          {sortedWorkouts.length > 0 && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/activities">
                  Ver todas as atividades
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