// pages/api/plans/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAllPlans, addPlan } from '@/lib/db-utils';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Define interface to match the expected options in getAllPlans
interface PlanQueryOptions {
  nivel?: string;
  coach?: string;
  distance?: string;
  search?: string;
  limit?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  // Verificar se o usuário é administrador (ajuste conforme sua lógica de autorização)
  const isAdmin = session.user.email.endsWith('@magictraining.run') || 
                 session.user.email === 'admin@example.com';
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // Processar a requisição de acordo com o método HTTP
  switch (req.method) {
    case 'GET':
      try {
        // Obter parâmetros de filtro da query string, se houver
        const { nivel, coach, distance, search, limit } = req.query;
        
        // Criar objeto de opções para passar ao getAllPlans
        const options: PlanQueryOptions = {};
        
        if (nivel && typeof nivel === 'string') options.nivel = nivel;
        if (coach && typeof coach === 'string') options.coach = coach;
        if (distance && typeof distance === 'string') options.distance = distance;
        if (search && typeof search === 'string') options.search = search;
        if (limit && typeof limit === 'string') options.limit = parseInt(limit, 10);
        
        const plans = await getAllPlans(options);
        return res.status(200).json(plans);
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
        return res.status(500).json({ error: 'Erro ao buscar planos' });
      }
      
    case 'POST':
      try {
        if (!req.body) {
          return res.status(400).json({ error: 'Dados do plano não fornecidos' });
        }
        
        const planData = req.body;
        
        // Validar dados mínimos
        if (!planData.name || !planData.nivel || !planData.coach || !planData.path) {
          return res.status(400).json({ 
            error: 'Dados incompletos. Nome, nível, treinador e path são obrigatórios' 
          });
        }
        
        // Verificar se já existe um plano com o mesmo path
        // Usamos uma busca direta pelo plano específico
        const existingPlan = await getAllPlans();
        const pathExists = existingPlan.some(plan => plan.path === planData.path);
        
        if (pathExists) {
          return res.status(409).json({
            error: 'Já existe um plano com este path. Escolha outro path único.'
          });
        }
        
        // Adicionar timestamps
        planData.createdAt = new Date();
        planData.updatedAt = new Date();
        
        // Criar o plano
        const insertedId = await addPlan(planData);
        return res.status(201).json({ 
          success: true,
          message: 'Plano criado com sucesso',
          id: insertedId
        });
      } catch (error) {
        console.error('Erro ao criar plano:', error);
        return res.status(500).json({ error: 'Erro ao criar plano' });
      }
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
}