import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Obter o ID do treino da URL
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Tentar converter o ID para ObjectId
  let objectId: ObjectId;
  
  try {
    objectId = new ObjectId(id);
  } catch (error) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // GET - Recuperar treino
  if (req.method === 'GET') {
    try {
      const client = await clientPromise;
      const db = client.db('magic-training');
      
      // Buscar o treino específico
      const workout = await db.collection('workouts').findOne({ _id: objectId });
      
      if (!workout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }
      
      // Verificar se o treino pertence ao usuário atual ou se é admin
      const isAdmin = session.user.email?.endsWith('@magictraining.run') || 
                     session.user.email === 'admin@example.com';
      
      if (workout.userId !== session.user.id && !isAdmin) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      
      return res.status(200).json(workout);
    } catch (error) {
      console.error('Erro ao buscar treino:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar treino' });
    }
  } 
  // PUT - Atualizar treino
  else if (req.method === 'PUT') {
    try {
      const client = await clientPromise;
      const db = client.db('magic-training');
      
      // Primeiro, buscar o treino para verificar permissões e obter dados anteriores
      const existingWorkout = await db.collection('workouts').findOne({ _id: objectId });
      
      if (!existingWorkout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }
      
      // Verificar se o treino pertence ao usuário atual ou se é admin
      const isAdmin = session.user.email?.endsWith('@magictraining.run') || 
                     session.user.email === 'admin@example.com';
      
      if (existingWorkout.userId !== session.user.id && !isAdmin) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      
      // Extrair dados da requisição
      const { date, title, activityType, distance, duration, pace, notes } = req.body;
      
      // Validações básicas
      if (!date || !title || !distance || !duration) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }
      
      // Calcular diferença na distância para atualizar o total do usuário
      const distanceDiff = distance - existingWorkout.distance;
      
      // Preparar objeto de atualização, mantendo campos que não devem ser modificados
      const updatedWorkout = {
        date,
        title,
        activityType,
        distance,
        duration,
        pace,
        notes,
        // Manter esses campos do treino original
        userId: existingWorkout.userId,
        planPath: existingWorkout.planPath,
        planDayIndex: existingWorkout.planDayIndex,
        source: existingWorkout.source,
        createdAt: existingWorkout.createdAt,
        updatedAt: new Date()
      };
      
      // Atualizar o treino
      const result = await db.collection('workouts').updateOne(
        { _id: objectId },
        { $set: updatedWorkout }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }
      
      // Atualizar estatísticas do usuário se a distância mudou
      if (distanceDiff !== 0) {
        const userProfile = await db.collection('userProfiles').findOne({ userId: existingWorkout.userId });
        
        if (userProfile) {
          // Atualizar distância total
          const updatedTotalDistance = Math.max(0, (userProfile.totalDistance || 0) + distanceDiff);
          
          // Atualizar o perfil do usuário
          await db.collection('userProfiles').updateOne(
            { userId: existingWorkout.userId },
            { 
              $set: { 
                totalDistance: updatedTotalDistance,
                updatedAt: new Date() 
              } 
            }
          );
          
          // Também atualizar a distância no array completedWorkouts
          await db.collection('userProfiles').updateOne(
            { 
              userId: existingWorkout.userId,
              "completedWorkouts.workoutId": objectId 
            },
            { 
              $set: { 
                "completedWorkouts.$.distance": distance,
                "completedWorkouts.$.date": date,
              } 
            }
          );
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Treino atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      return res.status(500).json({ error: 'Erro interno ao atualizar treino' });
    }
  } 
  // DELETE - Excluir treino
  else if (req.method === 'DELETE') {
    try {
      const client = await clientPromise;
      const db = client.db('magic-training');
      
      // Primeiro, buscar o treino para verificar permissões e obter dados
      const workout = await db.collection('workouts').findOne({ _id: objectId });
      
      if (!workout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }
      
      // Verificar se o treino pertence ao usuário atual ou se é admin
      const isAdmin = session.user.email?.endsWith('@magictraining.run') || 
                     session.user.email === 'admin@example.com';
      
      if (workout.userId !== session.user.id && !isAdmin) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      
      // Excluir o treino
      const result = await db.collection('workouts').deleteOne({ _id: objectId });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }
      
      // Atualizar estatísticas do usuário
      const userProfile = await db.collection('userProfiles').findOne({ userId: workout.userId });
      
      if (userProfile) {
        // Remover do array de treinos concluídos
        const updatedCompletedWorkouts = userProfile.completedWorkouts.filter(
          (completedWorkout: any) => !completedWorkout.workoutId.equals(objectId)
        );
        
        // Atualizar distância total
        const distanceToRemove = workout.distance || 0;
        const updatedTotalDistance = Math.max(0, (userProfile.totalDistance || 0) - distanceToRemove);
        
        // Atualizar o perfil do usuário
        await db.collection('userProfiles').updateOne(
          { userId: workout.userId },
          { 
            $set: { 
              completedWorkouts: updatedCompletedWorkouts,
              totalDistance: updatedTotalDistance,
              updatedAt: new Date() 
            } 
          }
        );
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Treino excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      return res.status(500).json({ error: 'Erro interno ao excluir treino' });
    }
  } else {
    return res.status(405).json({ error: 'Método não permitido' });
  }
}