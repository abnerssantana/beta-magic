import { GetServerSideProps } from 'next';
import { useSession, getSession } from 'next-auth/react';
import { getUserActivePlan, getUserSummary, getUserCustomPaces, getUserWorkouts } from '@/lib/user-utils';
import { getPlanByPath } from '@/lib/db-utils';
import { calculateActivityPace } from '@/lib/activity-pace.utils';
import {
  findClosestRaceParams,
  getPredictedRaceTimeFactory,
  organizePlanIntoWeeklyBlocks
} from '@/lib/plan-utils';
import { Activity } from '@/types';
import { WorkoutLog } from '@/models/userProfile';

import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Settings, Rabbit } from "lucide-react";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanSummary, PlanModel } from "@/models";

// Componentes modularizados
import StatsSummary from "@/components/dashboard/StatsSummary";
import ActivePlanCard from "@/components/dashboard/ActivePlanCard";
import TodayWorkout from "@/components/dashboard/TodayWorkout";
import RecentActivities from "@/components/dashboard/RecentActivities";
import ProgressTab from "@/components/dashboard/ProgressTab";
import { TrainingCalendar } from "@/components/dashboard/TrainingCalendar";

interface DashboardProps {
  activePlan: PlanSummary | null;
  fullPlan: PlanModel | null;
  todayWorkout: any | null;
  weekProgress: number;
  userSummary: {
    totalDistance: number;
    completedWorkouts: number;
    streakDays: number;
    nextMilestone: string;
  };
  completedWorkouts: WorkoutLog[];
}

const Dashboard: React.FC<DashboardProps> = ({
  activePlan,
  fullPlan,
  todayWorkout,
  weekProgress,
  userSummary,
  completedWorkouts
}) => {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(
      format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
    );
  }, []);

  return (
    <Layout>
      <Head>
        <title>Dashboard - Magic Training</title>
        <meta
          name="description"
          content="Acompanhe seu progresso e gerencie seus planos de treinamento."
        />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Bem-vindo(a), {session?.user?.name?.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground">
              {currentDate} • Vamos treinar hoje?
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </Button>

            <Button variant="default" size="sm" asChild>
              <Link href="/dashboard/plans">
                <Rabbit className="mr-2 h-4 w-4" />
                Meus Planos
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="progress">Meu Progresso</TabsTrigger>
          </TabsList>

          {/* Visão Geral - com componentes modularizados */}
          <TabsContent value="overview" className="space-y-4">
            {/* Treino de Hoje em Destaque */}
            <TodayWorkout
              activePlan={activePlan}
              todayWorkout={todayWorkout}
              currentDate={currentDate}
            />

            {/* Resumo de Estatísticas */}
            <StatsSummary userSummary={userSummary} />

            {/* Plano Ativo */}
            <ActivePlanCard activePlan={activePlan} weekProgress={weekProgress} />

            {/* Registro de Atividades Recentes */}
            <RecentActivities completedWorkouts={completedWorkouts} />
          </TabsContent>

          {/* Calendário - Mostra a semana atual de treinos e permite navegar entre semanas */}
          <TabsContent value="calendar" className="space-y-4">
            <TrainingCalendar
              activePlan={activePlan}
              planWorkouts={fullPlan?.dailyWorkouts || null}
              completedWorkouts={completedWorkouts}
            />
          </TabsContent>

          {/* Meu Progresso */}
          <TabsContent value="progress" className="space-y-4">
            <ProgressTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/dashboard",
        permanent: false,
      },
    };
  }

  try {
    // Buscar plano ativo e resumo do usuário
    const userId = session.user.id;
    const activePlan = await getUserActivePlan(userId);
    const userSummary = await getUserSummary(userId);
    
    // Buscar treinos completados pelo usuário
    const completedWorkouts = await getUserWorkouts(userId);

    // Buscar o plano completo com workouts se existir um plano ativo
    let fullPlan = null;
    let todayWorkout = null;

    if (activePlan) {
      fullPlan = await getPlanByPath(activePlan.path);

      if (fullPlan) {
        // Obter as configurações do usuário para o plano
        const userPaces = await getUserCustomPaces(userId, activePlan.path);

        // Obter a data de início do plano (do customPaces ou usar o padrão do localStorage)
        const startDate = userPaces.startDate || format(new Date(), "yyyy-MM-dd");

        // Organizar o plano em blocos semanais a partir da data de início
        const weeklyBlocks = organizePlanIntoWeeklyBlocks(fullPlan.dailyWorkouts, startDate);

        // Encontrar o dia de hoje nos blocos semanais
        let todayActivities = null;

        for (const week of weeklyBlocks) {
          for (const day of week.days) {
            if (day.isToday) {
              todayActivities = day.activities;
              break;
            }
          }
          if (todayActivities) break;
        }

        // Se encontrou atividades para hoje, processar para exibição
        if (todayActivities && todayActivities.length > 0) {
          // Pegar a primeira atividade (principal) do dia
          const mainActivity = todayActivities[0];

          // Calcular o ritmo usando os ritmos personalizados do usuário
          const baseParams = findClosestRaceParams(
            userPaces.baseTime || "00:19:57",
            userPaces.baseDistance || "5km"
          );

          // Extrair os ritmos personalizados do formato correto
          const formattedUserPaces = { ...userPaces };

          // Calcular o ritmo com a função melhorada
          const pace = calculateActivityPace(
            mainActivity,
            formattedUserPaces,
            getPredictedRaceTimeFactory(baseParams)
          );

          // Criar o objeto de treino do dia
          todayWorkout = {
            title: mainActivity.note || getTitleFromActivityType(mainActivity.type),
            distance: `${mainActivity.distance} ${mainActivity.units}`,
            pace: pace !== "N/A" ? `${pace}/km` : "Ritmo variado",
            description: getDescriptionFromActivity(mainActivity),
            type: mainActivity.type,
            workouts: mainActivity.workouts || []
          };
        }
      }
    }

    // Calcular progresso semanal com base nos treinos completados
    // Esta é uma versão simplificada - idealmente seria baseada nos treinos previstos vs. realizados
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Ajuste para começar na segunda-feira
    
    const workoutsThisWeek = completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= startOfWeek && workoutDate <= today;
    });
    
    // Assumindo que deveria haver um treino por dia, 7 treinos na semana
    const targetWorkouts = 7; 
    const weekProgress = Math.min(Math.round((workoutsThisWeek.length / targetWorkouts) * 100), 100);

    return {
      props: {
        activePlan: activePlan ? JSON.parse(JSON.stringify(activePlan)) : null,
        fullPlan: fullPlan ? JSON.parse(JSON.stringify(fullPlan)) : null,
        todayWorkout: todayWorkout ? JSON.parse(JSON.stringify(todayWorkout)) : null,
        weekProgress,
        userSummary,
        completedWorkouts: JSON.parse(JSON.stringify(completedWorkouts))
      },
    };
  } catch (error) {
    console.error("Erro ao carregar dados do dashboard:", error);

    return {
      props: {
        activePlan: null,
        fullPlan: null,
        todayWorkout: null,
        weekProgress: 0,
        userSummary: {
          totalDistance: 0,
          completedWorkouts: 0,
          streakDays: 0,
          nextMilestone: "5K"
        },
        completedWorkouts: []
      },
    };
  }
};

