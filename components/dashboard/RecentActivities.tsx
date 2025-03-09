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
    .sort((a, b) => {
      // Handling possible invalid or missing dates
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3); // Pegar apenas os 3 mais recentes para uma exibição mais compacta

  // Formatar a duração (minutos) para hh:mm:ss
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    return hours > 0 
      ? `${hours}h${mins.toString().padStart(2, '0')}`
      : `${mins}min`;
  };

  // Safe format date function to handle potential invalid dates
  const safeFormatDate = (dateString: string): string => {
    try {
      if (!dateString) return "Data desconhecida";
      const date = parseISO(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return "Data inválida";
      return format(date, "d MMM", { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Data inválida";
    }
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
    <Card className="border-border/50">
      <CardHeader className="p-2">
        <CardTitle className="text-xs">Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-1.5">
          {sortedWorkouts.length > 0 ? (
            <>
              {sortedWorkouts.map((workout, index) => (
                <div 
                  key={workout._id?.toString() || `workout-${index}`} 
                  className="flex items-start gap-1.5 p-1.5 rounded-md hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-1 self-stretch rounded-full ${getActivityColor(workout.activityType)}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <Link 
                        href={`/dashboard/activities/${workout._id}`}
                        className="text-xs font-medium hover:text-primary transition-colors line-clamp-1"
                      >
                        {workout.title}
                      </Link>
                      
                      <Badge variant="outline" className={`${getActivityColor(workout.activityType)} text-[10px] h-4 py-0 ml-1`}>
                        {workout.activityType}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground mt-0.5">
                      <div className="flex items-center gap-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        <span>{safeFormatDate(workout.date)}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Activity className="h-2.5 w-2.5" />
                        <span>{workout.distance.toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{formatDuration(workout.duration)}</span>
                      </div>
                      
                      {workout.pace && (
                        <div className="flex items-center gap-0.5">
                          <BarChart2 className="h-2.5 w-2.5 text-primary" />
                          <span className="font-medium">{workout.pace}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="h-6 text-xs mr-1"
                >
                  <Link href="/dashboard/activities">
                    Ver todas
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="h-6 text-xs"
                >
                  <Link href="/dashboard/log">
                    <PlusCircle className="mr-1 h-3 w-3" />
                    Registrar
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-3">
              <p className="text-muted-foreground text-xs mb-2">
                Você ainda não registrou nenhum treino.
              </p>
              <Button variant="default" size="sm" asChild className="h-7 text-xs">
                <Link href="/dashboard/log">
                  <PlusCircle className="mr-1 h-3 w-3" />
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