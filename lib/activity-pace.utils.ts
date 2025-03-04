import { Activity, PredictedRaceTime } from '@/types/training';

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

export const calculateActivityPace = (
  activity: Activity,
  selectedPaces: Record<string, string> | null,
  getPredictedRaceTime: (distance: number) => PredictedRaceTime | null
): string => {
  if (!activity) return "N/A";

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