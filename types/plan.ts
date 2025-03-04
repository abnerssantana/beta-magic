// types/plan.ts
export interface Plan {
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
  }