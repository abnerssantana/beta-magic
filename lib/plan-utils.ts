// lib/plan-utils.ts
import { format, parseISO, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { PredictedRaceTime } from '@/types';
import { races, paces } from "@/lib/PacesRaces";

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

/**
 * Convert time string to seconds
 */
export const timeToSeconds = (time: string): number => {
  const [h = 0, m = 0, s = 0] = time.split(":").map(parseFloat);
  return h * 3600 + m * 60 + s;
};

/**
 * Format minutes to a readable time string
 */
export const convertMinutesToHours = (minutes: number): string => {
  if (minutes <= 59) return `${Math.round(minutes)}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
};

/**
 * Limit description length with ellipsis
 */
export const limitDescription = (description: string, limit = 160): string => {
  if (!description || description.length <= limit) return description || '';
  return description.slice(0, limit).trim() + '...';
};

/**
 * Calculate predicted race time based on parameters
 */
export const getPredictedRaceTimeFactory = (params: number | null) => {
  return (distance: number): PredictedRaceTime | null => {
    if (!params) return null;

    const raceData = races.find(race => race.Params === params);
    const distanceKey = `${distance}km`;

    if (!raceData || !raceData[distanceKey as keyof typeof raceData]) return null;

    const timeString = raceData[distanceKey as keyof typeof raceData] as string;
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    const paceMinutes = totalMinutes / distance;
    const paceMinutesInt = Math.floor(paceMinutes);
    const paceSeconds = Math.round((paceMinutes - paceMinutesInt) * 60);
    const paceString = `${paceMinutesInt}:${paceSeconds.toString().padStart(2, '0')}`;

    return { time: timeString, pace: paceString };
  };
};

/**
 * Find closest race parameters for a given time and distance
 */
export const findClosestRaceParams = (selectedTime: string, selectedDistance: string): number | null => {
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
};

/**
 * Find pace values for a given parameter
 */
export const findPaceValues = (params: number | null): Record<string, string> | null => {
  if (!params) return null;
  
  const foundPaces = paces.find((pace) => pace.Params === params);
  if (!foundPaces) return null;
  
  const { Params, ...pacesWithoutParams } = foundPaces;
  return Object.fromEntries(
    Object.entries(pacesWithoutParams).filter(([_, value]) => value !== undefined)
  ) as Record<string, string>;
};

/**
 * Format time input to make sure it has the right format
 */
export const formatTimeInput = (input: string): string => {
  const inputTime = input.replace(/[^0-9]/g, "");
  let formattedTime = inputTime;

  if (inputTime.length > 2) {
    formattedTime = `${inputTime.slice(0, 2)}:${inputTime.slice(2)}`;
  }
  if (inputTime.length > 4) {
    formattedTime = `${inputTime.slice(0, 2)}:${inputTime.slice(2, 4)}:${inputTime.slice(4, 6)}`;
  }

  return formattedTime;
};

/**
 * Helper for local storage operations
 */
export const storageHelper = {
  getStartDate: (planPath: string): string => {
    if (typeof window === "undefined") return format(new Date(), "yyyy-MM-dd");
    return sessionStorage.getItem(`${planPath}_startDate`) || format(new Date(), "yyyy-MM-dd");
  },
  
  getEndDate: (planPath: string, daysCount: number): string => {
    if (typeof window === "undefined") return format(addDays(new Date(), daysCount), "yyyy-MM-dd");
    return sessionStorage.getItem(`${planPath}_endDate`) || format(addDays(new Date(), daysCount), "yyyy-MM-dd");
  },
  
  getSelectedTime: (planPath: string): string => {
    if (typeof window === "undefined") return "00:19:57";
    return sessionStorage.getItem(`${planPath}_selectedTime`) || "00:19:57";
  },
  
  getSelectedDistance: (planPath: string): string => {
    if (typeof window === "undefined") return "5km";
    return sessionStorage.getItem(`${planPath}_selectedDistance`) || "5km";
  },
  
  saveSettings: (planPath: string, values: { startDate?: string; endDate?: string; selectedTime?: string; selectedDistance?: string }): void => {
    if (typeof window === "undefined") return;
    
    if (values.startDate) {
      sessionStorage.setItem(`${planPath}_startDate`, values.startDate);
    }
    
    if (values.endDate) {
      sessionStorage.setItem(`${planPath}_endDate`, values.endDate);
    }
    
    if (values.selectedTime) {
      sessionStorage.setItem(`${planPath}_selectedTime`, values.selectedTime);
    }
    
    if (values.selectedDistance) {
      sessionStorage.setItem(`${planPath}_selectedDistance`, values.selectedDistance);
    }
  }
};

/**
 * Process plan data into weekly blocks
 */
interface Day {
  date: string;
  activities: any;
  note: any;
  isToday: boolean;
  isPast: boolean;
}

interface WeeklyBlock {
  weekStart: string;
  days: Day[];
}

export const organizePlanIntoWeeklyBlocks = (dailyWorkouts: any[], startDate: string): WeeklyBlock[] => {
  const blocks: WeeklyBlock[] = [];
  let currentWeek: WeeklyBlock = {
    weekStart: format(parseISO(startDate), "yyyy-MM-dd"),
    days: [],
  };

  dailyWorkouts.forEach((day, index) => {
    const date = addDays(parseISO(startDate), index);
    const formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });

    if (index !== 0 && index % 7 === 0) {
      blocks.push(currentWeek);
      currentWeek = {
        weekStart: format(date, "yyyy-MM-dd"),
        days: [],
      };
    }

    currentWeek.days.push({
      date: formattedDate,
      activities: day.activities,
      note: day.note,
      isToday: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
      isPast: date < new Date() && format(date, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd"),
    });
  });
  
  blocks.push(currentWeek);
  return blocks;
};