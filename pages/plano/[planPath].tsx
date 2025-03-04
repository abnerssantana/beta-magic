// pages/plano/[planPath].tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Head from "next/head";
import { format, parseISO, addDays, subDays, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { GetStaticPaths, GetStaticProps } from 'next';
import { calculateActivityPace } from '@/lib/activity-pace.utils';
import { races, paces } from "@/lib/PacesRaces";
import { Sidebar } from "@/components/default/Sidebar";
import { MobileHeader } from "@/components/default/MobileHeader";
import { PlanHeader } from '@/components/plan/PlanHeader';
import { WeeklyView } from '@/components/plan/WeeklyView';
import { Activity as TypeActivity, WeeklyBlock, PredictedRaceTime, Activity } from '@/types';
import { getPlanByPath, getAllPlans } from '@/lib/db-utils';
import { PlanModel } from '@/models';

// Types
interface PlanProps {
  plan: PlanModel;
}

// Utility Functions
const timeToSeconds = (time: string): number => {
  const [h, m, s] = time.split(":").map(parseFloat);
  return h * 3600 + m * 60 + (s || 0);
};

const limitDescription = (description: string, limit = 160): string => {
  if (description.length <= limit) return description;
  return description.slice(0, limit).trim() + '...';
};

const defaultTimes: Record<string, string> = {
  "1500m": "00:05:24",
  "1600m": "00:05:50",
  "3km": "00:11:33",
  "3200m": "00:12:28",
  "5km": "00:19:57",
  "10km": "00:41:21",
  "15km": "01:03:36",
  "21km": "01:31:35",
  "42km": "03:10:49"
};

// Main Component
const Plan: React.FC<PlanProps> = ({ plan }) => {
  // Local Storage Helpers
  const getInitialDate = (): string => {
    if (typeof window === "undefined") return format(new Date(), "yyyy-MM-dd");
    return localStorage.getItem("startDate") || format(new Date(), "yyyy-MM-dd");
  };

  const getInitialEndDate = (): string => {
    if (typeof window === "undefined") return format(addDays(new Date(), plan.dailyWorkouts.length), "yyyy-MM-dd");
    return localStorage.getItem("endDate") || format(addDays(new Date(), plan.dailyWorkouts.length), "yyyy-MM-dd");
  };

  // State
  const [startDate, setStartDate] = useState<string>(getInitialDate());
  const [endDate, setEndDate] = useState<string>(getInitialEndDate());
  const [selectedTime, setSelectedTime] = useState<string>(
    typeof window !== "undefined" ? localStorage.getItem("selectedTime") || "00:19:57" : "00:19:57"
  );
  const [selectedDistance, setSelectedDistance] = useState<string>(
    typeof window !== "undefined" ? localStorage.getItem("selectedDistance") || "5km" : "5km"
  );
  const [weeklyBlocks, setWeeklyBlocks] = useState<WeeklyBlock[]>([]);
  const [params, setParams] = useState<number | null>(null);
  const [selectedPaces, setSelectedPaces] = useState<Record<string, string> | null>(null);

  // Refs
  const todayRef = useRef<HTMLDivElement>(null);

  // Callbacks
  const scrollToToday = useCallback((): void => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const getPredictedRaceTime = useCallback((distance: number): PredictedRaceTime | null => {
    if (!params) return null;

    const raceData = races.find(race => race.Params === params);
    const distanceKey = `${distance}km`;

    if (!raceData || !raceData[distanceKey as keyof typeof raceData]) return null;

    const timeString = raceData[distanceKey as keyof typeof raceData] as string;
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    const paceMinutes = totalMinutes / distance;
    const paceMinutesInt = Math.floor(paceMinutes);
    const paceSeconds = Math.round((paceMinutes - paceMinutesInt) * 60);
    const paceString = `${paceMinutesInt}:${paceSeconds.toString().padStart(2, '0')}`;

    return { time: timeString, pace: paceString };
  }, [params]);

  const getActivityPace = useCallback((activity: Activity): string => {
    return calculateActivityPace(activity, selectedPaces, getPredictedRaceTime);
  }, [selectedPaces, getPredictedRaceTime]);

  const convertMinutesToHours = useCallback((minutes: number): string => {
    if (minutes <= 59) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
  }, []);

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
    const inputTime = event.target.value.replace(/[^0-9]/g, "");
    let formattedTime = inputTime;

    if (inputTime.length > 2) {
      formattedTime = `${inputTime.slice(0, 2)}:${inputTime.slice(2)}`;
    }
    if (inputTime.length > 4) {
      formattedTime = `${inputTime.slice(0, 2)}:${inputTime.slice(2, 4)}:${inputTime.slice(4, 6)}`;
    }

    setSelectedTime(formattedTime);
  };

  const handleDistanceChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newDistance = event.target.value as keyof typeof defaultTimes;
    setSelectedDistance(newDistance);
    setSelectedTime(defaultTimes[newDistance]);
    setParams(null);
  };

  // Effects
  useEffect(() => {
    // Persist state to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("startDate", startDate);
      localStorage.setItem("endDate", endDate);
      localStorage.setItem("selectedTime", selectedTime);
      localStorage.setItem("selectedDistance", selectedDistance);
    }
  }, [startDate, endDate, selectedTime, selectedDistance]);

  useEffect(() => {
    // Calculate closest race params
    const inputSeconds = timeToSeconds(selectedTime);
    const closestRace = races.reduce((closest, current) => {
      const distanceKey = selectedDistance as keyof typeof current;
      const currentSeconds = timeToSeconds(current[distanceKey] as string);
      return Math.abs(currentSeconds - inputSeconds) <
        Math.abs(timeToSeconds(closest[distanceKey] as string) - inputSeconds)
        ? current
        : closest;
    }, races[0]);
    setParams(closestRace.Params);
  }, [selectedTime, selectedDistance]);

  useEffect(() => {
    // Update paces based on params
    if (!params) {
      setSelectedPaces(null);
      return;
    }

    const foundPaces = paces.find((pace) => pace.Params === params);
    if (!foundPaces) {
      setSelectedPaces(null);
      return;
    }

    const { ...pacesWithoutParams } = foundPaces;
    const validPaces = Object.fromEntries(
      Object.entries(pacesWithoutParams).filter(([value]) => value !== undefined)
    ) as Record<string, string>;
    setSelectedPaces(validPaces);
  }, [params]);

  useEffect(() => {
    // Organize data into weekly blocks
    const blocks: WeeklyBlock[] = [];
    let currentWeek: WeeklyBlock = {
      weekStart: format(parseISO(startDate), "yyyy-MM-dd"),
      days: [],
    };

    plan.dailyWorkouts.forEach((day, index) => {
      const date = addDays(parseISO(startDate), index);
      const formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });

      if (index !== 0 && index % 7 === 0) {
        blocks.push(currentWeek);
        currentWeek = {
          weekStart: format(date, "yyyy-MM-dd"),
          days: [],
        };
      }

      currentWeek.days.push({
        date: formattedDate,
        activities: day.activities.map(activity => ({
          ...activity,
          type: activity.type as TypeActivity['type']
        })),
        note: day.note,
        isToday: isToday(date),
        isPast: isPast(date),
      });
    });
    blocks.push(currentWeek);
    setWeeklyBlocks(blocks);
  }, [startDate, plan.dailyWorkouts]);

  // Derived values
  const percentage = useMemo(() => params ? (params / 85) * 100 : 0, [params]);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-52 shrink-0">
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
              />

              <div className="grid grid-cols-1 gap-1 p-2">
                {weeklyBlocks.map((week, windex) => (
                  <WeeklyView
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
    const plans = await getAllPlans();
    // Filtramos apenas os planos que não começam com 'treino/'
    const runPlans = plans.filter(plan => !plan.path.startsWith('treino/'));
    
    const paths = runPlans.map((plan) => ({
      params: { planPath: plan.path },
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
    
    if (!plan || !["iniciante", "intermediário", "avançado", "elite"].includes(plan.nivel)) {
      return { notFound: true };
    }

    return {
      props: {
        plan: JSON.parse(JSON.stringify(plan))
      },
      revalidate: 604800
    };
  } catch (error) {
    console.error(`Erro ao buscar plano ${params?.planPath}:`, error);
    return { notFound: true };
  }
};

export default Plan;