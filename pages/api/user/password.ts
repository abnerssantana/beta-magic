// pages/api/user/password.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';
import { compare, hash } from 'bcrypt';

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

  // Extrair dados da requisição
  const { currentPassword, newPassword } = req.body;

  // Validações básicas
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Buscar usuário
    const user = await db.collection('users').findOne({ 
      email: session.user.email 
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isPasswordValid = await compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    // Gerar novo hash de senha
    const newPasswordHash = await hash(newPassword, 12);

    // Atualizar senha do usuário
    const result = await db.collection('users').updateOne(
      { email: session.user.email },
      { 
        $set: { 
          password: newPasswordHash,
          updatedAt: new Date() 
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: 'Falha ao atualizar senha' });
    }

    return res.status(200).json({ 
      message: 'Senha atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({ error: 'Erro interno ao alterar senha' });
  }
}