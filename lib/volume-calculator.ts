// Funções utilitárias otimizadas para cálculo de volume semanal
import { Activity, ActivityType } from '@/types/training';

interface WorkResult {
  km: number;
  minutes: number;
}

/**
 * Analisa strings de ritmo (pace) com formato melhorado
 * Suporta formatos como "4:30", "4:30-5:00", etc.
 */
const parsePace = (pace: string): number => {
  if (!pace || pace === 'N/A') return 0;
  
  // Tratamento para intervalos de ritmo (ex: "4:30-5:00")
  if (pace.includes('-')) {
    try {
      const [min, max] = pace.split('-').map(p => {
        const [minutes, seconds] = p.trim().split(':').map(Number);
        if (isNaN(minutes) || isNaN(seconds)) return 0;
        return minutes + seconds / 60;
      });
      // Retorna a média do intervalo
      return (min + max) / 2;
    } catch {
      // Ignora erros e retorna 0
      return 0;
    }
  }
  
  // Formato simples "MM:SS"
  try {
    const [minutes, seconds] = pace.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds)) return 0;
    return minutes + seconds / 60;
  } catch {
    // Ignora erros e retorna 0
    return 0;
  }
};

/**
 * Analisa strings de trabalho/esforço com melhor suporte para diferentes formatos
 * Ex: "400 m", "20 min", "5 km"
 */
const parseWork = (work?: string): WorkResult => {
  if (!work || typeof work !== 'string') return { km: 0, minutes: 0 };
  
  const workLower = work.toLowerCase().trim();
  
  // Tenta extrair valor numérico e unidade
  const match = workLower.match(/^([\d.]+)\s*([a-z]+)$/);
  if (!match) return { km: 0, minutes: 0 };
  
  const [, valueStr, unit] = match;
  const value = parseFloat(valueStr);
  
  if (isNaN(value)) return { km: 0, minutes: 0 };
  
  // Mapeia as unidades para os resultados corretos
  if (unit === 'km' || unit === 'kms') {
    return { km: value, minutes: 0 };
  } else if (unit === 'm' || unit === 'metros') {
    return { km: value / 1000, minutes: 0 };
  } else if (unit === 'min' || unit === 'mins' || unit === 'minutos') {
    return { km: 0, minutes: value };
  } else if (unit === 's' || unit === 'seg' || unit === 'segundos') {
    return { km: 0, minutes: value / 60 };
  }
  
  return { km: 0, minutes: 0 };
};

/**
 * Extrai o número de repetições de uma string de série
 * Suporta formatos como "5x", "2x", etc.
 */
const extractRepetitions = (sets?: string): number => {
  if (!sets) return 1;
  
  const match = sets.match(/^(\d+)x/);
  return match ? parseInt(match[1], 10) : 1;
};

/**
 * Calcula o volume total de um dia de treino
 * Versão otimizada que lida melhor com séries complexas
 */
