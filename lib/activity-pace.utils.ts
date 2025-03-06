import { Activity } from '@/types';

/**
 * Calcula o ritmo para uma atividade específica baseado em:
 * 1. Ritmos personalizados do usuário
 * 2. Ritmos padrão calculados do plano
 * 3. Valor default baseado no tipo da atividade
 */
export function calculateActivityPace(
  activity: Activity,
  userPaces: Record<string, string>,
  getPredictedRaceTime: (distance: number) => any
): string {
  // Se não tem atividade ou ritmos, retorna N/A
  if (!activity || !activity.type) {
    return "N/A";
  }
  
  // Mapeamento de tipos de atividade para chaves de ritmo personalizado
  const customPaceKeyMap: Record<string, string> = {
    'easy': 'custom_Easy Km',
    'recovery': 'custom_Recovery Km',
    'threshold': 'custom_T Km',
    'interval': 'custom_I Km',
    'repetition': 'custom_R 1000m',
    'long': 'custom_M Km',
    'marathon': 'custom_M Km',
    'race': 'custom_Race Pace',
  };
  
  // Mapeamento de tipos de atividade para chaves de ritmo padrão
  const standardPaceKeyMap: Record<string, string> = {
    'easy': 'Easy Km',
    'recovery': 'Recovery Km',
    'threshold': 'T Km',
    'interval': 'I Km',
    'repetition': 'R 1000m',
    'long': 'M Km',
    'marathon': 'M Km',
    'race': 'Race Pace',
  };
  
  // Ritmos default por tipo de atividade (caso não tenha personalizado nem calculado)
  const defaultPaces: Record<string, string> = {
    'easy': '6:00',
    'recovery': '6:30',
    'threshold': '4:30',
    'interval': '4:00',
    'repetition': '3:45',
    'long': '5:30',
    'marathon': '5:00',
    'race': '4:30',
    'offday': 'N/A',
    'walk': '8:00'
  };
  
  const activityType = activity.type;
  
  // 1. Verifica se existe ritmo personalizado para esta atividade
  const customPaceKey = customPaceKeyMap[activityType];
  if (customPaceKey && userPaces[customPaceKey]) {
    // Limpa o sufixo "/km" se existir
    return userPaces[customPaceKey].replace('/km', '');
  }
  
  // 2. Para tipos especiais que dependem da distância (como corrida de prova)
  if (activityType === 'race' && typeof activity.distance === 'number') {
    const predictedTime = getPredictedRaceTime(activity.distance);
    if (predictedTime && predictedTime.pace) {
      return predictedTime.pace;
    }
  }
  
  // 3. Tenta obter o ritmo padrão calculado do plano
  const standardPaceKey = standardPaceKeyMap[activityType];
  if (standardPaceKey && userPaces[standardPaceKey]) {
    return userPaces[standardPaceKey].replace('/km', '');
  }
  
  // 4. Usa o ritmo default baseado no tipo de atividade
  if (activityType in defaultPaces) {
    return defaultPaces[activityType];
  }
  
  // 5. Caso não encontre nenhum ritmo aplicável
  return "N/A";
}