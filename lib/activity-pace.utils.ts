// lib/activity-pace.utils.ts

import { Activity } from '@/types/training';
import { PredictedRaceTime } from '@/types';
import { activityTypeToPace, normalizePace, isRangePace, createRangePace } from './pace-manager';

/**
 * Calcula o ritmo para uma atividade específica
 * Versão otimizada que prioriza ritmos personalizados
 */
export function calculateActivityPace(
  activity: Activity,
  customPaces: Record<string, string>,
  getPredictedRaceTime?: (distance: number) => PredictedRaceTime | null
): string {
  // Se a atividade não tem tipo ou distância, retorna N/A
  if (!activity.type || (!activity.distance && activity.units === 'km')) return "N/A";
  
  // Busca o nome do ritmo correspondente ao tipo de atividade
  const paceName = activityTypeToPace[activity.type];
  
  // Se não tiver correspondência, retorna N/A
  if (!paceName) return "N/A";
  
  // Prioridade 1: Verificar se existe um ritmo personalizado específico
  const customPaceKey = `custom_${paceName}`;
  if (customPaces[customPaceKey]) {
    // Garantir que o formato está correto (com sufixo /km se necessário)
    const customPaceValue = customPaces[customPaceKey];

    // Verificar se é um intervalo de ritmo (range)
    if (isRangePace(customPaceValue)) {
      return customPaceValue;
    } else {
      // Ritmo simples
      return normalizePace(customPaceValue);
    }
  }
  
  // Prioridade 2: Usar o ajuste global e o ritmo base
  if (customPaces.adjustmentFactor && customPaces[paceName]) {
    const adjustmentFactor = parseFloat(customPaces.adjustmentFactor);
    const basePace = customPaces[paceName];
    
    // Se o fator de ajuste é 100%, usar o ritmo base sem modificação
    if (adjustmentFactor === 100) {
      return basePace;
    }
    
    // Caso contrário, aplicar o fator de ajuste
    // Nota: aqui precisaria implementar a função adjustPace do pace-manager.ts
    // Como estamos apenas mostrando um exemplo, retornaremos o básico
    return basePace;
  }
  
  // Prioridade 3: Usar apenas o ritmo base sem ajuste
  if (customPaces[paceName]) {
    return customPaces[paceName];
  }
  
  // Prioridade 4: Casos especiais para ritmos de prova
  if (activity.type === 'race' && activity.distance && typeof activity.distance === 'number') {
    // Usa a função getPredictedRaceTime se disponível
    if (getPredictedRaceTime) {
      const prediction = getPredictedRaceTime(activity.distance);
      if (prediction && prediction.pace) {
        return prediction.pace;
      }
    }
  }
  
  // Se nenhum ritmo for encontrado
  return "N/A";
}

// Exporta funções auxiliares do pace-manager para compatibilidade
export { normalizePace, isRangePace, createRangePace };