// lib/pace-manager.ts

import { PredictedRaceTime } from '@/types';
import { races, paces } from "@/lib/PacesRaces";
import { Activity } from '@/types/training';

// Tempos padrão para diferentes distâncias
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

// Mapeamento de tipos de atividade para tipos de ritmo
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

// Ritmos essenciais que devem ser salvos e disponibilizados
export const essentialPaces = [
  'Easy Km',
  'Recovery Km',
  'T Km',
  'I Km',
  'R 1000m',
  'M Km'
];

// Descrições dos ritmos para melhorar a compreensão
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

// Nomes formatados para exibição na interface
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

// Categorização de ritmos para diferentes tabs
export const runningPaceTypes = ["Recovery Km", "Easy Km", "M Km", "T Km", "Race Pace"];
export const intervalPaceTypes = ["I Km", "R 1000m", "I 800m", "R 400m"];

/**
 * Normaliza um valor de ritmo para o formato padrão MM:SS
 * Retorna string vazia para valores inválidos
 */
export function normalizePace(pace: string): string {
  if (!pace || pace === "0:00" || pace === "00:00") return "";

  // Remove qualquer sufixo ou texto adicional
  const cleanValue = pace.replace(/\/km$|\/mi$|min\/km$|min\/mi$/, '').trim();
  
  // Verifica formato MM:SS
  if (/^\d{1,2}:\d{2}$/.test(cleanValue)) {
    // Garantir que segundos estão com dois dígitos
    const [minutes, seconds] = cleanValue.split(':');
    return `${minutes}:${seconds.padStart(2, '0')}`;
  }
  
  // Tenta converter strings numéricas para minutos
  if (/^\d+(\.\d+)?$/.test(cleanValue)) {
    const numericValue = parseFloat(cleanValue);
    const minutes = Math.floor(numericValue);
    const seconds = Math.round((numericValue - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return ""; // Valor vazio para formatos inválidos
}

/**
 * Verifica se um valor de ritmo é válido
 */
export function isValidPace(pace: string): boolean {
  if (!pace || pace === "0:00" || pace === "00:00") return false;
  
  const normalized = normalizePace(pace);
  return normalized !== "" && normalized !== "0:00" && normalized !== "00:00";
}

/**
 * Converte um valor de ritmo para segundos
 */
export function paceToSeconds(pace: string): number {
  if (!isValidPace(pace)) return 0;
  
  const normalized = normalizePace(pace);
  const [minutes, seconds] = normalized.split(':').map(Number);
  return minutes * 60 + seconds;
}

/**
 * Converte segundos para o formato de ritmo MM:SS
 */
export function secondsToPace(seconds: number): string {
  if (seconds <= 0) return "";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Função para aplicar um fator de ajuste a um ritmo
 * Fator menor que 100 = ritmo mais rápido
 * Fator maior que 100 = ritmo mais lento
 */
export function adjustPace(pace: string, factor: number): string {
  if (!isValidPace(pace)) return "";
  
  // Converte o ritmo para segundos
  const paceSeconds = paceToSeconds(pace);
  if (paceSeconds <= 0) return "";
  
  // Aplica o fator de ajuste
  const adjustedSeconds = paceSeconds * (100 / factor);
  
  // Converte de volta para o formato mm:ss
  return secondsToPace(adjustedSeconds);
}

/**
 * Converter tempo no formato HH:MM:SS para segundos
 */
export function timeToSeconds(time: string): number {
  const [h = 0, m = 0, s = 0] = time.split(":").map(parseFloat);
  return h * 3600 + m * 60 + s;
}

/**
 * Encontra o parâmetro de corrida mais próximo para um tempo e distância
 * Este parâmetro é essencialmente o VDOT de Daniels
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
 * Encontra os valores de ritmo para um determinado parâmetro
 */
export function findPaceValues(params: number | null): Record<string, string> | null {
  if (!params) return null;

  const foundPaces = paces.find((pace) => pace.Params === params);
  if (!foundPaces) return null;
  
  const { Params, ...pacesWithoutParams } = foundPaces;
  return Object.fromEntries(
    Object.entries(pacesWithoutParams)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, value as string])
  );
}

/**
 * Calcula o ritmo apropriado para uma atividade específica
 * considerando possíveis personalizações do usuário
 */
export function calculateActivityPace(
  activity: Activity, 
  customPaces: Record<string, string>, 
  getPredictedRaceTime?: (distance: number) => PredictedRaceTime | null
): string {
  // Se é uma atividade sem distância ou não é do tipo km, retornar N/A
  if (!activity.distance || activity.units !== 'km') return "N/A";

  // Determinar o tipo de ritmo com base no tipo de atividade
  const paceType = activityTypeToPace[activity.type];
  if (!paceType) return "N/A";

  // Verificar se há um ritmo personalizado para este tipo
  const customPaceKey = `custom_${paceType}`;
  if (customPaceKey in customPaces && isValidPace(customPaces[customPaceKey])) {
    return normalizePace(customPaces[customPaceKey]);
  }

  // Para 'race', tentar encontrar o ritmo para a distância específica
  if (activity.type === 'race' && typeof activity.distance === 'number' && getPredictedRaceTime) {
    const prediction = getPredictedRaceTime(activity.distance);
    if (prediction && prediction.pace) {
      return prediction.pace;
    }
  }

  // Se não achou personalizado ou não é 'race', retornar N/A
  return "N/A";
}

/**
 * Interface para representar uma configuração de ritmo
 */
export interface PaceSetting {
  name: string;       // Nome do ritmo (ex: "Easy Km")
  value: string;      // Valor atual (pode ser personalizado)
  default: string;    // Valor padrão calculado
  isCustom: boolean;  // Se foi personalizado pelo usuário
  description?: string; // Descrição opcional
}