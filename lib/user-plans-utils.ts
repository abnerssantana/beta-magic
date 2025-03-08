// lib/user-plans-utils.ts
import clientPromise from './mongodb';
import { PlanSummary } from './field-projection';
import { getPlanByPath, getPlanSummaries } from './db-utils';
import { getUserActivePlan, getUserSavedPlans } from './user-utils';

/**
 * Obtém recomendações de planos baseadas no questionário do usuário
 * @param userId ID do usuário
 * @returns Array de planos recomendados
 */
export async function getRecommendedPlansFromQuestionnaire(userId: string): Promise<PlanSummary[]> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Buscar perfil do usuário
    const userProfile = await db.collection('userProfiles').findOne({ userId });
    
    // Se não tem dados do questionário, retornar array vazio
    if (!userProfile || !userProfile.questionnaire) {
      return [];
    }
    
    const questionnaire = userProfile.questionnaire;
    
    // Se já tem recommendedPlans, buscar esses planos
    if (questionnaire.recommendedPlans && questionnaire.recommendedPlans.length > 0) {
      const recommendedPlans: PlanSummary[] = [];
      
      // Buscar cada plano pelo path
      for (const planPath of questionnaire.recommendedPlans) {
        const plan = await getPlanByPath(planPath, { fields: 'summary' });
        if (plan && isPlanSummary(plan)) {
          recommendedPlans.push(plan);
        }
      }
      
      return recommendedPlans;
    }
    
    // Se não tem recommendedPlans, mas tem calculatedLevel, fazer recomendação baseada no nível
    if (questionnaire.calculatedLevel) {
      const allPlans = await getPlanSummaries();
      
      // Filtrar planos pelo nível (e nível próximo)
      return allPlans.filter(plan => {
        const userLevel = questionnaire.calculatedLevel;
        
        // Match exato ou níveis próximos
        const levelMatch = 
          plan.nivel === userLevel ||
          (userLevel === 'iniciante' && plan.nivel === 'intermediário') ||
          (userLevel === 'intermediário' && plan.nivel === 'avançado') ||
          (userLevel === 'avançado' && plan.nivel === 'elite') ||
          (userLevel === 'elite' && ['elite', 'avançado'].includes(plan.nivel));
          
        // Match de distância se tiver
        const distanceMatch = 
          !questionnaire.targetDistance || 
          !plan.distances || 
          plan.distances.includes(questionnaire.targetDistance);
          
        return levelMatch && distanceMatch;
      });
    }
    
    // Se não tem nenhuma informação, retornar array vazio
    return [];
    
  } catch (error) {
    console.error('Erro ao buscar recomendações de planos:', error);
    return [];
  }
}

// Type guard para verificar se um objeto é PlanSummary
function isPlanSummary(plan: any): plan is PlanSummary {
  return plan && 
    typeof plan.path === 'string' && 
    typeof plan.name === 'string' && 
    typeof plan.nivel === 'string';
}

/**
 * Atualiza as recomendações de planos para um usuário
 * baseado em seus treinos e progresso
 * @param userId ID do usuário
 * @returns true se a atualização foi bem-sucedida
 */
export async function updateUserRecommendations(userId: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Buscar perfil do usuário
    const userProfile = await db.collection('userProfiles').findOne({ userId });
    
    if (!userProfile) {
      return false;
    }
    
    // Buscar treinos completados
    const workouts = await db
      .collection('workouts')
      .find({ userId })
      .sort({ date: -1 })
      .limit(20)
      .toArray();
    
    // Calcular métricas
    const totalDistance = workouts.reduce((sum, workout) => sum + workout.distance, 0);
    const avgDistance = workouts.length > 0 ? totalDistance / workouts.length : 0;
    const maxDistance = workouts.length > 0 
      ? Math.max(...workouts.map(w => w.distance))
      : 0;
    
    // Determinar nível baseado nos treinos recentes
    let calculatedLevel: 'iniciante' | 'intermediário' | 'avançado' | 'elite' = 'iniciante';
    if (maxDistance > 30) {
      calculatedLevel = 'avançado';
    } else if (maxDistance > 15) {
      calculatedLevel = 'intermediário';
    }
    
    // Determinar distância alvo
    let targetDistance: string = '5km';
    if (maxDistance > 30) {
      targetDistance = '42km';
    } else if (maxDistance > 15) {
      targetDistance = '21km';
    } else if (maxDistance > 8) {
      targetDistance = '10km';
    }
    
    // Buscar todos os planos para filtrar
    const allPlans = await getPlanSummaries();
    
    // Filtrar planos pelo nível e distância
    const recommendedPlans = allPlans
      .filter(plan => {
        // Level match
        const levelMatch = 
          plan.nivel === calculatedLevel ||
          (calculatedLevel === 'iniciante' && plan.nivel === 'intermediário') ||
          (calculatedLevel === 'intermediário' && plan.nivel === 'avançado');
        
        // Distance match
        const distanceMatch = 
          !plan.distances || 
          plan.distances.includes(targetDistance);
          
        return levelMatch && distanceMatch;
      })
      .slice(0, 5) // Limitar a 5 recomendações
      .map(plan => plan.path);
    
    // Atualizar perfil do usuário
    if (userProfile.questionnaire) {
      // Se já tem dados do questionário, apenas atualizar as recomendações
      await db.collection('userProfiles').updateOne(
        { userId },
        {
          $set: {
            'questionnaire.recommendedPlans': recommendedPlans,
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Se não tem dados do questionário, criar um objeto básico
      await db.collection('userProfiles').updateOne(
        { userId },
        {
          $set: {
            questionnaire: {
              calculatedLevel,
              targetDistance,
              weeklyVolume: Math.round(avgDistance * 3).toString(), // Estimativa
              recommendedPlans,
              completedAt: new Date()
            },
            updatedAt: new Date()
          }
        }
      );
    }
    
    return true;
    
  } catch (error) {
    console.error('Erro ao atualizar recomendações:', error);
    return false;
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

    // Buscar recomendações baseadas no questionário
    let recommendedPlans = await getRecommendedPlansFromQuestionnaire(userId);

    // Se não houver recomendações do questionário, buscar todos os planos para recomendar
    if (recommendedPlans.length === 0) {
      const allPlans = await getPlanSummaries();

      // Filtrar os planos já salvos
      const savedPlanPaths = savedPlans
        .map(plan => plan.path)
        .filter((path): path is string => typeof path === 'string');

      recommendedPlans = allPlans.filter(plan => 
        plan.path && !savedPlanPaths.includes(plan.path)
      ).slice(0, 6);
    }

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