import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, BarChart2, ArrowRight, Activity, User2 } from 'lucide-react';
import { WorkoutLog } from '@/models/userProfile';
import Link from 'next/link';

interface WorkoutDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  plannedActivities?: any[];
  completedWorkouts?: WorkoutLog[];
  activePlanPath?: string;
}

export const WorkoutDetailsModal: React.FC<WorkoutDetailsModalProps> = ({
  open,
  onOpenChange,
  date,
  plannedActivities = [],
  completedWorkouts = [],
  activePlanPath
}) => {
  // Formatar a data para exibição
  const formattedDate = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  // Formatar duração (minutos para hh:mm:ss)
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes % 1) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mapear o tipo de atividade para uma cor específica
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
    
    return types[activityType] || 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
  };

  // Mapear o tipo de atividade para um nome legível
  const getActivityTypeName = (type: string): string => {
    const types: Record<string, string> = {
      'easy': 'Corrida Fácil',
      'recovery': 'Corrida de Recuperação',
      'threshold': 'Treino de Limiar',
      'interval': 'Treino Intervalado',
      'repetition': 'Treino de Repetições',
      'long': 'Corrida Longa',
      'marathon': 'Ritmo de Maratona',
      'race': 'Competição',
      'offday': 'Dia de Descanso',
      'walk': 'Caminhada'
    };
    
    return types[type] || type;
  };

  // Verificar se tem atividades para mostrar
  const hasActivities = plannedActivities.length > 0 || completedWorkouts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {formattedDate}
          </DialogTitle>
          <DialogDescription>
            Detalhes dos treinos planejados e realizados para este dia
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {!hasActivities ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Não há treinos planejados ou registrados para este dia.</p>
              <p className="text-sm">Um dia de descanso é tão importante quanto um dia de treino!</p>
            </div>
          ) : (
            <>
              {/* Treinos Planejados */}
              {plannedActivities.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Treino Planejado</h3>
                  
                  {plannedActivities.map((activity, index) => (
                    <Card key={`plan-${index}`} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getActivityColor(activity.type)}>
                            {getActivityTypeName(activity.type)}
                          </Badge>
                          {activity.note && (
                            <span className="font-medium">{activity.note}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Activity className="h-4 w-4" />
                          <span>{activity.distance} {activity.units}</span>
                        </div>
                      </div>
                      
                      {activity.workouts && activity.workouts.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {activity.workouts.map((workout: any, wIdx: number) => (
                            <div key={`workout-${wIdx}`} className="p-2 bg-muted/30 rounded-md">
                              {workout.note && (
                                <p className="text-xs font-medium mb-2">{workout.note}</p>
                              )}
                              
                              {workout.series && workout.series.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                                  {workout.series.map((serie: any, sIdx: number) => (
                                    <div key={`serie-${sIdx}`} className="bg-muted/40 p-2 rounded text-xs">
                                      <div className="font-medium">{serie.sets}</div>
                                      <div className="flex items-center justify-between mt-1">
                                        <span>{serie.work}</span>
                                        {serie.rest && <span className="text-muted-foreground">/ {serie.rest}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {workout.link && (
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  asChild
                                  className="mt-2 h-7 text-xs bg-rose-500/80 hover:bg-rose-500/60 text-white"
                                >
                                  <Link href={workout.link} target="_blank">Ver vídeo demonstrativo</Link>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {/* Separador se tiver ambos os tipos de treino */}
              {plannedActivities.length > 0 && completedWorkouts.length > 0 && <Separator />}

              {/* Treinos Realizados */}
              {completedWorkouts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Treino Realizado</h3>
                  
                  {completedWorkouts.map((workout, index) => (
                    <Card key={`completed-${index}`} className="p-3 bg-green-500/5 border-green-500/20">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getActivityColor(workout.activityType)}>
                              {getActivityTypeName(workout.activityType)}
                            </Badge>
                            <span className="font-medium">{workout.title}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span>{workout.distance} km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDuration(workout.duration)}</span>
                          </div>
                          {workout.pace && (
                            <div className="flex items-center gap-1">
                              <BarChart2 className="h-4 w-4 text-muted-foreground" />
                              <span>{workout.pace}</span>
                            </div>
                          )}
                        </div>
                        
                        {workout.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{workout.notes}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <div className="w-full flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            
            {activePlanPath && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/plano/${activePlanPath}`}>
                  <User2 className="mr-2 h-4 w-4" />
                  Ver Plano Completo
                </Link>
              </Button>
            )}
            
            {!hasActivities && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/log">
                  <Activity className="mr-2 h-4 w-4" />
                  Registrar Treino
                </Link>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutDetailsModal;