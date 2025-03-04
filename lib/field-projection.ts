// lib/field-projection.ts
import { ObjectId } from 'mongodb';

// Interface para definir o tipo completo do plano
export interface PlanModel {
  _id?: ObjectId;
  name: string;
  nivel: 'iniciante' | 'intermediário' | 'avançado' | 'elite';
  coach: string;
  info: string;
  path: string;
  duration: string;
  activities: string[];
  img?: string;
  isNew?: boolean;
  distances?: string[];
  volume?: string;
  trainingPeaksUrl?: string;
  videoUrl?: string;
  dailyWorkouts: any[]; // O campo mais pesado
  createdAt: Date;
  updatedAt: Date;
}

// Campos resumidos para listagens e cards
export const PLAN_SUMMARY_FIELDS = {
  _id: 1,
  name: 1,
  nivel: 1,
  coach: 1,
  info: 1,
  path: 1,
  duration: 1,
  activities: 1,
  img: 1,
  isNew: 1,
  distances: 1,
  volume: 1,
  trainingPeaksUrl: 1,
  videoUrl: 1,
  createdAt: 1,
  updatedAt: 1,
  // Explicitamente excluindo dailyWorkouts
};

// Tipo derivado apenas com os campos resumidos
export type PlanSummary = Omit<PlanModel, 'dailyWorkouts'>;

// Interface para definir o tipo completo do treinador
export interface TrainerModel {
  _id?: ObjectId;
  id: string;
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

// Campos resumidos para listagens de treinadores
export const TRAINER_SUMMARY_FIELDS = {
  _id: 1,
  id: 1,
  name: 1,
  fullName: 1,
  title: 1,
  profileImage: 1,
  createdAt: 1,
  updatedAt: 1
  // Omitindo biografia completa e outros detalhes
};

// Tipo derivado apenas com os campos resumidos do treinador
export type TrainerSummary = Pick<TrainerModel, 
  '_id' | 'id' | 'name' | 'fullName' | 'title' | 'profileImage' | 'createdAt' | 'updatedAt'
>;