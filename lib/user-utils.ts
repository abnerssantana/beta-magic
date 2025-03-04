import clientPromise from './mongodb';
import { PlanSummary } from './field-projection';
import { getPlanByPath, getPlanSummaries } from './db-utils';

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
    
    if (!userProfile || !userProfile.activePlan) {
      return null;
    }
    
    // Buscar detalhes do plano ativo
    const activePlan = await getPlanByPath(userProfile.activePlan, { fields: 'summary' });
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
    
    return userProfile.customPaces[planPath];
    
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
 * Obtém os planos do usuário (ativo, salvos e recomendados)
 * @param userId ID do usuário
 * @returns Objeto com planos do usuário
 */
export async function getUserPlans(userId: string) {
  try {
    // Buscar perfil do usuário, plano ativo e planos salvos
    const activePlan = await getUserActivePlan(userId);
    const savedPlans = await getUserSavedPlans(userId);
    
    // Buscar todos os planos para recomendar
    const allPlans = await getPlanSummaries();
    
    // Filtrar os planos já salvos
    const savedPlanPaths = savedPlans.map(plan => plan.path);
    let recommendedPlans = allPlans.filter(plan => 
      !savedPlanPaths.includes(plan.path)
    );
    
    // Limitar a 6 recomendações
    recommendedPlans = recommendedPlans.slice(0, 6);
    
    return {
      activePlan,
      savedPlans,
      recommendedPlans
    };
    
  } catch (error) {
    console.error('Erro ao buscar planos do usuário:', error);
    return {
      activePlan: null,
      savedPlans: [],
      recommendedPlans: []
    };
  }
}