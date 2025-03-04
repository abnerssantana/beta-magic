// types/calculator.ts

// Race related types
export interface RaceData {
  Params: number;
  "1500m": string;
  "1600m": string;
  "3km": string;
  "3200m": string;
  "5km": string;
  "10km": string;
  "15km": string;
  "21km": string;
  "42km": string;
}

export type RaceDistance = keyof Omit<RaceData, 'Params'>;

// Rhythm and heart rate related types
export interface RhythmZone {
  min: number;
  max: number;
  bpmMin: string | number;
  bpmMax: string | number;
}

export interface RhythmZones {
  [key: string]: RhythmZone;
}

// Pace related types
export interface PaceData {
  Params: number;
  "Recovery Km": string;
  "Easy Km": string;
  "M Km": string;
  "T Km": string;
  "I Km": string;
  "R 1000m": string;
  "I 1200m"?: string;
  "I 800m"?: string;
  "I 400m"?: string;
  "I 200m"?: string;
  "R 800m"?: string;
  "R 600m"?: string;
  "R 400m"?: string;
  "R 200m"?: string;
  "T 400m"?: string;
  "I Mile"?: string;
  [key: string]: string | number | undefined;
}

export interface DefaultTimes {
  [key: string]: string;
}

// Props types for components
export interface PaceCalculatorProps {
  selectedTime: string;
  selectedDistance: RaceDistance;
  handleTimeChange: (time: string) => void;
  handleDistanceChange: (distance: RaceDistance) => void;
  params: number | null;
  selectedPaces: PaceData | null;
  percentage: number;
}

export interface HeartRateZonesProps {
  fcMaxima: string;
  handleHRInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rhythmZones: RhythmZones;
}

// Type guard
export function isValidDistance(distance: string): distance is RaceDistance {
  return [
    "1500m",
    "1600m",
    "3km",
    "3200m",
    "5km",
    "10km",
    "15km",
    "21km",
    "42km"
  ].includes(distance);
}