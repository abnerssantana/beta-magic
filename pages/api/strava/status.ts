import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Conectar ao MongoDB diretamente para verificar o status do Strava
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Verificar na coleção de accounts
    const stravaAccount = await db.collection('accounts').findOne({
      userId: new ObjectId(session.user.id),
      provider: 'strava'
    });
    
    // Se não encontrar na coleção accounts, verificar na coleção de users
    if (!stravaAccount) {
      const user = await db.collection('users').findOne({
        _id: new ObjectId(session.user.id),
        stravaAccessToken: { $exists: true }
      });
      
      if (!user || !user.stravaAccessToken) {
        return res.status(200).json({ 
          connected: false,
          validToken: false,
          message: 'Strava account not connected'
        });
      }
      
      // Verificar se o token ainda é válido
      const now = Math.floor(Date.now() / 1000);
      const validToken = user.stravaTokenExpires && user.stravaTokenExpires > now;
      
      return res.status(200).json({
        connected: true,
        validToken: validToken,
        message: validToken 
          ? 'Strava account connected with valid token' 
          : 'Strava account connected but token needs refresh'
      });
    }
    
    // Verificar se o token ainda é válido
    const now = Math.floor(Date.now() / 1000);
    const validToken = stravaAccount.expires_at && stravaAccount.expires_at > now;
    
    return res.status(200).json({
      connected: true,
      validToken: validToken,
      message: validToken 
        ? 'Strava account connected with valid token' 
        : 'Strava account connected but token needs refresh'
    });
  } catch (error) {
    console.error('Error checking Strava connection status:', error);
    return res.status(500).json({ 
      error: 'Failed to check Strava connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}