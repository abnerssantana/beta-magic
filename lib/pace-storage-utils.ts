/**
 * Utilitário para gerenciar o armazenamento de configurações de ritmo
 * tanto para usuários autenticados quanto para visitantes não logados
 */

// Prefixo para as chaves de armazenamento
const STORAGE_PREFIX = 'magic_training_';

/**
 * Obter configurações de ritmo salvas localmente para um plano específico
 * @param planPath Caminho/identificador do plano
 * @returns Objeto com as configurações de ritmo ou objeto vazio
 */
export function getLocalPaceSettings(planPath: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  try {
    // Primeiro, tentar obter a versão completa das configurações
    const fullSettings = localStorage.getItem(`${STORAGE_PREFIX}pace_settings_${planPath}`);
    
    if (fullSettings) {
      return JSON.parse(fullSettings);
    }
    
    // Se não encontrar, construir a partir de configurações individuais
    const baseSettings: Record<string, string> = {};
    
    // Tentar buscar configurações individuais para compatibilidade com versões antigas
    const startDate = sessionStorage.getItem(`${planPath}_startDate`);
    const selectedTime = sessionStorage.getItem(`${planPath}_selectedTime`);
    const selectedDistance = sessionStorage.getItem(`${planPath}_selectedDistance`);
    
    if (startDate) baseSettings.startDate = startDate;
    if (selectedTime) baseSettings.baseTime = selectedTime;
    if (selectedDistance) baseSettings.baseDistance = selectedDistance;
    
    return baseSettings;
  } catch (error) {
    console.error('Erro ao obter configurações de ritmo locais:', error);
    return {};
  }
}

/**
 * Salvar configurações de ritmo localmente para um plano específico
 * @param planPath Caminho/identificador do plano
 * @param settings Configurações a serem salvas
 */
export function saveLocalPaceSettings(planPath: string, settings: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Salvar configurações completas
    localStorage.setItem(`${STORAGE_PREFIX}pace_settings_${planPath}`, JSON.stringify(settings));
    
    // Também salvar configurações individuais para compatibilidade
    if (settings.startDate) {
      sessionStorage.setItem(`${planPath}_startDate`, settings.startDate);
    }
    
    if (settings.baseTime) {
      sessionStorage.setItem(`${planPath}_selectedTime`, settings.baseTime);
    }
    
    if (settings.baseDistance) {
      sessionStorage.setItem(`${planPath}_selectedDistance`, settings.baseDistance);
    }
  } catch (error) {
    console.error('Erro ao salvar configurações de ritmo locais:', error);
  }
}

/**
 * Obter ritmos personalizados, combinando dados do servidor e locais
 * @param serverPaces Ritmos do servidor (se autenticado)
 * @param planPath Caminho do plano
 * @returns Objeto combinado com ritmos personalizados
 */
export function getCombinedPaceSettings(
  serverPaces: Record<string, string> = {}, 
  planPath: string
): Record<string, string> {
  // Se estamos no servidor, retornar apenas os dados do servidor
  if (typeof window === 'undefined') return serverPaces;
  
  // Para clientes, combinar dados
  const localPaces = getLocalPaceSettings(planPath);
  
  // Preferir dados do servidor se disponíveis
  return { ...localPaces, ...serverPaces };
}

/**
 * Obter uma configuração específica de ritmo, verificando múltiplas fontes
 * @param planPath Caminho do plano
 * @param key Nome da configuração
 * @param defaultValue Valor padrão se não encontrado
 * @returns Valor da configuração ou o valor padrão
 */
export function getPaceSetting(
  planPath: string, 
  key: string, 
  defaultValue: string = ''
): string {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    // Verificar primeiro no localStorage completo
    const fullSettings = localStorage.getItem(`${STORAGE_PREFIX}pace_settings_${planPath}`);
    
    if (fullSettings) {
      const parsedSettings = JSON.parse(fullSettings);
      if (parsedSettings[key]) return parsedSettings[key];
    }
    
    // Verificar chaves individuais de compatibilidade
    let storageKey = '';
    if (key === 'baseTime') storageKey = `${planPath}_selectedTime`;
    else if (key === 'baseDistance') storageKey = `${planPath}_selectedDistance`;
    else if (key === 'startDate') storageKey = `${planPath}_startDate`;
    
    if (storageKey) {
      const value = sessionStorage.getItem(storageKey);
      if (value) return value;
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Erro ao obter configuração de ritmo '${key}':`, error);
    return defaultValue;
  }
}