const calculateDayVolume = (activities: Activity[], getActivityPace: (activity: Activity) => string): WorkResult => {
  return activities.reduce((acc, activity) => {
    // Atividades com séries (intervalos, repetições, etc.)
    if (activity.workouts?.some(w => w.series && w.series.length > 0)) {
      // Processa cada workout e suas séries
      const workoutVolumes = activity.workouts
        .filter(workout => workout.series && workout.series.length > 0)
        .reduce((workoutAcc, workout) => {
          // Calcula o volume de cada série no workout
          const seriesVolume = (workout.series || []).reduce((seriesAcc, serie) => {
            // Extrai informações da série
            const { km: serieKm, minutes: serieMinutes } = parseWork(serie.work);
            const repetitions = extractRepetitions(serie.sets);
            
            // Determina o ritmo apropriado baseado no tipo da atividade
            const paceType = serie.distance 
              ? activity.type 
              : serie.work.includes('aquecimento') || serie.work.includes('desaquecimento') 
                ? 'easy' as ActivityType 
                : activity.type;
            
            const paceString = activity.type === 'race'
              ? getActivityPace({ ...activity, type: 'threshold' as ActivityType })
              : getActivityPace({ 
                  ...activity, 
                  type: paceType, 
                  distance: serie.distance || activity.distance
                });
            
            const paceInMinPerKm = parsePace(paceString);
            
            // Calcula km e minutos com base nos dados disponíveis
            let kmFromWork = serieKm;
            let minutesFromWork = serieMinutes;
            
            if (kmFromWork > 0 && paceInMinPerKm > 0 && minutesFromWork === 0) {
              minutesFromWork = kmFromWork * paceInMinPerKm;
            } else if (minutesFromWork > 0 && paceInMinPerKm > 0 && kmFromWork === 0) {
              kmFromWork = minutesFromWork / paceInMinPerKm;
            }
            
            // Ajusta para o número de repetições
            const totalKm = kmFromWork * repetitions;
            const totalMinutes = minutesFromWork * repetitions;
            
            // Adiciona tempo/distância de recuperação se houver
            let restKm = 0;
            let restMinutes = 0;
            
            if (serie.rest && !serie.rest.includes('descanso') && !serie.rest.includes('entre')) {
              const { km: recoveryKm, minutes: recoveryMinutes } = parseWork(serie.rest);
              
              if (recoveryKm > 0) {
                restKm = recoveryKm;
                if (restMinutes === 0 && paceInMinPerKm > 0) {
                  restMinutes = recoveryKm * paceInMinPerKm;
                }
              } else if (recoveryMinutes > 0) {
                restMinutes = recoveryMinutes;
                // Se tivermos apenas o tempo de recuperação, calculamos a distância
                // usando o ritmo de recuperação
                const recoveryPace = parsePace(getActivityPace({ 
                  ...activity, 
                  type: 'recovery' as ActivityType 
                }));
                
                if (recoveryPace > 0) {
                  restKm = recoveryMinutes / recoveryPace;
                }
              }
              
              // A recuperação é aplicada (repetições - 1) vezes
              const restRepetitions = Math.max(0, repetitions - 1);
              restKm *= restRepetitions;
              restMinutes *= restRepetitions;
            }
            
            return {
              km: seriesAcc.km + totalKm + restKm,
              minutes: seriesAcc.minutes + totalMinutes + restMinutes
            };
          }, { km: 0, minutes: 0 });
          
          return {
            km: workoutAcc.km + seriesVolume.km,
            minutes: workoutAcc.minutes + seriesVolume.minutes
          };
        }, { km: 0, minutes: 0 });
      
      return {
        km: acc.km + workoutVolumes.km,
        minutes: acc.minutes + workoutVolumes.minutes
      };
    } 
    // Atividades simples em km
    else if (activity.units === 'km') {
      const distance = typeof activity.distance === 'string' 
        ? parseFloat(activity.distance) 
        : (activity.distance || 0);
      
      if (distance === 0) return acc;
      
      const paceString = activity.type === 'race'
        ? getActivityPace({ ...activity, type: 'threshold' as ActivityType })
        : getActivityPace(activity);
      
      // Se não há ritmo válido, só adicionamos a distância
      if (paceString === 'N/A') {
        return { km: acc.km + distance, minutes: acc.minutes };
      }
      
      const paceInMinPerKm = parsePace(paceString);
      
      return {
        km: acc.km + distance,
        minutes: acc.minutes + (distance * paceInMinPerKm)
      };
    } 
    // Atividades simples em minutos
    else if (activity.units === 'min') {
      const duration = typeof activity.distance === 'string' 
        ? parseFloat(activity.distance) 
        : (activity.distance || 0);
      
      if (duration === 0) return acc;
      
      const paceString = activity.type === 'race'
        ? getActivityPace({ ...activity, type: 'threshold' as ActivityType })
        : getActivityPace(activity);
      
      // Se não há ritmo válido, só adicionamos o tempo
      if (paceString === 'N/A') {
        return { km: acc.km, minutes: acc.minutes + duration };
      }
      
      const paceInMinPerKm = parsePace(paceString);
      
      // Para tempo, calculamos a distância aproximada
      return {
        km: acc.km + (paceInMinPerKm > 0 ? duration / paceInMinPerKm : 0),
        minutes: acc.minutes + duration
      };
    }
    
    return acc;
  }, { km: 0, minutes: 0 });
};

// Definição do tipo para um dia de treino
interface TrainingDay {
  activities: Activity[];
  // outras propriedades opcionais que podem existir
  date?: string;
  note?: string;
  isToday?: boolean;
  isPast?: boolean;
}

// Função otimizada para usar no componente WeeklyView
export const calculateWeeklyStats = (
  days: TrainingDay[], 
  getActivityPace: (activity: Activity) => string
) => {
  return days.reduce((acc, day) => {
    // Calcula volume do dia com nossa função otimizada
    const dayVolume = calculateDayVolume(day.activities, getActivityPace);
    
    // Conta os treinos que não são dias de descanso
    const dayWorkouts = day.activities.filter(
      (activity: Activity) => !['off', 'offday'].includes(activity.type)
    ).length;
    
    return {
      weeklyVolume: {
        km: acc.weeklyVolume.km + dayVolume.km,
        minutes: acc.weeklyVolume.minutes + dayVolume.minutes
      },
      totalWorkouts: acc.totalWorkouts + dayWorkouts
    };
  }, { 
    weeklyVolume: { km: 0, minutes: 0 }, 
    totalWorkouts: 0 
  });
};