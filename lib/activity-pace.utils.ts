// lib/activity-pace.utils.ts

import { Activity } from '@/types/training';
import { PredictedRaceTime } from '@/types';
import { activityTypeToPace, normalizePace, isRangePace, createRangePace } from './pace-manager';

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
  if (!activity.type) return "N/A";
  
  // MELHORIA: Verificar se distance é uma string representando um tipo de ritmo
  let paceName: string | undefined;
  
  if (activity.distance && isPaceTypeString(activity.distance)) {
    // Se distance é uma string de tipo de ritmo, usar ela para determinar o ritmo
    paceName = mapPaceTypeStringToPaceName(activity.distance as string);
  }
  
  // Se não encontrou um ritmo baseado na string distance, usar o tipo da atividade
  if (!paceName) {
    paceName = activityTypeToPace[activity.type];
  }
  
  // Se não tiver correspondência depois de tentar ambos, retorna N/A
  if (!paceName) return "N/A";
  
  // Prioridade 1: Verificar se existe um ritmo personalizado específico
  const customPaceKey = `custom_${paceName}`;
  if (customPaces[customPaceKey] && customPaces[customPaceKey].trim() !== '') {
    // Garantir que o formato está correto
    const customPaceValue = customPaces[customPaceKey];

    // Verificar se é um intervalo de ritmo (range)
    if (isRangePace(customPaceValue)) {
      return customPaceValue;
    } else {
      // Ritmo simples
      return normalizePace(customPaceValue);
    }
  }
  
  // Prioridade 2: Se há um ritmo base não personalizado no customPaces
  if (customPaces[paceName] && customPaces[paceName].trim() !== '') {
    const basePace = customPaces[paceName];
    
    // Verificar se há fator de ajuste
    if (customPaces.adjustmentFactor) {
      const adjustmentFactor = parseFloat(customPaces.adjustmentFactor);
      
      // Se o fator de ajuste é 100%, usar o ritmo base sem modificação
      if (adjustmentFactor === 100) {
        return basePace;
      }
      
      // Se houver uma função de ajuste, aplicá-la (não implementado aqui)
      // Retorna o ritmo base se não houver implementação de ajuste
      return basePace;
    }
    
    // Se não houver fator de ajuste, usar o ritmo base diretamente
    return basePace;
  }
  
  // Prioridade 3: Casos especiais para ritmos de prova
  if (activity.type === 'race' && typeof activity.distance === 'number') {
    // Usa a função getPredictedRaceTime se disponível
    if (getPredictedRaceTime) {
      const prediction = getPredictedRaceTime(activity.distance);
      if (prediction && prediction.pace) {
        return prediction.pace;
      }
    }
  }
  
  // Debug para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] Ritmo não encontrado para: tipo=${activity.type}, distance=${activity.distance}, paceName=${paceName}`);
  }
  
  // Se nenhum ritmo for encontrado
  return "N/A";
}

// Exporta funções auxiliares do pace-manager para compatibilidade
export { normalizePace, isRangePace, createRangePace };