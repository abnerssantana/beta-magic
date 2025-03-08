import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { hasStravaLinked, getValidStravaToken } from '@/lib/strava-utils';

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
    // Check if user has Strava linked
    const isLinked = await hasStravaLinked(session.user.id);
    
    if (!isLinked) {
      return res.status(200).json({ 
        connected: false,
        validToken: false,
        message: 'Strava account not connected'
      });
    }
    
    // Check if token is valid or can be refreshed
    const validToken = await getValidStravaToken(session);
    
    return res.status(200).json({
      connected: true,
      validToken: !!validToken,
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
