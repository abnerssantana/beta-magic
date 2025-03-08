import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getValidStravaToken, fetchStravaActivities, stravaActivityToWorkout } from '@/lib/strava-utils';
import { getUserActivePlan } from '@/lib/user-utils';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

  try {
    // Get valid access token
    const accessToken = await getValidStravaToken(session);
    
    if (!accessToken) {
      // Verificar diretamente no banco de dados para ter certeza
      const client = await clientPromise;
      const db = client.db('magic-training');
      
      // Verificar se o usuário tem uma conta Strava vinculada
      const stravaAccount = await db.collection('accounts').findOne({
        userId: new ObjectId(session.user.id),
        provider: 'strava'
      });
      
      // Verificar na coleção de usuários também
      const user = await db.collection('users').findOne({
        _id: new ObjectId(session.user.id),
        stravaAccessToken: { $exists: true }
      });
      
      if (!stravaAccount && !user?.stravaAccessToken) {
        return res.status(401).json({ 
          error: 'Strava not connected', 
          code: 'STRAVA_NOT_CONNECTED',
          message: 'Você precisa conectar sua conta do Strava antes de importar atividades.'
        });
      } else {
        return res.status(401).json({ 
          error: 'Strava token expired', 
          code: 'STRAVA_TOKEN_EXPIRED',
          message: 'Seu token do Strava expirou. Por favor, reconecte sua conta do Strava.'
        });
      }
    }

    // Get current active plan
    const activePlan = await getUserActivePlan(session.user.id);
    const planPath = activePlan?.path;

    // Get parameters for fetching activities
    const { days = 30, page = 1, perPage = 30 } = req.body;
    
    // Calculate time range (default to last 30 days)
    const afterTimestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    // Fetch activities
    const activities = await fetchStravaActivities(
      accessToken,
      page,
      perPage,
      afterTimestamp
    );

    if (!activities || activities.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No activities found in the specified time range',
        imported: 0 
      });
    }

    // Get database connection
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Check for existing Strava activities to avoid duplicates
    const existingActivities = await db.collection('workouts').find({
      userId: session.user.id,
      stravaActivityId: { $in: activities.map(a => a.id.toString()) }
    }).toArray();
    
    const existingIds = new Set(existingActivities.map(a => a.stravaActivityId));
    
    // Filter out already imported activities
    const newActivities = activities.filter(a => !existingIds.has(a.id.toString()));
    
    if (!newActivities.length) {
      return res.status(200).json({ 
        success: true,
        message: 'All activities have already been imported',
        imported: 0 
      });
    }

    // Convert Strava activities to our workout format
    const workouts = newActivities.map(activity => 
      stravaActivityToWorkout(activity, session.user.id, planPath)
    );

    // Insert workouts into database
    const result = await db.collection('workouts').insertMany(workouts);
    
    if (!result.acknowledged || !result.insertedIds) {
      throw new Error('Failed to insert workouts into database');
    }
    
    // Update user profile statistics
    const totalDistance = workouts.reduce((sum, w) => sum + w.distance, 0);
    
    // Update profile stats (totalDistance, completedWorkouts)
    const userProfile = await db.collection('userProfiles').findOne({ userId: session.user.id });
    
    if (userProfile) {
      // Calculate new totals
      const newTotalDistance = (userProfile.totalDistance || 0) + totalDistance;
      
      // Create completedWorkouts array if needed
      const completedWorkouts = userProfile.completedWorkouts || [];
      
      // Add new workouts to completedWorkouts array
      const newCompletedWorkouts = [
        ...completedWorkouts,
        ...workouts.map((workout, index) => ({
          date: workout.date,
          workoutId: result.insertedIds[index],
          planPath: workout.planPath,
          distance: workout.distance
        }))
      ];
      
      // Update profile with new data and last sync time
      await db.collection('userProfiles').updateOne(
        { userId: session.user.id },
        {
          $set: {
            totalDistance: newTotalDistance,
            completedWorkouts: newCompletedWorkouts,
            lastActive: new Date(),
            lastStravaSync: new Date(),
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Create profile if it doesn't exist
      await db.collection('userProfiles').insertOne({
        userId: session.user.id,
        totalDistance: totalDistance,
        completedWorkouts: workouts.map((workout, index) => ({
          date: workout.date,
          workoutId: result.insertedIds[index],
          planPath: workout.planPath,
          distance: workout.distance
        })),
        lastActive: new Date(),
        lastStravaSync: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        savedPlans: planPath ? [planPath] : [],
        streakDays: 0
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${workouts.length} activities`,
      imported: workouts.length,
      totalDistance
    });
  } catch (error) {
    console.error('Error importing Strava activities:', error);
    
    // Mensagens de erro específicas para problemas comuns
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch activities')) {
        return res.status(503).json({ 
          error: 'Failed to fetch activities from Strava',
          code: 'STRAVA_API_ERROR',
          message: 'Não foi possível acessar a API do Strava. Tente novamente mais tarde.'
        });
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to import activities',
      code: 'IMPORT_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}