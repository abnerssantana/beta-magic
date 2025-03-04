import { Plan } from './plan';

export type ActivityType = 
  | 'recovery' 
  | 'easy' 
  | 'threshold' 
  | 'interval' 
  | 'repetition' 
  | 'race' 
  | 'offday'
  | 'marathon'
  | 'walk';

export interface Series {
  sets: string;
  work: string;
  rest?: string;
  distance?: string;
}

export interface Workout {
  note?: string;
  link?: string;
  series?: Series[];
}

export interface Activity {
  activity?: string;
  type: ActivityType;
  distance: number | string;
  units: 'km' | 'min';
  note?: string;
  workouts?: Workout[];
}

export interface DayData {
  activities: Activity[];
  note?: string;
}

export interface DayInfo {
  date: string;
  activities: Activity[];
  note?: string;
  isToday: boolean;
  isPast: boolean;
}

export interface WeekBlock{
  weekStart: string;
  days: DayInfo[];
}

export interface PredictedRaceTime {
  time: string;
  pace: string;
}

export interface TrainingPlan extends Plan {
dailyWorkouts: DayData[];
}

export type WeeklyBlock = WeekBlock;