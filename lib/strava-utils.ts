import clientPromise from './mongodb';
import { Session } from 'next-auth';
import { ObjectId } from 'mongodb';

interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  start_latlng?: number[];
  end_latlng?: number[];
  map?: {
    id: string;
    summary_polyline: string;
  };
}

/**
 * Refresh Strava access token if expired
 */
export async function refreshStravaToken(userId: string, refreshToken: string): Promise<StravaTokens | null> {
  if (!refreshToken) {
    console.error('Refresh token is required');
    return null;
  }

  try {
    // Verificar se temos as credenciais do Strava
    if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
      console.error('Strava client credentials are not configured');
      return null;
    }
    
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to refresh token: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json();
    
    // Validar os dados retornados
    if (!data.access_token || !data.refresh_token || !data.expires_at) {
      console.error('Invalid response from Strava token refresh:', data);
      return null;
    }
    
    // Atualizar tokens no banco de dados
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    try {
      // Atualizar na coleção de users
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            stravaAccessToken: data.access_token,
            stravaRefreshToken: data.refresh_token,
            stravaTokenExpires: data.expires_at,
            updatedAt: new Date()
          } 
        }
      );
      
      // Atualizar na coleção de accounts
      await db.collection('accounts').updateOne(
        { userId: new ObjectId(userId), provider: 'strava' },
        { 
          $set: { 
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
            updated_at: new Date()
          } 
        }
      );
      
      // Atualizar na coleção de userProfiles
      await db.collection('userProfiles').updateOne(
        { userId: userId },
        { 
          $set: { 
            stravaAccessToken: data.access_token,
            stravaRefreshToken: data.refresh_token,
            stravaTokenExpires: data.expires_at,
            lastStravaSync: new Date(),
            updatedAt: new Date()
          } 
        }
      );
    } catch (dbError) {
      console.error('Error updating Strava tokens in database:', dbError);
      // Continuar mesmo com erro no banco de dados, 
      // pois ainda precisamos retornar o token para uso imediato
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at
    };
  } catch (error) {
    console.error('Error refreshing Strava token:', error);
    return null;
  }
}

/**
 * Get a valid Strava access token
 */
export async function getValidStravaToken(session: Session | null): Promise<string | null> {
  if (!session?.user) return null;
  
  // Verificar se temos tokens no session
  if (session.user.stravaAccessToken && session.user.stravaRefreshToken) {
    // Se o token ainda é válido (buffer de 60 segundos)
    const now = Math.floor(Date.now() / 1000);
    if (session.user.stravaTokenExpires && session.user.stravaTokenExpires > (now + 60)) {
      return session.user.stravaAccessToken;
    }
    
    // Token expirado, precisa atualizar
    const refreshedTokens = await refreshStravaToken(session.user.id, session.user.stravaRefreshToken);
    if (refreshedTokens?.accessToken) {
      return refreshedTokens.accessToken;
    }
  }
  
  // Se não temos tokens na sessão, verificar no banco de dados
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Verificar na coleção de accounts
    const stravaAccount = await db.collection('accounts').findOne({
      userId: new ObjectId(session.user.id),
      provider: 'strava'
    });
    
    if (stravaAccount?.access_token && stravaAccount?.refresh_token) {
      const now = Math.floor(Date.now() / 1000);
      
      // Se o token ainda é válido
      if (stravaAccount.expires_at && stravaAccount.expires_at > (now + 60)) {
        return stravaAccount.access_token;
      }
      
      // Token expirado, precisa atualizar
      const refreshedTokens = await refreshStravaToken(session.user.id, stravaAccount.refresh_token);
      if (refreshedTokens?.accessToken) {
        return refreshedTokens.accessToken;
      }
    }
    
    // Tentar verificar na coleção de usuários
    const user = await db.collection('users').findOne({
      _id: new ObjectId(session.user.id),
      stravaAccessToken: { $exists: true }
    });
    
    if (user?.stravaAccessToken && user?.stravaRefreshToken) {
      const now = Math.floor(Date.now() / 1000);
      
      // Se o token ainda é válido
      if (user.stravaTokenExpires && user.stravaTokenExpires > (now + 60)) {
        return user.stravaAccessToken;
      }
      
      // Token expirado, precisa atualizar
      const refreshedTokens = await refreshStravaToken(session.user.id, user.stravaRefreshToken);
      if (refreshedTokens?.accessToken) {
        return refreshedTokens.accessToken;
      }
    }
    
    // Nenhum token válido encontrado
    return null;
  } catch (error) {
    console.error('Erro ao buscar token do Strava:', error);
    return null;
  }
}

/**
 * Fetch athlete's activities from Strava
 */
