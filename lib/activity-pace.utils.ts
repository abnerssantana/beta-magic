import { Activity } from '@/types';

/**
 * Normaliza um ritmo para o formato MM:SS (remove o sufixo '/km' se existir)
 */
export function normalizePace(pace: string): string {
  // Remover o sufixo '/km' se existir
  const cleanPace = pace.replace(/\/km$/, '').trim();
  
  // Verificar se está no formato MM:SS
  if (/^\d{1,2}:\d{2}$/.test(cleanPace)) {
    return cleanPace;
  }
  
  // Se não está em um formato reconhecível, retornar um valor padrão
  return "N/A";
}

/**
 * Registra um log detalhado sobre o ritmo calculado (somente em desenvolvimento)
 */
function logPaceCalculation(
  activityType: string, 
  userPace: string | undefined, 
  standardPace: string | undefined, 
  defaultPace: string | undefined,
  finalPace: string
) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`Ritmo calculado para atividade: ${activityType}`);
    console.log(`Ritmo personalizado: ${userPace || 'Não disponível'}`);
    console.log(`Ritmo padrão calculado: ${standardPace || 'Não disponível'}`);
    console.log(`Ritmo default: ${defaultPace || 'Não disponível'}`);
    console.log(`Ritmo final utilizado: ${finalPace}`);
    console.groupEnd();
  }
}

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
  
  // Definir valores iniciais
  let customPace: string | undefined;
  let standardPace: string | undefined;
  let defaultPace: string | undefined = defaultPaces[activityType];
  let finalPace: string = "N/A";
  
  // 1. Verifica se existe ritmo personalizado para esta atividade
  const customPaceKey = customPaceKeyMap[activityType];
  if (customPaceKey && userPaces[customPaceKey]) {
    customPace = normalizePace(userPaces[customPaceKey]);
    finalPace = customPace;
  }
  
  // 2. Para tipos especiais que dependem da distância (como corrida de prova)
  if (!finalPace || finalPace === "N/A") {
    if (activityType === 'race' && typeof activity.distance === 'number') {
      const predictedTime = getPredictedRaceTime(activity.distance);
      if (predictedTime && predictedTime.pace) {
        finalPace = predictedTime.pace;
      }
    }
  }
  
  // 3. Tenta obter o ritmo padrão calculado do plano
  if ((!finalPace || finalPace === "N/A") && activityType in standardPaceKeyMap) {
    const standardPaceKey = standardPaceKeyMap[activityType];
    if (standardPaceKey && userPaces[standardPaceKey]) {
      standardPace = normalizePace(userPaces[standardPaceKey]);
      finalPace = standardPace;
    }
  }
  
  // 4. Usa o ritmo default baseado no tipo de atividade
  if ((!finalPace || finalPace === "N/A") && activityType in defaultPaces) {
    finalPace = defaultPace || "N/A";
  }
  
  // Registra o log sobre as escolhas de ritmo (em desenvolvimento)
  logPaceCalculation(activityType, customPace, standardPace, defaultPace, finalPace);
  
  return finalPace;
}