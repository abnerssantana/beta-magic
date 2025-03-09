import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { format, parseISO, addDays, subDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { GetServerSideProps } from 'next';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { calculateActivityPace } from '@/lib/activity-pace.utils';
import {
  limitDescription,
  defaultTimes,
  convertMinutesToHours,
  getPredictedRaceTimeFactory,
  findClosestRaceParams,
  findPaceValues,
  formatTimeInput,
  storageHelper,
  organizePlanIntoWeeklyBlocks
} from '@/lib/plan-utils';
import { Sidebar } from "@/components/default/Sidebar";
import { MobileHeader } from "@/components/default/MobileHeader";
import { PlanHeader } from '@/components/plan/PlanHeader';
import { WeeklyBlock, Activity, PredictedRaceTime } from '@/types';
import { getPlanByPath, getAllPlanPaths } from '@/lib/db-utils';
import { PlanModel } from '@/models';
import { getUserWorkouts } from '@/lib/user-utils';
import { WorkoutLog } from '@/models/userProfile';
import { getCombinedPaceSettings, getLocalPaceSettings, saveLocalPaceSettings } from '@/lib/pace-storage-utils';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart2, 
  Calendar, 
  CheckCircle, 
  Clock,
  TrendingUp
} from "lucide-react";
import { toast } from 'sonner';

// Carregamento dinâmico do componente WeeklyView
const WeeklyView = dynamic(() => import('@/components/plan/WeeklyView'), {
  loading: () => (
    <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-md my-4 animate-pulse" />
  ),
  ssr: false // Não renderiza no servidor para economizar recursos
});

// Types
interface PlanProps {
  plan: PlanModel;
  completedWorkouts: WorkoutLog[];
}

interface LazyWeeklyBlockProps {
  week: WeeklyBlock;
  windex: number;
  todayRef: React.RefObject<HTMLDivElement>;
  getActivityPace: (activity: Activity) => string;
  convertMinutesToHours: (minutes: number) => string;
  getPredictedRaceTime: (distance: number) => PredictedRaceTime | null;
  completedWorkouts: WorkoutLog[];
  isAuthenticated: boolean;
  onLogWorkout: (date: string, activity: Activity, dayIndex: number) => void;
}

