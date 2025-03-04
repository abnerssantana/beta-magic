import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { getSession, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  Calendar,
  Activity,
  BarChart2,
  Settings,
  Clock,
  PlayCircle,
  Zap,
  Award,
  ListChecks,
  User,
  Dumbbell,
  ChevronRight,
} from "lucide-react";

import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlanModel, PlanSummary } from "@/models";
import { getUserActivePlan, getUserSummary } from "@/lib/user-utils";
import { getPlanByPath } from "@/lib/db-utils";
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
}

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

    // Buscar o plano completo com workouts se existir um plano ativo
    let fullPlan = null;
    if (activePlan) {
      fullPlan = await getPlanByPath(activePlan.path);
    }

    // Definir o treino do dia - melhorado com dados mais realistas
    const todayWorkout = activePlan ? {
      title: "Corrida fácil de recuperação",
      distance: "8 km",
      pace: "6:00/km",
      description: "Mantenha o ritmo fácil, foco na técnica e respiração. Preste atenção à sua forma de correr.",
      type: "easy"
    } : null;

    return {
      props: {
        activePlan: activePlan ? JSON.parse(JSON.stringify(activePlan)) : null,
        fullPlan: fullPlan ? JSON.parse(JSON.stringify(fullPlan)) : null,
        todayWorkout,
        weekProgress: 40, // Exemplo - será calculado dinamicamente na próxima fase
        userSummary
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
        }
      },
    };
  }
};

const Dashboard: React.FC<DashboardProps> = ({
  activePlan,
  fullPlan,
  todayWorkout,
  weekProgress,
  userSummary
}) => {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(
      format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
    );
  }, []);

  // Função para mapear tipo de atividade para cor
  const getActivityColor = (type: string) => {
    const types: {[key: string]: string} = {
      'easy': 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30',
      'recovery': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
      'threshold': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
      'interval': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
    };
    
    return types[type] || 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
  };

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
                <Activity className="mr-2 h-4 w-4" />
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
          
          {/* Visão Geral - modificada para destacar o treino de hoje */}
          <TabsContent value="overview" className="space-y-4">
            {/* Treino de Hoje em Destaque */}
            {activePlan && todayWorkout && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-primary" />
                      <span>Treino de Hoje</span>
                    </div>
                    <Badge variant="outline" className={getActivityColor(todayWorkout.type)}>
                      {todayWorkout.type === 'easy' ? 'Fácil' : 
                      todayWorkout.type === 'recovery' ? 'Recuperação' : 
                      todayWorkout.type === 'threshold' ? 'Limiar' : 
                      todayWorkout.type}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {currentDate}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1">
                      <p className="text-lg font-semibold mb-1">{todayWorkout.title}</p>
                      <p className="text-sm text-muted-foreground">{todayWorkout.description}</p>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg min-w-20">
                        <span className="text-xs text-muted-foreground">Distância</span>
                        <span className="text-lg font-bold">{todayWorkout.distance}</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg min-w-20">
                        <span className="text-xs text-muted-foreground">Ritmo</span>
                        <span className="text-lg font-bold">{todayWorkout.pace}</span>
                      </div>
                      
                      <Button asChild className="self-center">
                        <Link href="/dashboard/log">
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Iniciar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Resumo de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm flex items-center">
                      <Dumbbell className="mr-2 h-4 w-4" />
                      Treinos Completados
                    </span>
                    <span className="text-3xl font-bold">{userSummary.completedWorkouts}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm flex items-center">
                      <Activity className="mr-2 h-4 w-4" />
                      Quilômetros Totais
                    </span>
                    <span className="text-3xl font-bold">{userSummary.totalDistance} km</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm flex items-center">
                      <Zap className="mr-2 h-4 w-4" />
                      Sequência de Treinos
                    </span>
                    <span className="text-3xl font-bold">{userSummary.streakDays} dias</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-500/5 border-orange-500/20">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm flex items-center">
                      <Award className="mr-2 h-4 w-4" />
                      Próximo Objetivo
                    </span>
                    <span className="text-3xl font-bold">{userSummary.nextMilestone}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Plano Ativo - adicionado botão de configuração */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <CardTitle>Plano de Treino Ativo</CardTitle>
                <CardDescription>
                  Seu plano atual e progresso semanal
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {activePlan ? (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold">{activePlan.name}</h3>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="outline" className="text-xs">
                            {activePlan.nivel}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {activePlan.coach}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            • {activePlan.duration}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/plans/${activePlan.path}/settings`}>
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar
                          </Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link href={`/plano/${activePlan.path}`}>
                            Ver Plano
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso Semanal</span>
                        <span className="font-medium">{weekProgress}%</span>
                      </div>
                      <Progress value={weekProgress} className="h-2" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Activity className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhum plano ativo</h3>
                    <p className="text-muted-foreground max-w-md mb-4">
                      Você ainda não selecionou um plano de treinamento. Escolha um plano para começar a acompanhar seu progresso.
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/plans">
                        Escolher um Plano
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Registro de Atividades Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>
                  Seus treinos mais recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Em uma versão futura, isso será preenchido com dados reais */}
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      Seus treinos recentes aparecerão aqui quando você começar a treinar.
                    </p>
                    <Button variant="link" asChild>
                      <Link href="/dashboard/log">
                        Registrar treino manual
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Calendário - substitui a aba de Treino de Hoje */}
          <TabsContent value="calendar" className="space-y-4">
            <TrainingCalendar 
              activePlan={activePlan} 
              planWorkouts={fullPlan?.dailyWorkouts || null} 
            />
          </TabsContent>
          
          {/* Meu Progresso */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meu Progresso</CardTitle>
                <CardDescription>
                  Acompanhe sua evolução ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="rounded-full bg-muted p-3 mb-4 inline-block">
                    <BarChart2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Dados de progresso em breve</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Estamos trabalhando para trazer gráficos detalhados e análises do seu progresso.
                    Continue treinando e logo você poderá visualizar sua evolução.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;