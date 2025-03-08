import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar método da requisição
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Extrair dados da requisição
  const { 
    trainingTime, 
    weeklyVolume, 
    longestRace, 
    targetDistance, 
    usedPlan, 
    planDuration,
    calculatedLevel,
    recommendedPlans
  } = req.body;

  // Validações básicas
  if (!trainingTime || !weeklyVolume || !longestRace || !targetDistance || 
      !usedPlan || !planDuration || !calculatedLevel) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Verificar se o usuário já tem um perfil
    const userProfile = await db.collection('userProfiles').findOne({ 
      userId: session.user.id 
    });

    // Preparar os dados do questionário
    const questionnaireData = {
      trainingTime,
      weeklyVolume,
      longestRace,
      targetDistance,
      usedPlan,
      planDuration,
      calculatedLevel,
      recommendedPlans: recommendedPlans || [],
      completedAt: new Date()
    };

    // Se não tiver perfil, criar um novo
    if (!userProfile) {
      await db.collection('userProfiles').insertOne({
        userId: session.user.id,
        questionnaire: questionnaireData,
        savedPlans: [],
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        completedWorkouts: [],
        customPaces: {},
        totalDistance: 0,
        streakDays: 0
      });
    } else {
      // Se já tiver perfil, atualizar os dados do questionário
      await db.collection('userProfiles').updateOne(
        { userId: session.user.id },
        { 
          $set: { 
            questionnaire: questionnaireData,
            lastActive: new Date(),
            updatedAt: new Date() 
          } 
        }
      );
    }

    return res.status(200).json({ 
      success: true,
      message: 'Dados do questionário salvos com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao salvar dados do questionário:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar dados do questionário' });
  }
}