export async function fetchStravaActivities(
  accessToken: string, 
  page: number = 1, 
  perPage: number = 30,
  after?: number,
  before?: number
): Promise<StravaActivity[]> {
  try {
    let url = `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`;
    
    if (after) url += `&after=${after}`;
    if (before) url += `&before=${before}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to fetch activities: ${response.status}`, errorData);
      throw new Error(`Failed to fetch activities: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Strava activities:', error);
    return [];
  }
}

/**
 * Fetch a single activity details from Strava
 */
export async function fetchStravaActivityDetails(accessToken: string, activityId: number): Promise<StravaActivity | null> {
  try {
    const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=true`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to fetch activity details: ${response.status}`, errorData);
      throw new Error(`Failed to fetch activity details: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching Strava activity ${activityId}:`, error);
    return null;
  }
}

/**
 * Convert Strava activity to our workout format
 */
export function stravaActivityToWorkout(activity: StravaActivity, userId: string, planPath?: string, planDayIndex?: number): any {
  // Converter metros para km
  const distanceInKm = activity.distance / 1000;
  
  // Converter segundos para minutos
  const durationInMinutes = activity.moving_time / 60;
  
  // Calcular ritmo em min/km
  const paceInMinPerKm = durationInMinutes / distanceInKm;
  const paceMinutesInt = Math.floor(paceInMinPerKm);
  const paceSeconds = Math.round((paceInMinPerKm - paceMinutesInt) * 60);
  const paceFormatted = `${paceMinutesInt}:${paceSeconds.toString().padStart(2, '0')}/km`;
  
  // Mapear tipo de atividade do Strava para nosso formato
  let activityType = 'easy';
  if (activity.sport_type === 'Run') {
    // Tentar determinar o tipo de corrida baseado no nome ou cadência
    const nameLower = activity.name.toLowerCase();
    if (nameLower.includes('interval') || nameLower.includes('intervalo')) {
      activityType = 'interval';
    } else if (nameLower.includes('tempo') || nameLower.includes('limiar') || nameLower.includes('threshold')) {
      activityType = 'threshold';
    } else if (nameLower.includes('long') || nameLower.includes('longo')) {
      activityType = 'long';
    } else if (nameLower.includes('recup') || nameLower.includes('recovery')) {
      activityType = 'recovery';
    } else if (nameLower.includes('race') || nameLower.includes('compet') || nameLower.includes('prova')) {
      activityType = 'race';
    }
  } else if (activity.sport_type === 'Walk') {
    activityType = 'walk';
  } else if (activity.sport_type === 'Workout' || activity.sport_type === 'WeightTraining') {
    activityType = 'strength';
  }

  return {
    userId,
    stravaActivityId: activity.id.toString(),
    date: activity.start_date.split('T')[0], // formato YYYY-MM-DD
    title: activity.name,
    activityType,
    distance: parseFloat(distanceInKm.toFixed(2)),
    duration: parseFloat(durationInMinutes.toFixed(2)),
    pace: paceFormatted,
    elevationGain: activity.total_elevation_gain,
    averageHeartrate: activity.average_heartrate,
    maxHeartrate: activity.max_heartrate,
    averageCadence: activity.average_cadence,
    planPath,
    planDayIndex, // Novo campo para vincular ao dia do plano
    source: 'strava',
    notes: `Importado do Strava (ID: ${activity.id})`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Link a user's account with Strava
*/
export async function linkStravaAccount(userId: string, stravaData: any): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Validar os dados necessários
    if (!stravaData.accessToken || !stravaData.refreshToken || !stravaData.athleteId) {
      console.error('Invalid Strava data for linking:', stravaData);
      return false;
    }
    
    // Verificar se já existe uma conexão na coleção accounts
    const existingAccount = await db.collection('accounts').findOne({
      userId: new ObjectId(userId),
      provider: 'strava'
    });
    
    if (existingAccount) {
      // Atualizar conta existente
      await db.collection('accounts').updateOne(
        { _id: existingAccount._id },
        {
          $set: {
            access_token: stravaData.accessToken,
            refresh_token: stravaData.refreshToken,
            expires_at: stravaData.expiresAt,
            updated_at: new Date()
          }
        }
      );
    } else {
      // Criar nova conta
      await db.collection('accounts').insertOne({
        userId: new ObjectId(userId),
        provider: 'strava',
        providerAccountId: stravaData.athleteId.toString(),
        access_token: stravaData.accessToken,
        refresh_token: stravaData.refreshToken,
        expires_at: stravaData.expiresAt,
        token_type: 'bearer',
        scope: stravaData.scope,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Verificar também se existe em userProfiles e atualizar lá se necessário
    const existingProfile = await db.collection('userProfiles').findOne({
      userId: userId
    });

    if (existingProfile) {
      await db.collection('userProfiles').updateOne(
        { userId: userId },
        {
          $set: {
            stravaAccountId: stravaData.athleteId.toString(),
            stravaAccessToken: stravaData.accessToken,
            stravaRefreshToken: stravaData.refreshToken,
            stravaTokenExpires: stravaData.expiresAt,
            lastStravaSync: new Date(),
            updatedAt: new Date()
          }
        }
      );
    }
    
    // Atualizar informações no usuário também
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          stravaAccountId: stravaData.athleteId.toString(),
          stravaAccessToken: stravaData.accessToken,
          stravaRefreshToken: stravaData.refreshToken,
          stravaTokenExpires: stravaData.expiresAt,
          updatedAt: new Date()
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error linking Strava account:', error);
    return false;
  }
}

/**
 * Check if user has a linked Strava account
 */
export async function hasStravaLinked(userId: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    const account = await db.collection('accounts').findOne({
      userId: userId,
      provider: 'strava'
    });
    
    return !!account;
  } catch (error) {
    console.error('Error checking Strava link:', error);
    return false;
  }
}