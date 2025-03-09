// lib/date-matching-utils.ts

import { parseISO, format, isEqual, isSameDay } from 'date-fns';
import { Activity } from '@/types/training';

/**
 * Compara se duas datas correspondem ao mesmo dia
 */
export function areSameDayDates(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return isSameDay(d1, d2);
}

/**
 * Extrai o dia do mês de uma data formatada
 */
export function extractDayFromDate(date: string): string {
  // Para o formato ISO "YYYY-MM-DD"
  if (date.includes('-') && date.split('-').length === 3) {
    return date.split('-')[2];
  }
  
  // Para o formato "d de mês de ano"
  if (date.includes(' de ')) {
    return date.split(' de ')[0].trim();
  }
  
  // Caso não consiga extrair, retorna a string original
  return date;
}

/**
 * Verifica se uma atividade do Strava corresponde a uma atividade do plano
 */
export function activityTypeMatches(stravaActivityType: string, planActivityType: string): boolean {
  // Mapear tipos do Strava para tipos do plano
  const activityTypeMap: Record<string, string[]> = {
    'Run': ['easy', 'recovery', 'threshold', 'interval', 'repetition', 'long', 'marathon', 'race'],
    'Walk': ['walk'],
    'Workout': ['strength', 'força'],
    'WeightTraining': ['strength', 'força'],
    'Ride': ['bike', 'cycling']
  };
  
  const compatibleTypes = activityTypeMap[stravaActivityType] || [];
  return compatibleTypes.includes(planActivityType);
}

/**
 * Encontra a melhor correspondência entre uma atividade do Strava e atividades do plano para uma data
 */
export function findBestPlanActivityMatch(
  stravaActivity: { 
    date: string; 
    type: string; 
    distance?: number; 
    duration?: number 
  },
  planDayActivities: Activity[]
): Activity | null {
  if (!planDayActivities || planDayActivities.length === 0) {
    return null;
  }
  
  // Primeiro tenta encontrar um match exato por tipo
  const exactTypeMatch = planDayActivities.find(activity => 
    activityTypeMatches(stravaActivity.type, activity.type)
  );
  
  if (exactTypeMatch) {
    return exactTypeMatch;
  }
  
  // Se não encontrar match exato, retorna a primeira atividade do dia
  // (assumindo que se é um único treino no dia, deve ser esse)
  if (planDayActivities.length === 1) {
    return planDayActivities[0];
  }
  
  // Se houver mais de uma atividade, tenta encontrar a melhor correspondência baseada na distância
  if (stravaActivity.distance && typeof stravaActivity.distance === 'number') {
    const distanceInKm = stravaActivity.distance;
    
    // Encontra a atividade com a distância mais próxima
    return planDayActivities.reduce((closest, current) => {
      if (typeof current.distance !== 'number') {
        return closest;
      }
      
      const currentDiff = Math.abs(current.distance - distanceInKm);
      const closestDiff = closest ? Math.abs((typeof closest.distance === 'number' ? closest.distance : 0) - distanceInKm) : Infinity;
      
      return currentDiff < closestDiff ? current : closest;
    }, null as Activity | null);
  }
  
  // Se não conseguir encontrar nenhuma correspondência boa, retorna null
  return null;
}