// Componente de Progresso do Plano
const PlanProgress: React.FC<{
  completedWorkouts: WorkoutLog[];
  totalDays: number;
  planPath: string;
  startDate: string;
}> = ({ 
  completedWorkouts,
  totalDays,
  planPath,
  startDate
}) => {
  // Calcular estatísticas do plano
  const stats = useMemo(() => {
    // Filtrar treinos deste plano
    const planWorkouts = completedWorkouts.filter(w => w.planPath === planPath);
    
    // Total de treinos completados
    const totalCompleted = planWorkouts.length;
    
    // Porcentagem de conclusão
    const percentComplete = Math.min(Math.round((totalCompleted / totalDays) * 100), 100);
    
    // Distância total percorrida
    const totalDistance = planWorkouts.reduce((sum, w) => sum + w.distance, 0);
    
    // Tempo total de treino
    const totalDuration = planWorkouts.reduce((sum, w) => sum + w.duration, 0);
    
    // Formatar tempo total
    let formattedDuration = '';
    const hours = Math.floor(totalDuration / 60);
    const minutes = Math.floor(totalDuration % 60);
    
    if (hours > 0) {
      formattedDuration = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } else {
      formattedDuration = `${minutes}min`;
    }
    
    return {
      totalCompleted,
      percentComplete,
      totalDistance: totalDistance.toFixed(1),
      formattedDuration
    };
  }, [completedWorkouts, planPath, totalDays]);

  // Se não houver treinos completados, não renderizar nada
  if (stats.totalCompleted === 0) return null;

  return (
    <Card className="border-primary/10 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Progresso do Plano
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Treinos completados</span>
              <span className="font-medium">{stats.totalCompleted} de {totalDays} ({stats.percentComplete}%)</span>
            </div>
            <Progress value={stats.percentComplete} className="h-2" />
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-1 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground">Treinos</p>
              <p className="text-base font-medium">{stats.totalCompleted}</p>
            </div>
            
            <div className="space-y-1 text-center">
              <div className="flex justify-center">
                <BarChart2 className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground">Distância</p>
              <p className="text-base font-medium">{stats.totalDistance} km</p>
            </div>
            
            <div className="space-y-1 text-center">
              <div className="flex justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-xs text-muted-foreground">Tempo Total</p>
              <p className="text-base font-medium">{stats.formattedDuration}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para indicador de treino concluído
const CompletedWorkoutIndicator: React.FC<{
  date: string;
  activity: Activity;
  completedWorkout?: WorkoutLog;
  isAuthorized: boolean;
}> = ({
  date,
  activity,
  completedWorkout,
  isAuthorized
}) => {
  if (!isAuthorized) return null;
  
  // Verifica se há um treino correspondente concluído
  const isCompleted = !!completedWorkout;
  
  // Formata a distância para exibição
  const formatDistance = (distance: number): string => {
    return `${distance.toFixed(1)} km`;
  };
  
  // Formata a duração para exibição
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    return hours > 0 
      ? `${hours}h${mins.toString().padStart(2, '0')}`
      : `${mins} min`;
  };

  return (
    <div className="flex items-center ml-auto">
      {isCompleted ? (
        <div className="tooltip-container group">
          <CheckCircle className="h-5 w-5 text-green-500 cursor-help" />
          <div className="absolute hidden group-hover:block bg-black/90 dark:bg-white/90 text-white dark:text-black p-2 rounded-md shadow-lg right-0 mt-1 w-48 z-10">
            <div className="text-sm">
              <p className="font-medium">{completedWorkout.title}</p>
              <div className="flex gap-2 text-xs mt-1">
                <span>{formatDistance(completedWorkout.distance)}</span>
                <span>•</span>
                <span>{formatDuration(completedWorkout.duration)}</span>
                {completedWorkout.pace && (
                  <>
                    <span>•</span>
                    <span>{completedWorkout.pace}</span>
                  </>
                )}
              </div>
              <p className="text-xs opacity-75 mt-1">
                {formatDistanceToNow(new Date(completedWorkout.date), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="tooltip-container group">
          <Clock className="h-5 w-5 text-gray-300 dark:text-gray-600 cursor-help" />
          <div className="absolute hidden group-hover:block bg-black/90 dark:bg-white/90 text-white dark:text-black p-2 rounded-md shadow-lg right-0 mt-1 w-48 z-10">
            <div className="text-sm">
              <p>Treino não realizado</p>
              <p className="text-xs opacity-75 mt-1">
                Registre este treino após concluí-lo
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const processCustomPaces = (rawPaces: Record<string, string>) => {
  // Certifique-se de que temos um objeto válido
  if (!rawPaces || typeof rawPaces !== 'object') return {};
  
  const processedPaces: Record<string, string> = {};
  
  // Processa cada entrada, garantindo que formatos estejam corretos
  Object.entries(rawPaces).forEach(([key, value]) => {
    // Ignora valores vazios ou inválidos
    if (!value || value === 'undefined' || value === 'null') return;
    
    // Para ritmos personalizados (ex: custom_Easy Km)
    if (key.startsWith('custom_')) {
      // Certifique-se de que o formato está correto para ritmos
      if (key.includes('Km') || key.includes('m')) {
        // Normaliza o formato do ritmo (remove sufixos como /km e normaliza o formato)
        const normalizedValue = value.replace(/\/km$/, '').trim();
        processedPaces[key] = normalizedValue;
      } else {
        // Outros valores customizados
        processedPaces[key] = value;
      }
    } else {
      // Valores não personalizados (baseTime, adjustmentFactor, etc.)
      processedPaces[key] = value;
    }
  });
  
  return processedPaces;
};

// Componente para renderização preguiçosa de blocos semanais
const LazyWeeklyBlock: React.FC<LazyWeeklyBlockProps> = ({
  week,
  windex,
  todayRef,
  getActivityPace,
  convertMinutesToHours,
  getPredictedRaceTime,
  completedWorkouts,
  isAuthenticated,
  onLogWorkout
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Se esta semana contém o dia atual, torna-a visível imediatamente
    if (week.days.some(day => day.isToday)) {
      setIsVisible(true);
      return;
    }

    // Configura Intersection Observer apenas para blocos não visíveis
    if (!isVisible && blockRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: "300px" } // Carrega quando estiver a 300px de distância
      );

      observer.observe(blockRef.current);
      return () => observer.disconnect();
    }
  }, [week, isVisible]);

  // Placeholder simples enquanto não carrega
  if (!isVisible) {
    return (
      <div ref={blockRef} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-md my-4 animate-pulse" />
    );
  }

  return (
    <WeeklyView
      week={week}
      windex={windex}
      todayRef={todayRef}
      getActivityPace={getActivityPace}
      convertMinutesToHours={convertMinutesToHours}
      getPredictedRaceTime={getPredictedRaceTime}
      completedWorkouts={completedWorkouts}
      isAuthenticated={isAuthenticated}
      onLogWorkout={onLogWorkout}
    />
  );
};

// Main Component
const Plan: React.FC<PlanProps> = ({ plan, completedWorkouts = [] }) => {
  // Auth session para verificar se usuário está logado
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const router = useRouter();

  // State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDistance, setSelectedDistance] = useState<string>("");
  const [weeklyBlocks, setWeeklyBlocks] = useState<WeeklyBlock[]>([]);
  const [params, setParams] = useState<number | null>(null);
  const [calculatedPaces, setCalculatedPaces] = useState<Record<string, string> | null>(null);
  const [customPaces, setCustomPaces] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPaces, setLoadingPaces] = useState(false);
  // Flag para evitar loops infinitos
  const skipNextCalculatedPacesUpdate = useRef(false);

  // Refs
  const todayRef = useRef<HTMLDivElement>(null);
  const initialLoadComplete = useRef<boolean>(false);

  // Inicialização de estados a partir do localStorage
  useEffect(() => {
    if (initialLoadComplete.current) return;
    
    // Carrega as configurações iniciais
    const localPaces = getLocalPaceSettings(plan.path);

    // Define valores padrão caso não existam no localStorage
    const initialStartDate = localPaces.startDate || format(new Date(), "yyyy-MM-dd");
    const initialEndDate = format(addDays(parseISO(initialStartDate), plan.dailyWorkouts.length - 1), "yyyy-MM-dd");
    const initialTime = localPaces.baseTime || defaultTimes["5km"];
    const initialDistance = localPaces.baseDistance || "5km";

    // Atualiza os estados
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setSelectedTime(initialTime);
    setSelectedDistance(initialDistance);

    // Também armazena no customPaces
    setCustomPaces(localPaces);

    // Salva no storageHelper para compatibilidade
    storageHelper.saveSettings(plan.path, {
      startDate: initialStartDate,
      endDate: initialEndDate,
      selectedTime: initialTime,
      selectedDistance: initialDistance
    });

  }, [plan.path, plan.dailyWorkouts.length]);

  // Buscar configurações de ritmos personalizados do usuário
  const fetchUserPaces = useCallback(async () => {
    if (initialLoadComplete.current) return;
    setLoadingPaces(true);

    try {
      if (isAuthenticated && session?.user?.id) {
        // Para usuários autenticados, buscar do servidor
        const response = await fetch(`/api/user/plans/${plan.path}/paces`);

        if (response.ok) {
          const serverPaces = await response.json();

          // Mesclar com dados locais (prioriza servidor)
          const localPaces = getLocalPaceSettings(plan.path);
          const combinedPaces = { ...localPaces, ...serverPaces };

          // Atualiza estados
          setCustomPaces(combinedPaces);

          // Atualiza dados no localStorage
          saveLocalPaceSettings(plan.path, combinedPaces);

          // Se temos data ou tempo personalizados, atualizar estados
          if (combinedPaces.startDate) setStartDate(combinedPaces.startDate);
          if (combinedPaces.baseTime) setSelectedTime(combinedPaces.baseTime);
          if (combinedPaces.baseDistance) setSelectedDistance(combinedPaces.baseDistance);

          // Calcular data de término
          if (combinedPaces.startDate) {
            const newEndDate = format(
              addDays(parseISO(combinedPaces.startDate), plan.dailyWorkouts.length - 1),
              "yyyy-MM-dd"
            );
            setEndDate(newEndDate);
          }
        } else {
          // Em caso de falha na API, usa apenas dados locais
          const localPaces = getLocalPaceSettings(plan.path);
          setCustomPaces(localPaces);
        }
      } else {
        // Para usuários não autenticados, usa apenas dados locais
        const localPaces = getLocalPaceSettings(plan.path);
        setCustomPaces(localPaces);
      }
    } catch (error) {
      console.error('Erro ao buscar ritmos personalizados:', error);

      // Em caso de erro, usa dados locais
      const localPaces = getLocalPaceSettings(plan.path);
      setCustomPaces(localPaces);
    } finally {
      setLoadingPaces(false);
      initialLoadComplete.current = true;
    }
  }, [plan.path, plan.dailyWorkouts.length, isAuthenticated, session]);

  // Buscar dados ao montar o componente
  useEffect(() => {
    fetchUserPaces();
  }, [fetchUserPaces]);

  // Callbacks
  const scrollToToday = useCallback((): void => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const getPredictedRaceTime = useMemo(() => {
    return getPredictedRaceTimeFactory(params);
  }, [params]);

  // Atualizar parâmetros quando tempo/distância mudar
  useEffect(() => {
    if (selectedTime && selectedDistance) {
      const foundParams = findClosestRaceParams(selectedTime, selectedDistance);
      setParams(foundParams);
    }
  }, [selectedTime, selectedDistance]);

  // Atualizar ritmos calculados quando parâmetros mudarem
  useEffect(() => {
    if (params !== null) {
      const paceValues = findPaceValues(params);
      setCalculatedPaces(paceValues || {});
    }
  }, [params]);

  // Mesclar ritmos calculados com ritmos personalizados - CORRIGIDO PARA EVITAR LOOPS
  useEffect(() => {
    if (calculatedPaces && !skipNextCalculatedPacesUpdate.current) {
      // Ativar flag para evitar loop na próxima execução
      skipNextCalculatedPacesUpdate.current = true;
      
      // Criamos um objeto temporário que combinará ambos
      const combinedPaces = { ...customPaces };

      // Adicionamos os ritmos calculados que não estão personalizados
      Object.entries(calculatedPaces).forEach(([key, value]) => {
        const customKey = `custom_${key}`;
        // Se não tiver um ritmo personalizado para esta chave, use o calculado
        if (!combinedPaces[customKey]) {
          combinedPaces[key] = value;
        }
      });

      // Atualizar apenas se houver mudanças necessárias
      if (JSON.stringify(combinedPaces) !== JSON.stringify(customPaces)) {
        setCustomPaces(combinedPaces);
      }
    } else {
      // Resetar a flag para a próxima execução
      skipNextCalculatedPacesUpdate.current = false;
    }
  }, [calculatedPaces, customPaces]);

  // FUNÇÃO-CHAVE: Obter ritmos para atividades
  const getActivityPace = useCallback((activity: Activity): string => {
    if (!activity || !activity.type) return "N/A";
    
    // Utilize a função corretamente, passando o objeto de customPaces com todos os ritmos
    return calculateActivityPace(activity, customPaces, getPredictedRaceTime);
  }, [customPaces, getPredictedRaceTime]);

  // Event Handlers
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newStartDate = format(parseISO(event.target.value), "yyyy-MM-dd");
    const newEndDate = format(addDays(parseISO(newStartDate), plan.dailyWorkouts.length - 1), "yyyy-MM-dd");
    setStartDate(newStartDate);
    setEndDate(newEndDate);

    // Atualizar no customPaces
    const updatedPaces = { ...customPaces, startDate: newStartDate };
    setCustomPaces(updatedPaces);

    // Salvar no localStorage e sessionStorage
    saveLocalPaceSettings(plan.path, updatedPaces);
    storageHelper.saveSettings(plan.path, { startDate: newStartDate, endDate: newEndDate });
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newEndDate = format(parseISO(event.target.value), "yyyy-MM-dd");
    const newStartDate = format(subDays(parseISO(newEndDate), plan.dailyWorkouts.length - 1), "yyyy-MM-dd");
    setEndDate(newEndDate);
    setStartDate(newStartDate);

    // Atualizar no customPaces
    const updatedPaces = { ...customPaces, startDate: newStartDate };
    setCustomPaces(updatedPaces);

    // Salvar no localStorage e sessionStorage
    saveLocalPaceSettings(plan.path, updatedPaces);
    storageHelper.saveSettings(plan.path, { startDate: newStartDate, endDate: newEndDate });
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const formattedTime = formatTimeInput(event.target.value);
    setSelectedTime(formattedTime);

    // Atualizar no customPaces
    const updatedPaces = { ...customPaces, baseTime: formattedTime };
    setCustomPaces(updatedPaces);

    // Salvar no localStorage e sessionStorage
    saveLocalPaceSettings(plan.path, updatedPaces);
    storageHelper.saveSettings(plan.path, { selectedTime: formattedTime });
  };

  const handleDistanceChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newDistance = event.target.value as keyof typeof defaultTimes;
    const newTime = defaultTimes[newDistance];
    setSelectedDistance(newDistance);
    setSelectedTime(newTime);

    // Atualizar no customPaces
    const updatedPaces = {
      ...customPaces,
      baseDistance: newDistance,
      baseTime: newTime
    };
    setCustomPaces(updatedPaces);

    // Salvar no localStorage e sessionStorage
    saveLocalPaceSettings(plan.path, updatedPaces);
    storageHelper.saveSettings(plan.path, {
      selectedDistance: newDistance,
      selectedTime: newTime
    });
  };

    // Função para lidar com registro de treino

    const handleLogWorkout = useCallback((date: string, activity: Activity, dayIndex: number) => {
      // Calcular o ritmo da atividade
      const pace = getActivityPace(activity);
      
      // Garantir que temos uma data formatada adequadamente
      // É importante normalizar a data para o formato YYYY-MM-DD
      const formattedDate = date.includes('T') 
        ? date.split('T')[0]  // Se a data já tiver o formato ISO, extraímos apenas a parte da data
        : date;
      
      console.log(`Registrando treino para dia ${dayIndex} do plano ${plan.path}`);
      
      // Redirecionar para a página de log com parâmetros pré-preenchidos
      router.push({
        pathname: '/dashboard/log',
        query: {
          date: formattedDate,
          planPath: plan.path,                    // Garantir que o planPath é passado exatamente como está no plano
          planDayIndex: dayIndex.toString(),      // IMPORTANTE: Converter para string para evitar problemas de tipo
          activityType: activity.type,
          distance: activity.distance,
          units: activity.units,
          pace: pace !== "N/A" ? pace : "",
          title: activity.note || getTitleFromActivityType(activity.type)
        }
      });
    }, [router, plan.path, getActivityPace]);

  // Organizar dados em semanas
  const organizedWeeklyBlocks = useMemo(() => {
    if (!startDate) return [];

    setIsLoading(true);
    const blocks = organizePlanIntoWeeklyBlocks(plan.dailyWorkouts, startDate);
    setIsLoading(false);
    return blocks;
  }, [startDate, plan.dailyWorkouts]);

  // Atualizar weeklyBlocks quando organizedWeeklyBlocks mudar
  useEffect(() => {
    setWeeklyBlocks(organizedWeeklyBlocks);
  }, [organizedWeeklyBlocks]);

  // Auto-scroll para hoje quando os blocos semanais estiverem prontos
  useEffect(() => {
    if (!isLoading && weeklyBlocks.length > 0) {
      // Timeout para garantir que os elementos estejam renderizados
      const timer = setTimeout(() => {
        if (todayRef.current) {
          scrollToToday();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, weeklyBlocks, scrollToToday]);

  // Derived values
  const percentage = useMemo(() => params ? (params / 85) * 100 : 0, [params]);

  // Se ainda estamos carregando dados iniciais e não temos valores-chave, mostrar loading
  if (loadingPaces && (!startDate || !selectedTime)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4">
          <p className="text-center text-lg">Carregando configurações do plano...</p>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-24 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-60 shrink-0">
        <Sidebar onScrollToToday={scrollToToday} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileHeader onScrollToToday={scrollToToday} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 h-full">
            <Head>
              <title>{`Planilha ${plan.name} (${plan.nivel}) - Magic Training`}</title>
              <meta name="description" content={limitDescription(plan.info || '')} />
              <meta property="og:title" content={`Planilha ${plan.name}`} />
              <meta property="og:description" content={plan.info || ''} />
              <meta property="og:type" content="website" />
              <meta property="og:url" content={typeof window !== "undefined" ? window.location.href : ''} />
              <meta property="og:image" content={plan.img || ''} />
            </Head>

            <div>
              <PlanHeader
                plan={plan}
                startDate={startDate}
                endDate={endDate}
                selectedDistance={selectedDistance}
                selectedTime={selectedTime}
                handleDateChange={handleDateChange}
                handleEndDateChange={handleEndDateChange}
                handleDistanceChange={handleDistanceChange}
                handleTimeChange={handleTimeChange}
                params={params}
                percentage={percentage}
                isAuthenticated={isAuthenticated}
              />

              {/* Componente de progresso do plano */}
              {isAuthenticated && completedWorkouts.length > 0 && (
                <PlanProgress
                  completedWorkouts={completedWorkouts}
                  totalDays={plan.dailyWorkouts.length}
                  planPath={plan.path}
                  startDate={startDate}
                />
              )}

              {isLoading || (!weeklyBlocks.length && startDate) ? (
                // Mostrar múltiplos esqueletos durante o carregamento
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="h-24 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1 p-2">
                  {weeklyBlocks.map((week, windex) => (
                    <LazyWeeklyBlock
                      key={week.weekStart}
                      week={week}
                      windex={windex}
                      todayRef={todayRef}
                      getActivityPace={getActivityPace}
                      convertMinutesToHours={convertMinutesToHours}
                      getPredictedRaceTime={getPredictedRaceTime}
                      completedWorkouts={completedWorkouts}
                      isAuthenticated={isAuthenticated}
                      onLogWorkout={handleLogWorkout}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function para obter título baseado no tipo de atividade
function getTitleFromActivityType(type: string): string {
  const titles: Record<string, string> = {
    'easy': 'Corrida Fácil',
    'recovery': 'Corrida de Recuperação',
    'threshold': 'Treino de Limiar',
    'interval': 'Treino Intervalado',
    'repetition': 'Treino de Repetições',
    'long': 'Corrida Longa',
    'marathon': 'Ritmo de Maratona',
    'race': 'Simulação de Corrida',
    'offday': 'Dia de Descanso',
    'walk': 'Caminhada'
  };

  return titles[type] || 'Treino';
}

// Changed from getStaticPaths/getStaticProps to getServerSideProps
export const getServerSideProps: GetServerSideProps<PlanProps> = async (context) => {
  const session = await getSession(context);
  const { planPath } = context.params as { planPath: string };
  
  try {
    // Aqui precisamos do plano completo com dailyWorkouts
    const plan = await getPlanByPath(planPath, { fields: 'full' });

    if (!plan || !plan.nivel || !["iniciante", "intermediário", "avançado", "elite"].includes(plan.nivel)) {
      return { notFound: true };
    }

    // Se o usuário estiver autenticado, buscar treinos completados
    let completedWorkouts: WorkoutLog[] = [];
    if (session?.user?.id) {
      completedWorkouts = await getUserWorkouts(session.user.id);
    }

    return {
      props: {
        plan: JSON.parse(JSON.stringify(plan)),
        completedWorkouts: JSON.parse(JSON.stringify(completedWorkouts || []))
      }
    };
  } catch (error) {
    console.error(`Erro ao buscar plano ${planPath}:`, error);
    return { notFound: true };
  }
};

export default Plan;