// models/index.ts
import { ObjectId } from 'mongodb';

// Tipos base das atividades
export interface Series {
  distance?: string;
  sets: string;
  work: string;
  rest?: string;
}

export interface Workout {
  note?: string;
  link?: string;
  series?: Series[];
}

export interface Activity {
  type: string;        // easy, recovery, interval, threshold, race, etc.
  distance: number | string;
  units: 'km' | 'min';
  note?: string;
  workouts?: Workout[];
}

// Modelo de dia de treino otimizado
export interface TrainingDay {
  activities: Activity[];
  note?: string;
}

// Interfaces de resumo (sem dados pesados)
export interface PlanSummary {
  _id?: ObjectId;
  name: string;
  nivel: 'iniciante' | 'intermediário' | 'avançado' | 'elite';
  coach: string;
  info: string;
  path: string;         // URL slug
  duration: string;     // Ex: "16 semanas"
  activities: string[]; // Tags como "corrida", "força", etc
  img?: string;
  isNew?: boolean;
  distances?: string[]; // Ex: ["5km", "10km"]
  volume?: string;      // Ex: "50"
  trainingPeaksUrl?: string;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  // Não inclui dailyWorkouts
}

// Modelo completo de plano para MongoDB
export interface PlanModel extends PlanSummary {
  dailyWorkouts: TrainingDay[]; // Array de dias de treino
}

// Interface de resumo do treinador
export interface TrainerSummary {
  _id?: ObjectId;
  id: string;                // slug do treinador 
  name: string;
  fullName?: string;
  title: string;
  profileImage: string;
  // biografia e redes sociais parciais ou ausentes
  createdAt: Date;
  updatedAt: Date;
}

// Modelo completo de treinador para MongoDB
export interface TrainerModel {
  _id?: ObjectId;
  id: string;           // slug do treinador
  name: string;
  fullName?: string;
  title: string;
  profileImage: string;
  biography: {
    title?: string;
    content: string;
  }[];
  socialMedia: {
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}