import { Activity, PredictedRaceTime } from '@/types';

/**
 * Calcula o ritmo para uma atividade específica com base nos ritmos personalizados
 * @param activity Atividade para calcular o ritmo
 * @param selectedPaces Ritmos personalizados selecionados pelo usuário
 * @param getPredictedRaceTime Função para obter o tempo de prova previsto
 * @returns Ritmo calculado no formato "MM:SS"
 */
export const calculateActivityPace = (
  activity: Activity,
  selectedPaces: Record<string, string> | null,
  getPredictedRaceTime: (distance: number) => PredictedRaceTime | null
): string => {
  // Se não temos paces selecionados, retorne N/A
  if (!selectedPaces) return "N/A";

  // Se a unidade não for km, retorne N/A (não calculamos ritmos para minutos)
  if (activity.units !== "km") return "N/A";

  // Para dias de descanso ou recuperação por tempo
  if (activity.type === "offday" || activity.type === "recovery" ) {
    return "N/A";
  }

  // Mapeamento de tipos de atividade para tipos de ritmos
  const paceMapping: { [key: string]: string } = {
    recovery: "Recovery Km",
    easy: "Easy Km",
    threshold: "T Km",
    interval: "I Km",
    repetition: "R 1000m",
    race: "", // Tratado separadamente
    marathon: "M Km",
    walk: "Recovery Km", // Usando recup como fallback para caminhada
    offday: "N/A", // Dias de descanso não têm pace
  };

  // Se é um tipo desconhecido, use easy como fallback
  const paceKey = paceMapping[activity.type] || "Easy Km";

  // Caso especial para treinos de corrida
  if (activity.type === "race" && typeof activity.distance === 'number') {
    // Para corridas, usamos o ritmo previsto para a distância específica
    const prediction = getPredictedRaceTime(activity.distance);
    if (prediction) {
      return prediction.pace;
    }
    
    // Fallback para Race Pace se disponível
    if (selectedPaces["Race Pace"]) {
      return selectedPaces["Race Pace"];
    }
    
    // Segundo fallback para T Km
    return selectedPaces["T Km"] || "N/A";
  }

  // Se o tipo está no mapeamento e encontramos esse pace, use-o
  if (paceKey !== "N/A" && selectedPaces[paceKey]) {
    return selectedPaces[paceKey];
  }

  // Caso especial para treinos com workout que têm seus próprios ritmos
  if (activity.workouts && activity.workouts.length > 0) {
    // Se há séries com distâncias específicas, deixe para exibir no componente de série
    const hasWorkoutWithSeries = activity.workouts.some(
      (w) => w.series && w.series.length > 0 && w.series.some((s) => s.distance)
    );
    
    if (hasWorkoutWithSeries) {
      return "Variado";
    }
  }

  // Fallback para easy
  return selectedPaces["Easy Km"] || "N/A";
};