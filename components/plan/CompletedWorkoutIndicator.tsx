import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Activity } from '@/types/training';
import { WorkoutLog } from '@/models/userProfile';

interface CompletedWorkoutIndicatorProps {
  date: string;
  activity: Activity;
  completedWorkout?: WorkoutLog;
  isAuthorized: boolean;
}

export const CompletedWorkoutIndicator: React.FC<CompletedWorkoutIndicatorProps> = ({
  date,
  activity,
  completedWorkout,
  isAuthorized
}) => {
  if (!isAuthorized) return null;
  
  // Verifica se há um treino correspondente concluído
  const isCompleted = !!completedWorkout;
  
  // Formata a distância para exibição
  const formatDistance = (distance: number): string => {
    return `${distance.toFixed(1)} km`;
  };
  
  // Formata a duração para exibição
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    return hours > 0 
      ? `${hours}h${mins.toString().padStart(2, '0')}`
      : `${mins} min`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center ml-auto">
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          {isCompleted ? (
            <div className="text-sm">
              <p className="font-medium">{completedWorkout.title}</p>
              <div className="flex gap-2 text-xs mt-1">
                <span>{formatDistance(completedWorkout.distance)}</span>
                <span>•</span>
                <span>{formatDuration(completedWorkout.duration)}</span>
                {completedWorkout.pace && (
                  <>
                    <span>•</span>
                    <span>{completedWorkout.pace}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(completedWorkout.date), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </p>
            </div>
          ) : (
            <div className="text-sm">
              <p>Treino não realizado</p>
              <p className="text-xs text-muted-foreground">
                Registre este treino após concluí-lo
              </p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CompletedWorkoutIndicator;