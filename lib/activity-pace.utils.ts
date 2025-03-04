// lib/activity-pace.utils.ts
import { Activity, PredictedRaceTime } from '@/types/training';

// Mantém o mapeamento existente
const PACE_MAPPING: Record<string, string> = {
  recovery: "Recovery Km",
  easy: "Easy Km",
  marathon: "M Km",
  threshold: "T Km",
  interval: "I Km",
  repetition: "R 1000m",
  walk: "Recovery Km",
  race: "Race Pace",
  long: "Easy Km",
};

// Funções auxiliares existentes
const getPaceInSeconds = (paceString: string): number => {
  const [minutes, seconds] = paceString.split(':').map(Number);
  return minutes * 60 + seconds;
};

const formatPace = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getRecoveryPaceRange = (selectedPaces: Record<string, string> | null): [string | null, string | null] => {
  if (!selectedPaces?.["Recovery Km"]) return [null, null];
  
  const recoveryRange = selectedPaces["Recovery Km"].split(" ")[0];
  const [lowerPace, upperPace] = recoveryRange.split('-');
  return [lowerPace, upperPace || lowerPace];
};

const calculateWalkPaceRange = (selectedPaces: Record<string, string> | null): string => {
  const [lowerRecoveryPace, upperRecoveryPace] = getRecoveryPaceRange(selectedPaces);
  if (!lowerRecoveryPace || !upperRecoveryPace) return "N/A";

  const lowerSeconds = getPaceInSeconds(lowerRecoveryPace) + 120;
  const upperSeconds = getPaceInSeconds(upperRecoveryPace) + 120;
  return `${formatPace(lowerSeconds)}-${formatPace(upperSeconds)}`;
};

/**
 * Verifica se existe um ritmo personalizado para o tipo de atividade
 * @param activityType Tipo de atividade
 * @param customPaces Ritmos personalizados
 * @returns Ritmo personalizado ou null se não existir
 */
const getCustomPace = (
  activityType: string,
  customPaces: Record<string, string> | null
): string | null => {
  if (!customPaces) return null;
  
  // Verificar primeiro customização direta por tipo de atividade
  const directCustomKey = `custom_${activityType}`;
  if (customPaces[directCustomKey]) {
    return customPaces[directCustomKey].split(" ")[0];
  }
  
  // Verificar customização pelo mapeamento
  const paceKey = PACE_MAPPING[activityType];
  if (!paceKey) return null;
  
  const mappedCustomKey = `custom_${paceKey}`;
  if (customPaces[mappedCustomKey]) {
    return customPaces[mappedCustomKey].split(" ")[0];
  }
  
  return null;
};

export const calculateActivityPace = (
  activity: Activity,
  selectedPaces: Record<string, string> | null,
  getPredictedRaceTime: (distance: number) => PredictedRaceTime | null
): string => {
  if (!activity) return "N/A";
  
  // Verificações para unidades em minutos (tempo fixo)
  if (activity.units === "min") return "N/A";

  // Checar se há ritmos personalizados para o tipo de atividade
  if (activity.type) {
    const customPace = getCustomPace(activity.type, selectedPaces);
    if (customPace) return customPace;
  }

  // Handle race type activities
  if (activity.type === "race" && typeof activity.distance === "number") {
    const raceInfo = getPredictedRaceTime(activity.distance);
    return raceInfo ? raceInfo.pace : "N/A";
  }

  // Handle walk type activities
  if (activity.type === "walk" || 
      (typeof activity.distance === "string" && activity.distance.toLowerCase() === "walk")) {
    return calculateWalkPaceRange(selectedPaces);
  }

  // Handle activities with direct distance property
  if (activity.distance && typeof activity.distance === "string") {
    const distanceType = activity.distance.toLowerCase();
    const paceKey = PACE_MAPPING[distanceType];
    return selectedPaces && paceKey
      ? selectedPaces[paceKey]?.split(" ")[0] || "N/A"
      : "N/A";
  }

  // Handle activities with workouts
  if (activity.workouts?.[0]?.series?.[0]?.distance) {
    const distanceType = activity.workouts[0].series[0].distance.toLowerCase();
    const paceKey = PACE_MAPPING[distanceType];
    return selectedPaces && paceKey
      ? selectedPaces[paceKey]?.split(" ")[0] || "N/A"
      : "N/A";
  }

  // Handle activities based on type
  if (activity.type && PACE_MAPPING[activity.type]) {
    const paceKey = PACE_MAPPING[activity.type];
    return selectedPaces && selectedPaces[paceKey]
      ? selectedPaces[paceKey].split(" ")[0]
      : "N/A";
  }

  return "N/A";
};