// lib/pace-manager.ts

import { PredictedRaceTime } from '@/types';
import { races, paces } from "@/lib/PacesRaces";
import { Activity } from '@/types/training';

// Default times for different distances
export const defaultTimes: Record<string, string> = {
  "1500m": "00:05:24",
  "1600m": "00:05:50",
  "3km": "00:11:33",
  "3200m": "00:12:28",
  "5km": "00:19:57",
  "10km": "00:41:21",
  "15km": "01:03:36",
  "21km": "01:31:35",
  "42km": "03:10:49"
};

// Mapping activity types to pace types
export const activityTypeToPace: Record<string, string> = {
  'easy': 'Easy Km',
  'recovery': 'Recovery Km',
  'threshold': 'T Km',
  'interval': 'I Km',
  'repetition': 'R 1000m',
  'long': 'M Km',
  'marathon': 'M Km',
  'race': 'Race Pace'
};

// Essential paces that should be saved and made available
export const essentialPaces = [
  'Easy Km',
  'Recovery Km',
  'T Km',
  'I Km',
  'R 1000m',
  'M Km'
];

// Paces that should be displayed as ranges
export const rangePaces = ['Recovery Km', 'Easy Km'];

// Pace descriptions for better understanding
export const paceDescriptions: Record<string, string> = {
  "Recovery Km": "Ritmo muito leve para recuperação ativa após treinos intensos",
  "Easy Km": "Ritmo fácil - use para a maioria dos treinos, deve permitir conversar",
  "M Km": "Ritmo de maratona - sustentável para provas longas",
  "T Km": "Ritmo de limiar - entre aeróbico e anaeróbico, desafiador mas mantível",
  "I Km": "Ritmo de intervalo - para melhorar VO₂max em intervalos de 3-5 min",
  "R 1000m": "Ritmo de repetição - mais rápido, para melhorar economia de corrida",
  "I 800m": "Intervalo de 800m - pouco mais rápido que o ritmo I",
  "R 400m": "Repetição de 400m - alta velocidade para desenvolvimento de potência",
  "Race Pace": "Ritmo de prova - específico para a competição alvo"
};

// Formatted names for display in the interface
export const paceDisplayNames: Record<string, string> = {
  "Recovery Km": "Recuperação",
  "Easy Km": "Fácil",
  "M Km": "Maratona",
  "T Km": "Limiar",
  "Race Pace": "Prova",
  "I Km": "Intervalo",
  "R 1000m": "Repetição 1000m",
  "I 800m": "Intervalo 800m",
  "R 400m": "Repetição 400m"
};

// Categorization of paces for different tabs
export const runningPaceTypes = ["Recovery Km", "Easy Km", "M Km", "T Km", "Race Pace"];
export const intervalPaceTypes = ["I Km", "R 1000m", "I 800m", "R 400m"];

/**
 * Normalize a pace value to the standard MM:SS format
 * Returns empty string for invalid values
 */
