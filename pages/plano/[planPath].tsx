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
import WeekSkeleton from '@/components/plan/WeekSkeleton';

// Carregamento dinâmico do componente WeeklyView
const WeeklyView = dynamic(() => import('@/components/plan/WeeklyView'), {
  loading: () => <WeekSkeleton />,
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

  // Placeholder com Skeleton enquanto não carrega
  if (!isVisible) {
    return (
      <div ref={blockRef}>
        <WeekSkeleton />
      </div>
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
  
  // State
  const [startDate, setStartDate] = useState<string>(storageHelper.getStartDate(plan.path));
  const [endDate, setEndDate] = useState<string>(storageHelper.getEndDate(plan.path, plan.dailyWorkouts.length));
  const [selectedTime, setSelectedTime] = useState<string>(storageHelper.getSelectedTime(plan.path));
  const [selectedDistance, setSelectedDistance] = useState<string>(storageHelper.getSelectedDistance(plan.path));
  const [weeklyBlocks, setWeeklyBlocks] = useState<WeeklyBlock[]>([]);
  const [params, setParams] = useState<number | null>(null);
  const [selectedPaces, setSelectedPaces] = useState<Record<string, string> | null>(null);
  const [userCustomPaces, setUserCustomPaces] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPaces, setLoadingPaces] = useState(false);

  // Refs
  const todayRef = useRef<HTMLDivElement>(null);

  // Buscar configurações de ritmos personalizados do usuário
  useEffect(() => {
    // Apenas buscar se o usuário estiver autenticado
    if (status === 'authenticated' && session?.user?.id) {
      setLoadingPaces(true);
      
      // Função para buscar ritmos personalizados via API
      const fetchUserPaces = async () => {
        try {
          const response = await fetch(`/api/user/plans/${plan.path}/paces`);
          
          if (response.ok) {
            const paces = await response.json();
            
            // Atualizar estados com as configurações do usuário
            setUserCustomPaces(paces);
            
            // Se houver data de início personalizada, atualizar
            if (paces.startDate) {
              setStartDate(paces.startDate);
              storageHelper.saveSettings(plan.path, { startDate: paces.startDate });
            }
            
            // Se houver configurações de tempo/distância personalizadas, atualizar
            if (paces.baseTime && paces.baseDistance) {
              setSelectedTime(paces.baseTime);
              setSelectedDistance(paces.baseDistance);
              storageHelper.saveSettings(plan.path, { 
                selectedTime: paces.baseTime,
                selectedDistance: paces.baseDistance
              });
            }
          }
        } catch (error) {
          console.error('Erro ao buscar ritmos personalizados:', error);
        } finally {
          setLoadingPaces(false);
        }
      };
      
      fetchUserPaces();
    }
  }, [session, status, plan.path]);

  // Callbacks
  const scrollToToday = useCallback((): void => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const getPredictedRaceTime = useMemo(() => {
    return getPredictedRaceTimeFactory(params);
  }, [params]);

  // Função melhorada para obter ritmos, priorizando os personalizados do usuário
  const getActivityPace = useCallback((activity: Activity): string => {
    return calculateActivityPace(activity, userCustomPaces, getPredictedRaceTime);
  }, [userCustomPaces, getPredictedRaceTime]);

  // Event Handlers
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newStartDate = format(parseISO(event.target.value), "yyyy-MM-dd");
    const newEndDate = format(addDays(parseISO(newStartDate), plan.dailyWorkouts.length - 1), "yyyy-MM-dd");
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newEndDate = format(parseISO(event.target.value), "yyyy-MM-dd");
    const newStartDate = format(subDays(parseISO(newEndDate), plan.dailyWorkouts.length - 1), "yyyy-MM-dd");
    setEndDate(newEndDate);
    setStartDate(newStartDate);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSelectedTime(formatTimeInput(event.target.value));
  };

  const handleDistanceChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newDistance = event.target.value as keyof typeof defaultTimes;
    setSelectedDistance(newDistance);
    setSelectedTime(defaultTimes[newDistance]);
    setParams(null);
  };

  // Effects
  useEffect(() => {
    // Persist state to sessionStorage
    storageHelper.saveSettings(plan.path, {
      startDate,
      endDate,
      selectedTime,
      selectedDistance
    });
  }, [startDate, endDate, selectedTime, selectedDistance, plan.path]);

  useEffect(() => {
    // Calculate closest race params
    const foundParams = findClosestRaceParams(selectedTime, selectedDistance);
    setParams(foundParams);
  }, [selectedTime, selectedDistance]);

  useEffect(() => {
    // Update paces based on params
    const paceValues = findPaceValues(params);
    
    // Se houver ritmos padrão, incorporar com os personalizados
    if (paceValues) {
      // Criar um objeto combinado com os ritmos padrão
      const combinedPaces = { ...paceValues };
      
      // Substituir com os ritmos personalizados onde disponíveis
      setSelectedPaces(combinedPaces);
    } else {
      setSelectedPaces(null);
    }
  }, [params, userCustomPaces]);

  // Organizar dados em semanas - usando memoização
  const organizedWeeklyBlocks = useMemo(() => {
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
                isAuthenticated={status === 'authenticated'}
              />

              {isLoading || loadingPaces ? (
                // Mostrar múltiplos esqueletos durante o carregamento inicial
                <div className="space-y-1">
                  {[...Array(3)].map((_, index) => (
                    <WeekSkeleton key={index} />
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