// Funções auxiliares para o treino do dia
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

function getDescriptionFromActivity(activity: Activity): string {
  // Descrições padrão baseadas no tipo de atividade
  const defaultDescriptions: Record<string, string> = {
    'easy': 'Mantenha o ritmo confortável, onde você consegue conversar sem dificuldade. Foco em técnica e eficiência.',
    'recovery': 'Ritmo muito leve para recuperação ativa. Escute seu corpo e mantenha um esforço mínimo.',
    'threshold': 'Mantenha o ritmo no seu limiar anaeróbico, um esforço controlado mas desafiador.',
    'interval': 'Intervalos de alta intensidade com recuperação controlada entre repetições.',
    'repetition': 'Repetições curtas e intensas para desenvolver potência e economia de corrida.',
    'long': 'Construa resistência aeróbica com esta corrida de longa duração em ritmo confortável.',
    'marathon': 'Treino no ritmo específico de maratona para adaptação fisiológica e mental.',
    'race': 'Simulação de corrida para praticar estratégia e ritmo de prova.',
    'offday': 'Dia de descanso para recuperação e adaptação.',
    'walk': 'Caminhada ativa para recuperação e manutenção do condicionamento básico.'
  };

  // Se a atividade tem uma nota, usar isso como descrição principal
  if (activity.note) {
    return activity.note;
  }

  // Se tem workouts com notas, adicionar à descrição
  if (activity.workouts && activity.workouts.length > 0) {
    const workoutNotes = activity.workouts
      .filter(w => w.note)
      .map(w => w.note)
      .join(". ");

    if (workoutNotes) {
      return workoutNotes;
    }
  }

  // Caso contrário, usar a descrição padrão do tipo
  return defaultDescriptions[activity.type] || 'Siga as instruções do treino conforme indicado.';
}

export default Dashboard;