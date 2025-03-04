// pages/api/user/profile.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar método da requisição
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Extrair dados para atualização
  const { name } = req.body;

  // Validações básicas
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Nome inválido' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Atualizar usuário na coleção users
    const result = await db.collection('users').updateOne(
      { email: session.user.email },
      { 
        $set: { 
          name: name.trim(),
          updatedAt: new Date() 
        } 
      }
    );

    // Também atualizar na coleção accounts se existir
    await db.collection('accounts').updateOne(
      { email: session.user.email },
      { 
        $set: { 
          name: name.trim(),
          updatedAt: new Date() 
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.status(200).json({ 
      message: 'Perfil atualizado com sucesso',
      name: name.trim() 
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar perfil' });
  }
}