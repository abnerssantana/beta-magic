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
import { PlanSummary } from "@/models";
import { getUserActivePlan, getUserSummary } from "@/lib/user-utils";

interface DashboardProps {
  activePlan: PlanSummary | null;
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

    // Definir o treino do dia
    // Na fase 1, pode ser apenas um placeholder até implementarmos a lógica completa
    const todayWorkout = activePlan ? {
      title: "Treino fácil de recuperação",
      distance: "8 km",
      pace: "6:00/km",
      description: "Mantenha o ritmo fácil, foco na técnica e respiração."
    } : null;

    return {
      props: {
        activePlan: activePlan ? JSON.parse(JSON.stringify(activePlan)) : null,
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
            <TabsTrigger value="today">Treino de Hoje</TabsTrigger>
            <TabsTrigger value="progress">Meu Progresso</TabsTrigger>
          </TabsList>
          
          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
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
            
            {/* Plano Ativo */}
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
                      
                      <Button asChild>
                        <Link href={`/plano/${activePlan.path}`}>
                          Ver Plano Completo
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
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
          
          {/* Treino de Hoje */}
          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Treino de Hoje</CardTitle>
                <CardDescription>
                  {currentDate}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {todayWorkout ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">{todayWorkout.title}</h3>
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                          Treino de Hoje
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {todayWorkout.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Card className="bg-muted/50">
                        <CardContent className="p-4 text-center">
                          <Activity className="h-5 w-5 mx-auto mb-2 text-primary" />
                          <h4 className="text-sm font-medium mb-1">Distância</h4>
                          <p className="text-xl font-bold">{todayWorkout.distance}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/50">
                        <CardContent className="p-4 text-center">
                          <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                          <h4 className="text-sm font-medium mb-1">Ritmo Alvo</h4>
                          <p className="text-xl font-bold">{todayWorkout.pace}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/50 col-span-2 md:col-span-1">
                        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                          <Button className="w-full" size="lg">
                            <PlayCircle className="mr-2 h-5 w-5" />
                            Iniciar Treino
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" asChild>
                        <Link href="/dashboard/log">
                          Registrar Manualmente
                        </Link>
                      </Button>
                      
                      <Button variant="secondary" asChild>
                        <Link href="/dashboard/calendar">
                          Ver Calendário Completo
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhum treino para hoje</h3>
                    <p className="text-muted-foreground max-w-md mb-4">
                      Você não tem treinos agendados para hoje ou ainda não selecionou um plano de treinamento.
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