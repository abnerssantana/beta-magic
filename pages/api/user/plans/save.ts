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
  const { planPath, save = true } = req.body;

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

    // Se não tiver perfil e estiver salvando, criar um novo
    if (!userProfile && save) {
      await db.collection('userProfiles').insertOne({
        userId: session.user.id,
        savedPlans: [planPath],
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        completedWorkouts: [],
        customPaces: {},
        totalDistance: 0,
        streakDays: 0
      });
      
      return res.status(200).json({ 
        success: true,
        message: 'Plano salvo com sucesso' 
      });
    } 
    
    // Se já tiver perfil
    if (userProfile) {
      const savedPlans = userProfile.savedPlans || [];
      
      if (save && !savedPlans.includes(planPath)) {
        // Adicionar aos planos salvos
        savedPlans.push(planPath);
      } else if (!save) {
        // Remover dos planos salvos
        const index = savedPlans.indexOf(planPath);
        if (index > -1) {
          savedPlans.splice(index, 1);
        }
      }

      await db.collection('userProfiles').updateOne(
        { userId: session.user.id },
        { 
          $set: { 
            savedPlans: savedPlans,
            updatedAt: new Date() 
          } 
        }
      );
      
      return res.status(200).json({ 
        success: true,
        message: save ? 'Plano salvo com sucesso' : 'Plano removido com sucesso'
      });
    }

    return res.status(404).json({ error: 'Perfil de usuário não encontrado' });

  } catch (error) {
    console.error('Erro ao salvar plano:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar plano' });
  }
}