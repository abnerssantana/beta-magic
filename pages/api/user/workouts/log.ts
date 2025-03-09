import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';
import { validatePlanDayIndex } from '@/lib/activity-linking';

interface WorkoutLog {
  date: string;
  planPath?: string;
  planDayIndex?: number;
  title: string;
  distance: number;
  duration: number;  // em minutos
  pace?: string;
  notes?: string;
  activityType: string;
  source: 'manual' | 'strava' | 'garmin' | 'system';
}

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
  const workoutData = req.body as WorkoutLog;

  // Validações básicas
  if (!workoutData.date || !workoutData.title || !workoutData.distance || !workoutData.duration) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Validar planDayIndex
    const validatedPlanDayIndex = validatePlanDayIndex(workoutData.planDayIndex);
    
    // Preparar o objeto de treino com o índice validado
    const workout = {
      ...workoutData,
      planDayIndex: validatedPlanDayIndex, // Usar valor validado
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Inserir o treino
    const result = await db.collection('workouts').insertOne(workout);
    
    if (!result.acknowledged) {
      return res.status(500).json({ error: 'Falha ao registrar treino' });
    }
    
    // Atualizar estatísticas do usuário
    const userProfile = await db.collection('userProfiles').findOne({ userId: session.user.id });
    
    if (userProfile) {
      // Adicionar ao array de treinos concluídos
      const completedWorkouts = userProfile.completedWorkouts || [];
      completedWorkouts.push({
        date: workoutData.date,
        workoutId: result.insertedId,
        planPath: workoutData.planPath,
        planDayIndex: validatedPlanDayIndex, // Usar valor validado
        distance: workoutData.distance
      });
      
      // Atualizar distância total
      const totalDistance = (userProfile.totalDistance || 0) + workoutData.distance;
      
      // Verificar sequência de treinos
      // Implementação simplificada - em uma versão mais completa, verificaria datas consecutivas
      const streakDays = userProfile.streakDays || 0;
      
      await db.collection('userProfiles').updateOne(
        { userId: session.user.id },
        { 
          $set: { 
            completedWorkouts,
            totalDistance,
            streakDays: streakDays + 1,
            lastActive: new Date(),
            updatedAt: new Date() 
          } 
        }
      );
    } else {
      // Criar perfil se não existir
      await db.collection('userProfiles').insertOne({
        userId: session.user.id,
        completedWorkouts: [{
          date: workoutData.date,
          workoutId: result.insertedId,
          planPath: workoutData.planPath,
          planDayIndex: workoutData.planDayIndex,
          distance: workoutData.distance
        }],
        totalDistance: workoutData.distance,
        streakDays: 1,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return res.status(201).json({ 
      success: true,
      id: result.insertedId,
      message: 'Treino registrado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao registrar treino:', error);
    return res.status(500).json({ error: 'Erro interno ao registrar treino' });
  }
}