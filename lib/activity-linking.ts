// Arquivo: lib/activity-linking.ts

import { format, parseISO, isSameDay } from 'date-fns';
import { Activity } from '@/types/training';

/**
 * Utilitário para vincular atividades aos dias do plano de forma mais precisa
 */
export interface PlanDay {
  date: string;        // Data completa em formato ISO (YYYY-MM-DD)
  displayDate: string; // Data formatada para exibição (ex: "Segunda-feira, 10 de Junho")
  index: number;       // Índice do dia no plano
  activities: Activity[];
}

/**
 * Prepara a estrutura de dias de plano para vinculação com atividades
 * @param weeklyBlocks Blocos semanais do plano
 * @returns Array de dias com informações necessárias para vinculação
 */
export function preparePlanDaysForLinking(weeklyBlocks: any[]): PlanDay[] {
  const planDays: PlanDay[] = [];
  
  if (!weeklyBlocks || !Array.isArray(weeklyBlocks)) {
    console.warn('Nenhum bloco semanal válido fornecido');
    return planDays;
  }
  
  try {
    let globalIndex = 0;
    
    // Processar cada semana
    weeklyBlocks.forEach(week => {
      if (!week.days || !Array.isArray(week.days)) return;
      
      // Processar cada dia
      week.days.forEach((day: any) => {
        if (!day.date) return;
        
        try {
          // Extrair a data em formato manipulável
          // O formato original é: "Segunda-feira, 10 de Junho"
          const parts = day.date.split(',');
          if (parts.length < 2) return;
          
          const datePart = parts[1].trim();
          // Extrair dia, mês e ano
          const matches = datePart.match(/(\d+)\s+de\s+([^\s]+)(?:\s+de\s+(\d{4}))?/);
          
          if (!matches) return;
          
          const dayNum = parseInt(matches[1]);
          const monthName = matches[2];
          // Se o ano não estiver presente, usar o ano atual
          const year = matches[3] ? parseInt(matches[3]) : new Date().getFullYear();
          
          // Mapeamento de nomes de meses em português para números
          const monthMap: Record<string, number> = {
            'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
            'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
            'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
          };
          
          const monthNum = monthMap[monthName.toLowerCase()];
          
          if (monthNum === undefined || isNaN(dayNum) || isNaN(year)) return;
          
          // Criar data no formato ISO
          const date = new Date(year, monthNum, dayNum);
          const isoDate = format(date, 'yyyy-MM-dd');
          
          // Adicionar o dia ao array de dias do plano
          planDays.push({
            date: isoDate,
            displayDate: day.date,
            index: globalIndex,
            activities: day.activities || []
          });
          
          globalIndex++;
        } catch (dayError) {
          console.error('Erro ao processar dia:', dayError);
        }
      });
    });
    
    return planDays;
  } catch (error) {
    console.error('Erro ao preparar dias do plano:', error);
    return [];
  }
}

/**
 * Encontra correspondência entre atividade e dias do plano baseado em data e tipo
 * @param activityDate Data da atividade em formato ISO (YYYY-MM-DD)
 * @param activityType Tipo da atividade (ex: 'run', 'walk', etc)
 * @param planDays Array de dias do plano preparados
 * @param sourceType Tipo da fonte ('strava' ou 'manual')
 * @returns O índice do dia correspondente ou undefined se não encontrar
 */
export function findMatchingPlanDay(
  activityDate: string, 
  activityType: string,
  planDays: PlanDay[],
  sourceType: 'strava' | 'manual' = 'manual'
): number | undefined {
  if (!activityDate || !planDays?.length) return undefined;
  
  try {
    // Parse da data da atividade
    const activityDateObj = parseISO(activityDate);
    
    // Encontrar dia do plano com a mesma data
    const matchingDay = planDays.find(day => {
      try {
        const planDayObj = parseISO(day.date);
        return isSameDay(planDayObj, activityDateObj);
      } catch (e) {
        return false;
      }
    });
    
    if (!matchingDay) return undefined;
    
    // Verificar se existe uma atividade compatível no dia
    // Mapeamento de tipos de atividade do Strava para os tipos do plano
    const activityTypeMap: Record<string, string[]> = {
      // Para atividades do Strava
      'Run': ['easy', 'recovery', 'threshold', 'interval', 'repetition', 'long', 'marathon', 'race'],
      'Walk': ['walk'],
      'Workout': ['strength', 'força'],
      // Para atividades manuais - mapeamento direto (mesmo tipo)
      'easy': ['easy'],
      'recovery': ['recovery'],
      'threshold': ['threshold'],
      'interval': ['interval'],
      'repetition': ['repetition'],
      'long': ['long'],
      'marathon': ['marathon'],
      'race': ['race'],
      'walk': ['walk'],
      'strength': ['strength', 'força'],
      'other': ['easy', 'recovery'] // Fallback para tipos desconhecidos
    };
    
    // Obter lista de tipos compatíveis
    const compatibleTypes = activityTypeMap[activityType] || [];
    
    // Verificar se existe atividade compatível no dia correspondente
    const hasCompatibleActivity = matchingDay.activities.some(activity => 
      compatibleTypes.includes(activity.type)
    );
    
    // Só retornar o índice se encontrou um tipo de atividade compatível
    return hasCompatibleActivity ? matchingDay.index : undefined;
    
  } catch (error) {
    console.error('Erro ao encontrar correspondência:', error);
    return undefined;
  }
}

/**
 * Valida e formata o índice do dia do plano
 * @param planDayIndex Índice potencialmente inválido
 * @returns Número válido ou undefined
 */
export function validatePlanDayIndex(planDayIndex: any): number | undefined {
  // Se for undefined, null ou string vazia, retornar undefined
  if (planDayIndex === undefined || planDayIndex === null || planDayIndex === '') {
    return undefined;
  }
  
  // Tentar converter para número
  const index = Number(planDayIndex);
  
  // Verificar se é um número válido e não negativo
  if (isNaN(index) || index < 0) {
    return undefined;
  }
  
  return index;
}