import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, addDays, isToday, isPast, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ArrowLeft, Activity, CheckCircle } from 'lucide-react';
import { PlanSummary } from '@/models';
import { getUserActivePlan } from '@/lib/user-utils';
import { getPlanByPath } from '@/lib/db-utils';

interface CalendarPageProps {
  activePlan: PlanSummary | null;
  planWorkouts: any[] | null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard/calendar',
        permanent: false,
      },
    };
  }

  try {
    const userId = session.user.id;
    const activePlan = await getUserActivePlan(userId);
    
    let planWorkouts = null;
    if (activePlan) {
      // Obter o plano completo para ter acesso aos treinos
      const fullPlan = await getPlanByPath(activePlan.path);
      if (fullPlan) {
        planWorkouts = fullPlan.dailyWorkouts;
      }
    }

    return {
      props: {
        activePlan: activePlan ? JSON.parse(JSON.stringify(activePlan)) : null,
        planWorkouts: planWorkouts ? JSON.parse(JSON.stringify(planWorkouts)) : null
      },
    };
  } catch (error) {
    console.error('Erro ao buscar plano e treinos:', error);
    return {
      props: {
        activePlan: null,
        planWorkouts: null
      },
    };
  }
};

const CalendarPage: React.FC<CalendarPageProps> = ({ activePlan, planWorkouts }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  useEffect(() => {
    // Definir os dias da semana atual
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    setWeekDays(days);
  }, [currentDate]);

  const goToPreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Mapear o tipo de atividade para uma cor específica
  const getActivityColor = (activityType: string) => {
    const types: {[key: string]: string} = {
      'easy': 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30',
      'recovery': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
      'threshold': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
      'interval': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
      'repetition': 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30',
      'race': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
      'offday': 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30',
      'long': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      'marathon': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      'walk': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
    };
    
    return types[activityType] || 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30';
  };

  // Calcular dia e índice no plano de treino
  const getPlanDayIndex = (date: Date) => {
    // Aqui você implementará a lógica para determinar o índice do dia no plano
    // Por enquanto, vamos usar um placeholder - índice aleatório para demonstração
    return Math.floor(Math.random() * (planWorkouts?.length || 0));
  };

  // Obter atividades para um dia específico
  const getDayActivities = (date: Date) => {
    if (!planWorkouts) return [];
    
    const dayIndex = getPlanDayIndex(date);
    if (dayIndex < 0 || dayIndex >= planWorkouts.length) return [];
    
    return planWorkouts[dayIndex].activities || [];
  };

  return (
    <Layout>
      <Head>
        <title>Calendário de Treino - Magic Training</title>
        <meta
          name="description"
          content="Visualize seu plano de treino em formato de calendário."
        />
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendário de Treino</h1>
            <p className="text-muted-foreground">
              Visualize seu plano semanal e acompanhe seu progresso
            </p>
          </div>
          
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>

        {activePlan ? (
          <>
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle>
                    <span>{activePlan.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {activePlan.nivel}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Hoje
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextWeek}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, index) => (
                    <div
                      key={index}
                      className={`
                        min-h-[150px] p-2 rounded-lg border
                        ${isToday(day) ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border'}
                      `}
                    >
                      <div className="text-center mb-1">
                        <div className="text-xs uppercase text-muted-foreground">
                          {format(day, 'EEEE', { locale: ptBR })}
                        </div>
                        <div className={`text-lg font-bold ${isToday(day) ? 'text-primary' : ''}`}>
                          {format(day, 'd', { locale: ptBR })}
                        </div>
                      </div>
                      
                      <Separator className="my-1" />
                      
                      <div className="space-y-1">
                        {getDayActivities(day).map((activity: any, actIndex: number) => (
                          <div
                            key={actIndex}
                            className={`text-xs p-1 rounded ${getActivityColor(activity.type)} flex justify-between items-center`}
                          >
                            <span className="font-medium truncate">{activity.type}</span>
                            <span>{activity.distance} {activity.units}</span>
                            
                            {isPast(day) && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        ))}
                        
                        {getDayActivities(day).length === 0 && (
                          <div className="text-xs text-muted-foreground text-center p-2">
                            Descanso
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Próximos Treinos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Aqui você pode listar os próximos 3-5 treinos */}
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-2 h-full min-h-[40px] rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">
                            {index === 0 ? 'Hoje' : `${index} dias`} - {['Corrida fácil', 'Intervalos', 'Longo'][index]}
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {['6:00', '4:30', '5:30'][index]} /km
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Activity className="h-3.5 w-3.5" />
                          {[8, 6, 16][index]} km
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <CalendarIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum plano ativo</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Você ainda não tem um plano de treino ativo. Ative um plano para visualizar seu calendário de treinos.
              </p>
              <Button asChild>
                <Link href="/dashboard/plans">
                  Escolher um Plano
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CalendarPage;