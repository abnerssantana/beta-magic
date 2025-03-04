// pages/api/plans/[path].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getPlanByPath, updatePlan, deletePlan } from '@/lib/db-utils';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  // Verificar se o usuário é administrador
  const isAdmin = session.user.email.endsWith('@magictraining.run') || 
                 session.user.email === 'admin@example.com';
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // Obter o path da URL
  const { path } = req.query;
  
  if (!path || Array.isArray(path)) {
    return res.status(400).json({ error: 'Path inválido' });
  }

  // Verificar se o plano existe (exceto para POST)
  const existingPlan = await getPlanByPath(path);
  if (!existingPlan && req.method !== 'POST') {
    return res.status(404).json({ error: 'Plano não encontrado' });
  }

  // Processar a requisição de acordo com o método HTTP
  switch (req.method) {
    case 'GET':
      return res.status(200).json(existingPlan);
      
    case 'PUT':
      try {
        if (!req.body) {
          return res.status(400).json({ error: 'Dados do plano não fornecidos' });
        }
        
        const planData = req.body;
        
        // Adicionar timestamp de atualização
        planData.updatedAt = new Date();
        
        const success = await updatePlan(path, planData);
        
        if (success) {
          return res.status(200).json({ 
            success: true,
            message: 'Plano atualizado com sucesso'
          });
        } else {
          return res.status(404).json({ error: 'Plano não encontrado ou não foi modificado' });
        }
      } catch (error) {
        console.error('Erro ao atualizar plano:', error);
        return res.status(500).json({ error: 'Erro ao atualizar plano' });
      }
      
    case 'DELETE':
      try {
        const success = await deletePlan(path);
        
        if (success) {
          return res.status(200).json({ 
            success: true,
            message: 'Plano excluído com sucesso'
          });
        } else {
          return res.status(404).json({ error: 'Plano não encontrado ou não foi excluído' });
        }
      } catch (error) {
        console.error('Erro ao excluir plano:', error);
        return res.status(500).json({ error: 'Erro ao excluir plano' });
      }
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
}