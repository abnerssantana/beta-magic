// lib/activity-pace.utils.ts

import { Activity } from '@/types/training';
import { PredictedRaceTime } from '@/types';
import { activityTypeToPace, normalizePace } from './pace-manager';

/**
 * Calcula o ritmo para uma atividade específica
 */
export function calculateActivityPace(
  activity: Activity,
  customPaces: Record<string, string>,
  getPredictedRaceTime?: (distance: number) => PredictedRaceTime | null
): string {
  // Se a atividade não tem tipo, retorna N/A
  if (!activity.type) return "N/A";
  
  // Busca o nome do ritmo correspondente ao tipo de atividade
  const paceName = activityTypeToPace[activity.type];
  
  // Se não tiver correspondência, retorna N/A
  if (!paceName) return "N/A";
  
  // Verifica se existe um ritmo personalizado
  const customPaceKey = `custom_${paceName}`;
  const customPace = customPaces[customPaceKey];
  
  if (customPace) {
    return normalizePace(customPace);
  }
  
  // Se não tiver ritmo personalizado, busca ritmo base
  const basePace = customPaces[paceName];
  if (basePace) {
    return normalizePace(basePace);
  }
  
  // Casos especiais para ritmos de prova
  if (activity.type === 'race' && activity.distance && typeof activity.distance === 'number') {
    // Usa a função getPredictedRaceTime se disponível
    if (getPredictedRaceTime) {
      const prediction = getPredictedRaceTime(activity.distance);
      if (prediction && prediction.pace) {
        return prediction.pace;
      }
    }
  }
  
  // Retorna N/A se não encontrou nenhum ritmo
  return "N/A";
}

// Exporta a função de normalização para compatibilidade
export { normalizePace };