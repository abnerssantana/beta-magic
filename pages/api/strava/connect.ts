import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { linkStravaAccount } from '@/lib/strava-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange code: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Link Strava account to user
    const success = await linkStravaAccount(session.user.id, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
      athleteId: tokenData.athlete.id,
      scope: tokenData.scope
    });

    if (!success) {
      throw new Error('Failed to link Strava account');
    }

    return res.status(200).json({ 
      success: true,
      message: 'Strava account linked successfully'
    });
  } catch (error) {
    console.error('Error connecting Strava account:', error);
    return res.status(500).json({ 
      error: 'Failed to connect Strava account',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
