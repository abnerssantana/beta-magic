import { ObjectId } from 'mongodb';

// Interface para representar um treino completado
export interface CompletedWorkout {
  date: string;
  workoutId: ObjectId;
  planPath?: string;
  planDayIndex?: number;
  distance: number;
}

// Interface para ritmos personalizados em um plano
export interface CustomPlanPaces {
  [planPath: string]: {
    baseTime: string;
    baseDistance: string;
    adjustmentFactor: string;
    [paceKey: string]: string;  // Para ritmos específicos como "custom_Easy Km"
  }
}

// Interface para estatísticas do usuário
export interface UserStats {
  totalDistance: number;
  completedWorkouts: CompletedWorkout[];
  streakDays: number;
  lastActive: Date;
}

// Interface para o perfil do usuário
export interface UserProfile {
  _id?: ObjectId;
  userId: string;
  activePlan?: string;  // planPath do plano ativo
  savedPlans: string[];  // array de planPaths
  customPaces: CustomPlanPaces;
  totalDistance: number;
  completedWorkouts: CompletedWorkout[];
  streakDays: number;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para um registro de treino
export interface WorkoutLog {
  _id?: ObjectId;
  userId: string;
  date: string;
  planPath?: string;
  planDayIndex?: number;
  title: string;
  distance: number;
  duration: number;  // em minutos
  pace?: string;
  notes?: string;
  activityType: string;
  source: 'manual' | 'strava' | 'garmin' | 'system';
  createdAt: Date;
  updatedAt: Date;
}