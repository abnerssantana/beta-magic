import clientPromise from './mongodb';
import { PlanSummary } from './field-projection';
import { getPlanByPath } from './db-utils';
import { WorkoutLog } from '@/models/userProfile';
import { getUserPlans, getRecommendedPlansFromQuestionnaire } from './user-plans-utils';

/**
 * Obtém o plano ativo do usuário
 * @param userId ID do usuário
 * @returns Plano ativo ou null se não houver
 */
export async function getUserActivePlan(userId: string): Promise<PlanSummary | null> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');

    // Buscar perfil do usuário
    const userProfile = await db.collection('userProfiles').findOne({ userId });

    const activePlanPath = userProfile?.activePlan;
    if (!activePlanPath) {
      return null;
    }

    // Buscar detalhes do plano ativo
    const activePlan = await getPlanByPath(activePlanPath, { fields: 'summary' });
    return activePlan as PlanSummary;

  } catch (error) {
    console.error('Erro ao buscar plano ativo do usuário:', error);
    return null;
  }
}


/**
 * Obtém os planos salvos do usuário
 * @param userId ID do usuário
 * @returns Array de planos salvos
 */
export async function getUserSavedPlans(userId: string): Promise<PlanSummary[]> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Buscar perfil do usuário
    const userProfile = await db.collection('userProfiles').findOne({ userId });
    
    if (!userProfile || !userProfile.savedPlans || userProfile.savedPlans.length === 0) {
      return [];
    }
    
    // Buscar detalhes dos planos salvos
    const savedPlans: PlanSummary[] = [];
    
    for (const planPath of userProfile.savedPlans) {
      const plan = await getPlanByPath(planPath, { fields: 'summary' });
      if (plan) {
        savedPlans.push(plan as PlanSummary);
      }
    }
    
    return savedPlans;
    
  } catch (error) {
    console.error('Erro ao buscar planos salvos do usuário:', error);
    return [];
  }
}

/**
 * Obtém configurações de ritmos personalizados para um plano específico
 * @param userId ID do usuário
 * @param planPath Path do plano
 * @returns Objeto com ritmos personalizados
 */
export async function getUserCustomPaces(userId: string, planPath: string): Promise<Record<string, string>> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Buscar perfil do usuário
    const userProfile = await db.collection('userProfiles').findOne({ userId });
    
    if (!userProfile || !userProfile.customPaces || !userProfile.customPaces[planPath]) {
      return {};
    }
    
    // Log para depuração (somente em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Ritmos personalizados encontrados para ${planPath}:`, userProfile.customPaces[planPath]);
    }
    
    // Normalizar todos os ritmos para garantir consistência
    const rawPaces = userProfile.customPaces[planPath];
    const normalizedPaces: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(rawPaces)) {
      if (typeof value === 'string') {
        // Para ritmos personalizados (que começam com 'custom_'), garantir formato MM:SS
        if (key.startsWith('custom_') && /^\d{1,2}:\d{2}$/.test(value.replace(/\/km$/, '').trim())) {
          normalizedPaces[key] = value.replace(/\/km$/, '').trim();
        } else {
          // Para outros valores como baseTime, startDate, etc.
          normalizedPaces[key] = value;
        }
      }
    }
    
    return normalizedPaces;
    
  } catch (error) {
    console.error(`Erro ao buscar ritmos personalizados para ${planPath}:`, error);
    return {};
  }
}

/**
 * Obtém o resumo do usuário com estatísticas
 * @param userId ID do usuário
 * @returns Objeto com resumo do usuário
 */
export async function getUserSummary(userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Buscar perfil do usuário
    const userProfile = await db.collection('userProfiles').findOne({ userId });
    
    if (!userProfile) {
      return {
        totalDistance: 0,
        completedWorkouts: 0,
        streakDays: 0,
        nextMilestone: "5K"
      };
    }
    
    // Calcular próximo objetivo baseado na distância total
    const totalDistance = userProfile.totalDistance || 0;
    let nextMilestone = "5K";
    
    if (totalDistance >= 500) {
      nextMilestone = "Ultra";
    } else if (totalDistance >= 200) {
      nextMilestone = "Maratona";
    } else if (totalDistance >= 100) {
      nextMilestone = "Meia Maratona";
    } else if (totalDistance >= 50) {
      nextMilestone = "10K";
    }
    
    return {
      totalDistance,
      completedWorkouts: userProfile.completedWorkouts?.length || 0,
      streakDays: userProfile.streakDays || 0,
      nextMilestone
    };
    
  } catch (error) {
    console.error('Erro ao buscar resumo do usuário:', error);
    return {
      totalDistance: 0,
      completedWorkouts: 0,
      streakDays: 0,
      nextMilestone: "5K"
    };
  }
}

/**
 * Obtém os treinos registrados do usuário
 * @param userId ID do usuário
 * @returns Array de treinos registrados
 */
export async function getUserWorkouts(userId: string): Promise<WorkoutLog[]> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Buscar todos os treinos do usuário, ordenados por data (mais recentes primeiro)
    const workouts = await db
      .collection<WorkoutLog>('workouts')
      .find({ userId })
      .sort({ date: -1 })
      .toArray();
    
    return workouts;
    
  } catch (error) {
    console.error('Erro ao buscar treinos do usuário:', error);
    return [];
  }
}

// Exportando as funções de gerenciamento de planos para manter compatibilidade
export { getUserPlans, getRecommendedPlansFromQuestionnaire };