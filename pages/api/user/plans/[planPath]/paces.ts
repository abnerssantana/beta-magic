import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';
import { getPlanByPath } from '@/lib/db-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Obter o path do plano da URL
  const { planPath } = req.query;

  if (!planPath || Array.isArray(planPath)) {
    return res.status(400).json({ error: 'Path inválido' });
  }

  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Processar a requisição de acordo com o método HTTP
  switch (req.method) {
    case 'GET':
      return getUserPaces(req, res, session.user.id, planPath);
    case 'POST':
      return updateUserPaces(req, res, session.user.id, planPath);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
}

async function getUserPaces(
  req: NextApiRequest, 
  res: NextApiResponse,
  userId: string,
  planPath: string
) {
  try {
    // Verificar se o plano existe
    const plan = await getPlanByPath(planPath);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Buscar perfil do usuário
    const userProfile = await db.collection('userProfiles').findOne({ 
      userId: userId 
    });

    if (!userProfile) {
      return res.status(200).json({}); // Nenhum ritmo personalizado ainda
    }

    // Obter ritmos personalizados para o plano específico
    const customPaces = userProfile.customPaces || {};
    const planCustomPaces = customPaces[planPath] || {};
    
    return res.status(200).json(planCustomPaces);
    
  } catch (error) {
    console.error(`Erro ao buscar ritmos personalizados para ${planPath}:`, error);
    return res.status(500).json({ error: 'Erro interno ao buscar ritmos personalizados' });
  }
}

async function updateUserPaces(
  req: NextApiRequest, 
  res: NextApiResponse,
  userId: string,
  planPath: string
) {
  try {
    // Verificar se o plano existe
    const plan = await getPlanByPath(planPath);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    // Obter dados do corpo da requisição
    const paceSettings = req.body;
    
    if (!paceSettings || typeof paceSettings !== 'object') {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Validar a data inicial, se fornecida
    if (paceSettings.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(paceSettings.startDate)) {
      return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD.' });
    }

    // Validar formato de tempo base
    if (paceSettings.baseTime && !/^\d{2}:\d{2}:\d{2}$/.test(paceSettings.baseTime)) {
      return res.status(400).json({ error: 'Formato de tempo inválido. Use HH:MM:SS.' });
    }

    // Validar formatos dos ritmos personalizados
    for (const [key, value] of Object.entries(paceSettings)) {
      if (key.startsWith('custom_') && typeof value === 'string' && !/^\d{1,2}:\d{2}$/.test(value)) {
        return res.status(400).json({ 
          error: `Formato de ritmo inválido para ${key.replace('custom_', '')}. Use MM:SS.` 
        });
      }
    }

    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Buscar perfil do usuário
    const userProfile = await db.collection('userProfiles').findOne({ 
      userId: userId 
    });

    if (!userProfile) {
      // Criar perfil se não existir
      await db.collection('userProfiles').insertOne({
        userId: userId,
        customPaces: { [planPath]: paceSettings },
        savedPlans: [planPath],
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        completedWorkouts: [],
        totalDistance: 0,
        streakDays: 0
      });
      
      return res.status(200).json({ 
        success: true,
        message: 'Ritmos personalizados salvos com sucesso' 
      });
    }
    
    // Atualizar ritmos personalizados
    const customPaces = userProfile.customPaces || {};
    customPaces[planPath] = paceSettings;
    
    await db.collection('userProfiles').updateOne(
      { userId: userId },
      { 
        $set: { 
          customPaces: customPaces,
          lastActive: new Date(),
          updatedAt: new Date() 
        } 
      }
    );
    
    return res.status(200).json({ 
      success: true,
      message: 'Ritmos personalizados atualizados com sucesso' 
    });
    
  } catch (error) {
    console.error(`Erro ao atualizar ritmos personalizados para ${planPath}:`, error);
    return res.status(500).json({ error: 'Erro interno ao atualizar ritmos personalizados' });
  }
}