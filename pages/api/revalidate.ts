// pages/api/revalidate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

// Esta API permite invalidar o cache de páginas específicas
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
  
  // Verificar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Obter path da requisição
  const { path } = req.body;

  if (!path) {
    return res.status(400).json({ error: 'Path não fornecido' });
  }

  try {
    // Revalidar a página individual
    await res.revalidate(`/plano/${path}`);
    
    // Revalidar a página principal
    await res.revalidate(`/`);
    
    // Também revalidar páginas de distâncias se necessário
    // Você pode expandir isso para outras páginas que mostram planos
    
    return res.status(200).json({ 
      success: true,
      message: `Páginas com plano ${path} revalidadas com sucesso` 
    });
  } catch (error) {
    console.error(`Erro ao revalidar páginas para plano ${path}:`, error);
    return res.status(500).json({ 
      error: 'Falha ao revalidar páginas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}