export function normalizePace(pace: string): string {
  if (!pace || pace === "0:00" || pace === "00:00") return "";

  // Remove any suffix or additional text
  const cleanValue = pace.replace(/\/km$|\/mi$|min\/km$|min\/mi$/, '').trim();
  
  // Check MM:SS format
  if (/^\d{1,2}:\d{2}$/.test(cleanValue)) {
    // Ensure seconds have two digits
    const [minutes, seconds] = cleanValue.split(':');
    return `${minutes}:${seconds.padStart(2, '0')}`;
  }
  
  // Try to convert numeric strings to minutes
  if (/^\d+(\.\d+)?$/.test(cleanValue)) {
    const numericValue = parseFloat(cleanValue);
    const minutes = Math.floor(numericValue);
    const seconds = Math.round((numericValue - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return ""; // Empty value for invalid formats
}

/**
 * Normalize a range pace to "MM:SS-MM:SS" format
 */
export function normalizeRangePace(pace: string): string {
  if (!pace) return "";
  
  // If it's already a range (contains hyphen)
  if (pace.includes('-')) {
    const [min, max] = pace.split('-').map(p => p.trim());
    const normalizedMin = normalizePace(min);
    const normalizedMax = normalizePace(max);
    
    // Check if both sides are valid
    if (normalizedMin && normalizedMax) {
      return `${normalizedMin}-${normalizedMax}`;
    }
  }
  
  // If it's a single pace, try to normalize it
  const normalizedSingle = normalizePace(pace);
  if (normalizedSingle) {
    return normalizedSingle;
  }
  
  return ""; // Empty value for invalid formats
}

/**
 * Check if a pace value is valid
 */
export function isValidPace(pace: string): boolean {
  if (!pace || pace === "0:00" || pace === "00:00") return false;
  
  // Check if it's a range pace
  if (pace.includes('-')) {
    const [min, max] = pace.split('-').map(p => p.trim());
    return isValidPace(min) && isValidPace(max);
  }
  
  const normalized = normalizePace(pace);
  return normalized !== "" && normalized !== "0:00" && normalized !== "00:00";
}

/**
 * Check if a pace is in range format
 */
export function isRangePace(pace: string): boolean {
  // Remove any suffix and check if it contains a hyphen
  return pace.replace(/\/km|\/mi$/, '').trim().includes('-');
}

/**
 * Convert a single pace value to a range pace
 * @param pace Single pace value (MM:SS format)
 * @param rangePercentage Percentage slower for the upper range (default 12%)
 * @returns Range pace in MM:SS-MM:SS format
 */
export function createRangePace(pace: string, rangePercentage: number = 12): string {
  if (!isValidPace(pace) || isRangePace(pace)) {
    return pace; // Return without changes if already a range or invalid
  }
  
  try {
    // Parse time to seconds
    const paceSeconds = paceToSeconds(pace);
    
    // Calculate slower pace (default 12% slower)
    const slowerPaceSeconds = paceSeconds * (1 + rangePercentage / 100);
    
    // Format both paces
    const fasterPace = secondsToPace(paceSeconds);
    const slowerPace = secondsToPace(slowerPaceSeconds);
    
    return `${fasterPace}-${slowerPace}`;
  } catch (e) {
    console.error("Error creating range pace:", e);
    return pace; // Return original if something goes wrong
  }
}

/**
 * Convert a pace value to seconds
 * For range paces, returns the average
 */
export function paceToSeconds(pace: string): number {
  if (!isValidPace(pace)) return 0;
  
  // Handle range paces (return average)
  if (isRangePace(pace)) {
    const [min, max] = pace.split('-').map(p => p.trim());
    const minSeconds = paceToSeconds(min);
    const maxSeconds = paceToSeconds(max);
    return (minSeconds + maxSeconds) / 2;
  }
  
  const normalized = normalizePace(pace);
  const [minutes, seconds] = normalized.split(':').map(Number);
  return minutes * 60 + seconds;
}

/**
 * Extract the minimum pace from a range
 */
export function getMinPace(pace: string): string {
  if (!isRangePace(pace)) return pace;
  
  const [min] = pace.split('-').map(p => p.trim());
  return min;
}

/**
 * Extract the maximum pace from a range
 */
export function getMaxPace(pace: string): string {
  if (!isRangePace(pace)) return pace;
  
  const [_, max] = pace.split('-').map(p => p.trim());
  return max;
}

/**
 * Convert seconds to pace format MM:SS
 */
export function secondsToPace(seconds: number): string {
  if (seconds <= 0) return "";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Apply an adjustment factor to a pace
 * Factor less than 100 = faster pace
 * Factor greater than 100 = slower pace
 * Works with both single and range paces
 */
export function adjustPace(pace: string, factor: number): string {
  if (!isValidPace(pace)) return "";
  
  // Handle range paces
  if (isRangePace(pace)) {
    const [min, max] = pace.split('-').map(p => p.trim());
    const adjustedMin = adjustPace(min, factor);
    const adjustedMax = adjustPace(max, factor);
    return `${adjustedMin}-${adjustedMax}`;
  }
  
  // Convert pace to seconds
  const paceSeconds = paceToSeconds(pace);
  if (paceSeconds <= 0) return "";
  
  // Apply adjustment factor (factor < 100 = faster pace)
  const adjustedSeconds = paceSeconds * (factor / 100);
  
  // Convert back to MM:SS format
  return secondsToPace(adjustedSeconds);
}

/**
 * Convert time in HH:MM:SS format to seconds
 */
export function timeToSeconds(time: string): number {
  const parts = time.split(":").map(parseFloat);
  
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  
  return 0;
}

/**
 * Find the closest race parameter for a time and distance
 * This parameter is essentially Daniels' VDOT
 */
export function findClosestRaceParams(selectedTime: string, selectedDistance: string): number | null {
  if (!selectedTime || !selectedDistance) return null;

  const inputSeconds = timeToSeconds(selectedTime);
  
  try {
    const closestRace = races.reduce((closest, current) => {
      const distanceKey = selectedDistance as keyof typeof current;
      const currentValue = current[distanceKey];
      
      // Safety check
      if (typeof currentValue !== 'string') return closest;
      
      const currentSeconds = timeToSeconds(currentValue);
      const closestValue = closest[distanceKey];
      
      // Safety check
      if (typeof closestValue !== 'string') return current;
      
      return Math.abs(currentSeconds - inputSeconds) < 
        Math.abs(timeToSeconds(closestValue) - inputSeconds)
        ? current
        : closest;
    }, races[0]);
    
    return closestRace.Params;
  } catch (error) {
    console.error('Error finding closest race params:', error);
    return null;
  }
}

/**
 * Find pace values for a given parameter
 * Converts range paces to range format automatically
 */
export function findPaceValues(params: number | null): Record<string, string> | null {
  if (!params) return null;

  const foundPaces = paces.find((pace) => pace.Params === params);
  if (!foundPaces) return null;
  
  const { Params, ...pacesWithoutParams } = foundPaces;
  
  // Convert single values to record and apply range formatting to recovery and easy paces
  const result: Record<string, string> = {};
  
  Object.entries(pacesWithoutParams)
    .filter(([_, value]) => value !== undefined)
    .forEach(([key, value]) => {
      const stringValue = value as string;
      
      // Check if this pace should be a range
      if (rangePaces.includes(key)) {
        result[key] = createRangePace(stringValue);
      } else {
        result[key] = stringValue;
      }
    });
  
  return result;
}

/**
 * Calculate the appropriate pace for a specific activity
 * considering possible user customizations
 */
export function calculateActivityPace(
  activity: Activity, 
  customPaces: Record<string, string>, 
  getPredictedRaceTime?: (distance: number) => PredictedRaceTime | null
): string {
  // If it's an activity without distance or not in km units, return N/A
  if (!activity.distance || activity.units !== 'km') return "N/A";

  // Determine pace type based on activity type
  const paceType = activityTypeToPace[activity.type];
  if (!paceType) return "N/A";

  // Check if there's a custom pace for this type
  const customPaceKey = `custom_${paceType}`;
  if (customPaceKey in customPaces && isValidPace(customPaces[customPaceKey])) {
    // If it's a range pace type but not stored as a range, convert it
    if (rangePaces.includes(paceType) && !isRangePace(customPaces[customPaceKey])) {
      return createRangePace(normalizePace(customPaces[customPaceKey]));
    }
    
    // For range paces, ensure proper format
    if (rangePaces.includes(paceType) && isRangePace(customPaces[customPaceKey])) {
      return normalizeRangePace(customPaces[customPaceKey]);
    }
    
    // For regular paces
    return normalizePace(customPaces[customPaceKey]);
  }

  // For 'race', try to find pace for the specific distance
  if (activity.type === 'race' && typeof activity.distance === 'number' && getPredictedRaceTime) {
    const prediction = getPredictedRaceTime(activity.distance);
    if (prediction && prediction.pace) {
      return rangePaces.includes(paceType) 
        ? createRangePace(prediction.pace) 
        : prediction.pace;
    }
  }

  // If no custom pace found or not a 'race', return N/A
  return "N/A";
}

/**
 * Get a midpoint pace for display when using a range
 */
export function getMidpointPace(pace: string): string {
  if (!isRangePace(pace)) return pace;
  
  const [min, max] = pace.split('-').map(p => p.trim());
  const minSeconds = paceToSeconds(min);
  const maxSeconds = paceToSeconds(max);
  
  // Calculate average
  const avgSeconds = (minSeconds + maxSeconds) / 2;
  return secondsToPace(avgSeconds);
}

/**
 * Interface to represent a pace setting
 */
export interface PaceSetting {
  name: string;       // Pace name (e.g., "Easy Km")
  value: string;      // Current value (can be customized)
  default: string;    // Default calculated value
  isCustom: boolean;  // If it was customized by the user
  description?: string; // Optional description
}