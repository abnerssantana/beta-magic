import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { format, parseISO, addDays, subDays } from "date-fns";
import { GetStaticPaths, GetStaticProps } from 'next';
import { useSession } from 'next-auth/react';
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
import { getCombinedPaceSettings, getLocalPaceSettings, saveLocalPaceSettings } from '@/lib/pace-storage-utils';

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
}

interface LazyWeeklyBlockProps {
  week: WeeklyBlock;
  windex: number;
  todayRef: React.RefObject<HTMLDivElement>;
  getActivityPace: (activity: Activity) => string;
  convertMinutesToHours: (minutes: number) => string;
  getPredictedRaceTime: (distance: number) => PredictedRaceTime | null;
}

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
  getPredictedRaceTime
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
    />
  );
};

// Main Component
const Plan: React.FC<PlanProps> = ({ plan }) => {
  // Auth session para verificar se usuário está logado
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

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

// Static Site Generation
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Buscar os planos com dados resumidos para gerar os paths
    const planPaths = await getAllPlanPaths();

    const paths = planPaths.map((path) => ({
      params: { planPath: path },
    }));

    return {
      paths,
      fallback: 'blocking' // Permite gerar páginas sob demanda se não existirem no build
    };
  } catch (error) {
    console.error('Erro ao gerar paths para planos:', error);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps<PlanProps> = async ({ params }) => {
  try {
    // Aqui precisamos do plano completo com dailyWorkouts
    const plan = await getPlanByPath(params?.planPath as string, { fields: 'full' });

    if (!plan || !plan.nivel || !["iniciante", "intermediário", "avançado", "elite"].includes(plan.nivel)) {
      return { notFound: true };
    }

    return {
      props: {
        plan: JSON.parse(JSON.stringify(plan))
      },
      // Uma semana em segundos - tempo razoável para revalidação
      revalidate: 604800
    };
  } catch (error) {
    console.error(`Erro ao buscar plano ${params?.planPath}:`, error);
    return { notFound: true };
  }
};

export default Plan;