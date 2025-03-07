// lib/activity-pace.utils.ts

import { Activity } from '@/types/training';
import { PredictedRaceTime } from '@/types';
import { activityTypeToPace, normalizePace, isRangePace, createRangePace, normalizeRangePace } from './pace-manager';

/**
 * Verifica se um valor é uma string representando um tipo de ritmo
 * @param value Valor a ser verificado
 * @returns true se for uma string de tipo de ritmo, false caso contrário
 */
function isPaceTypeString(value: any): boolean {
  if (typeof value !== 'string') return false;
  
  // Lista de tipos de ritmo conhecidos em strings distance
  const paceTypeStrings = ['threshold', 'interval', 'repetition', 'easy', 'recovery', 'marathon', 'race'];
  return paceTypeStrings.includes(value.toLowerCase());
}

/**
 * Mapeia uma string de tipo de ritmo para o nome do ritmo correspondente
 * @param paceType String representando um tipo de ritmo
 * @returns Nome do ritmo ou undefined se não houver correspondência
 */
function mapPaceTypeStringToPaceName(paceType: string): string | undefined {
  // Mapeamento direto de strings distance para nomes de ritmo
  const paceTypeMapping: Record<string, string> = {
    'threshold': 'T Km',
    'interval': 'I Km',
    'repetition': 'R 1000m',
    'easy': 'Easy Km',
    'recovery': 'Recovery Km',
    'marathon': 'M Km',
    'race': 'Race Pace'
  };
  
  return paceTypeMapping[paceType.toLowerCase()];
}

/**
 * Calcula o ritmo para uma atividade específica
 * Versão otimizada que prioriza ritmos personalizados e trata strings distance corretamente
 */
export function calculateActivityPace(
  activity: Activity,
  customPaces: Record<string, string>,
  getPredictedRaceTime?: (distance: number) => PredictedRaceTime | null
): string {
  // Se a atividade não tem tipo, retorna N/A
  if (!activity || !activity.type) return "N/A";
  
  // Debug auxiliar durante o desenvolvimento (pode ser ativado para depuração)
  const debug = false;
  if (debug) {
    console.log('Activity:', activity.type, 'Distance:', activity.distance);
    console.log('CustomPaces:', customPaces);
  }
  
  // Determinar o nome do ritmo a ser usado
  let paceName: string | undefined;
  
  // MELHORIA: Verificar se distance é uma string representando um tipo de ritmo
  if (activity.distance && isPaceTypeString(activity.distance)) {
    // Se distance é uma string de tipo de ritmo, usar ela para determinar o ritmo
    paceName = mapPaceTypeStringToPaceName(activity.distance as string);
  }
  
  // Se não encontrou um ritmo baseado na string distance, usar o tipo da atividade
  if (!paceName) {
    paceName = activityTypeToPace[activity.type];
  }
  
  // Se não tiver correspondência depois de tentar ambos, retorna N/A
  if (!paceName) {
    if (debug) console.log('No paceName found for', activity.type);
    return "N/A";
  }
  
  if (debug) console.log('PaceName found:', paceName);
  
  // Prioridade 1: Verificar se existe um ritmo personalizado específico
  const customPaceKey = `custom_${paceName}`;
  
  if (customPaces[customPaceKey] && customPaces[customPaceKey].trim() !== '') {
    // Garantir que o formato está correto
    const customPaceValue = customPaces[customPaceKey];
    
    if (debug) console.log('Found custom pace:', customPaceKey, customPaceValue);
    
    // Verificar se é um intervalo de ritmo (range)
    if (isRangePace(customPaceValue)) {
      return normalizeRangePace(customPaceValue);
    } else {
      // Ritmo simples
      return normalizePace(customPaceValue);
    }
  }
  
  // Prioridade 2: Se há um ritmo base não personalizado no customPaces
  if (customPaces[paceName] && customPaces[paceName].trim() !== '') {
    const basePace = customPaces[paceName];
    
    if (debug) console.log('Found base pace:', paceName, basePace);
    
    // Verificar se é um intervalo de ritmo (range)
    if (isRangePace(basePace)) {
      return normalizeRangePace(basePace);
    }
    
    return normalizePace(basePace);
  }
  
  // Prioridade 3: Casos especiais para ritmos de prova
  if (activity.type === 'race' && typeof activity.distance === 'number') {
    // Usa a função getPredictedRaceTime se disponível
    if (getPredictedRaceTime) {
      const prediction = getPredictedRaceTime(activity.distance);
      if (prediction && prediction.pace) {
        if (debug) console.log('Found race prediction:', prediction.pace);
        return prediction.pace;
      }
    }
  }
  
  if (debug) console.log('No valid pace found for', activity.type);
  return "N/A";
}

// Exporta funções auxiliares do pace-manager para compatibilidade
export { normalizePace, isRangePace, createRangePace };