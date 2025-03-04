import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';
import { getPlanByPath } from '@/lib/db-utils';

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
  const { planPath } = req.body;

  // Validações básicas
  if (!planPath) {
    return res.status(400).json({ error: 'planPath é obrigatório' });
  }

  try {
    // Verificar se o plano existe
    const plan = await getPlanByPath(planPath);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Verificar se o usuário já tem um perfil
    const userProfile = await db.collection('userProfiles').findOne({ 
      userId: session.user.id 
    });

    // Se não tiver perfil, criar um novo
    if (!userProfile) {
      await db.collection('userProfiles').insertOne({
        userId: session.user.id,
        activePlan: planPath,
        savedPlans: [planPath],
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        completedWorkouts: [],
        customPaces: {},
        totalDistance: 0,
        streakDays: 0
      });
    } else {
      // Se já tiver perfil, atualizar plano ativo
      // E adicionar aos planos salvos se ainda não estiver
      const savedPlans = userProfile.savedPlans || [];
      if (!savedPlans.includes(planPath)) {
        savedPlans.push(planPath);
      }

      await db.collection('userProfiles').updateOne(
        { userId: session.user.id },
        { 
          $set: { 
            activePlan: planPath,
            savedPlans: savedPlans,
            lastActive: new Date(),
            updatedAt: new Date() 
          } 
        }
      );
    }

    return res.status(200).json({ 
      success: true,
      message: 'Plano ativado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao ativar plano:', error);
    return res.status(500).json({ error: 'Erro interno ao ativar plano' });
  }
}