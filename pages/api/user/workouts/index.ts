// pages/api/user/workouts.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify request method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  // Get user ID from request or session
  const userId = req.query.userId as string || session.user.id;

  // Admin check - only admins can view other users' workouts
  if (userId !== session.user.id) {
    const isAdmin = session.user.email?.endsWith('@magictraining.run') || 
                   session.user.email === 'admin@example.com';
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Get all workouts for the user
    const workouts = await db.collection('workouts')
      .find({ userId })
      .sort({ date: -1 }) // Sort by date descending (most recent first)
      .toArray();
    
    return res.status(200).json(workouts);
  } catch (error) {
    console.error('Error fetching user workouts:', error);
    return res.status(500).json({ error: 'Internal error fetching workouts' });
  }
}