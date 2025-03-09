import React, { useState, useEffect, useMemo } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  Calendar, 
  Clock, 
  BarChart2, 
  PlusCircle, 
  ArrowLeft, 
  Search, 
  Filter,
  X,
  Pencil,
  ExternalLink
} from "lucide-react";
import { WorkoutLog } from '@/models/userProfile';
import { PlanSummary } from '@/models';
import { getUserActivePlan } from '@/lib/user-utils';
import { Separator } from '@/components/ui/separator';

interface ActivitiesPageProps {
  completedWorkouts: WorkoutLog[];
  activePlan: PlanSummary | null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard/activities',
        permanent: false,
      },
    };
  }

  try {
    const userId = session.user.id;
    
    // Buscar o plano ativo do usuário
    const activePlan = await getUserActivePlan(userId);
    
    // Buscar os workouts registrados do usuário
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/workouts?userId=${userId}`, {
      headers: {
        cookie: context.req.headers.cookie || '',
      },
    });
    
    let completedWorkouts: WorkoutLog[] = [];
    
    if (res.ok) {
      completedWorkouts = await res.json();
    }

    return {
      props: {
        completedWorkouts: JSON.parse(JSON.stringify(completedWorkouts)),
        activePlan: activePlan ? JSON.parse(JSON.stringify(activePlan)) : null,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    return {
      props: {
        completedWorkouts: [],
        activePlan: null,
      },
    };
  }
};

const ActivitiesPage: React.FC<ActivitiesPageProps> = ({ completedWorkouts, activePlan }) => {
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutLog[]>(completedWorkouts);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('todos');
  const [sortOrder, setSortOrder] = useState('desc');
  const [monthFilter, setMonthFilter] = useState('todos');
  const router = useRouter();

  // Safe format date function to handle potentially invalid dates
  const safeFormatDate = (dateString: string, formatString: string): string => {
    try {
      if (!dateString) return "Data desconhecida";
      const date = parseISO(dateString);
      // Check if date is valid
      if (!isValid(date)) return "Data inválida";
      return format(date, formatString, { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Data inválida";
    }
  };

  // Estatísticas gerais
  const totalDistance = completedWorkouts.reduce((sum, workout) => sum + workout.distance, 0);
  const totalDuration = completedWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
  const totalActivities = completedWorkouts.length;

  // Formatar a duração (minutos) para hh:mm ou hh:mm:ss
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes % 1) * 60);
    
    return hours > 0 
      ? `${hours}h${mins.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para obter a cor baseada no tipo de atividade
  const getActivityColor = (type: string): string => {
    const types: Record<string, string> = {
      'easy': 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30',
      'recovery': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
      'threshold': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
      'interval': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
      'repetition': 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30',
      'race': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30'
    };
    
    return types[type] || 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
  };

  // Mapear tipo de atividade para nome legível
  const getActivityTypeName = (type: string): string => {
    const types: Record<string, string> = {
      'easy': 'Fácil',
      'recovery': 'Recuperação',
      'threshold': 'Limiar',
      'interval': 'Intervalo',
      'repetition': 'Repetição',
      'race': 'Competição',
      'long': 'Longo',
      'other': 'Outro'
    };
    
    return types[type] || type;
  };

  // Preparar opções de meses para filtro
  const getMonthOptions = () => {
    const months = completedWorkouts.map(workout => {
      try {
        if (!workout.date) return null;
        const date = parseISO(workout.date);
        if (!isValid(date)) return null;
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      } catch (error) {
        console.error('Error processing date for month options:', error);
        return null;
      }
    }).filter(Boolean) as string[];
    
    const uniqueMonths = Array.from(new Set(months));
    
    return uniqueMonths.sort().reverse().map(monthStr => {
      const [year, month] = monthStr.split('-').map(Number);
      try {
        return {
          value: monthStr,
          label: format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR })
        };
      } catch (error) {
        return {
          value: monthStr,
          label: `${month}/${year}`
        };
      }
    });
  };

  // Filtrar e ordenar workouts quando os filtros mudarem
  useEffect(() => {
    let result = [...completedWorkouts];
    
    // Filtrar por texto de pesquisa
    if (searchTerm) {
      result = result.filter(workout => 
        workout.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (workout.notes && workout.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtrar por tipo de atividade
    if (activityTypeFilter !== 'todos') {
      result = result.filter(workout => workout.activityType === activityTypeFilter);
    }
    
    // Filtrar por mês
    if (monthFilter !== 'todos') {
      result = result.filter(workout => {
        try {
          if (!workout.date) return false;
          const date = parseISO(workout.date);
          if (!isValid(date)) return false;
          return `${date.getFullYear()}-${date.getMonth() + 1}` === monthFilter;
        } catch (error) {
          return false;
        }
      });
    }
    
    // Ordenar por data
    result.sort((a, b) => {
      try {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } catch (error) {
        return 0;
      }
    });
    
    setFilteredWorkouts(result);
  }, [completedWorkouts, searchTerm, activityTypeFilter, sortOrder, monthFilter]);

  // Reset de todos os filtros
  const resetFilters = () => {
    setSearchTerm('');
    setActivityTypeFilter('todos');
    setSortOrder('desc');
    setMonthFilter('todos');
  };

  const monthOptions = getMonthOptions();

  return (
    <Layout>
      <Head>
        <title>Histórico de Atividades - Magic Training</title>
        <meta
          name="description"
          content="Visualize e filtre todas as suas atividades registradas."
        />
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Histórico de Atividades</h1>
            <p className="text-muted-foreground">
              Visualize e analise todas as suas atividades registradas
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Link>
            </Button>
            
            <Button variant="default" size="sm" asChild>
              <Link href="/dashboard/log">
                <PlusCircle className="mr-2 h-4 w-4" />
                Registrar Treino
              </Link>
            </Button>
          </div>
        </div>

        {/* Estatísticas resumidas */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Atividades</p>
                  <p className="text-2xl font-bold">{totalActivities}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Distância Total</p>
                  <p className="text-2xl font-bold">{totalDistance.toFixed(1)} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Total</p>
                  <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-col space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Limpar</span>
                  </Button>
                )}
              </div>
              
              {/* Filtros em linha */}
              <div className="flex flex-wrap gap-3">
                {/* Filtro por tipo */}
                <div className="w-full sm:w-52">
                  <Select
                    value={activityTypeFilter}
                    onValueChange={setActivityTypeFilter}
                  >
                    <SelectTrigger>
                      <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Tipo de Atividade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Tipos</SelectItem>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="threshold">Limiar</SelectItem>
                      <SelectItem value="interval">Intervalo</SelectItem>
                      <SelectItem value="repetition">Repetição</SelectItem>
                      <SelectItem value="long">Longo</SelectItem>
                      <SelectItem value="recovery">Recuperação</SelectItem>
                      <SelectItem value="race">Competição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por mês */}
                <div className="w-full sm:w-52">
                  <Select
                    value={monthFilter}
                    onValueChange={setMonthFilter}
                  >
                    <SelectTrigger>
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Meses</SelectItem>
                      {monthOptions.map(month => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Ordenação */}
                <div className="w-full sm:w-52">
                  <Select
                    value={sortOrder}
                    onValueChange={setSortOrder}
                  >
                    <SelectTrigger>
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Ordenação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Mais Recentes</SelectItem>
                      <SelectItem value="asc">Mais Antigos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Botão de limpar filtros */}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={resetFilters}
                  disabled={!searchTerm && activityTypeFilter === 'todos' && monthFilter === 'todos' && sortOrder === 'desc'}
                  className="h-10 w-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredWorkouts.length} {filteredWorkouts.length === 1 ? 'atividade encontrada' : 'atividades encontradas'}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Atividades */}
        <div className="space-y-4">
          {filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout) => (
              <Card 
                key={workout._id?.toString() || `workout-${workout.date}-${workout.title}`} 
                className="overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-0">
                  <div className="flex">
                    <div className={`w-2 ${getActivityColor(workout.activityType)}`}></div>
                    <div className="p-4 flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/dashboard/activities/${workout._id}`}
                              className="transition-colors hover:text-primary"
                            >
                              <h3 className="text-lg font-medium">{workout.title}</h3>
                            </Link>
                            <Badge className={`${getActivityColor(workout.activityType)}`}>
                              {getActivityTypeName(workout.activityType)}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{safeFormatDate(workout.date, "d 'de' MMMM 'de' yyyy")}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              <span>{workout.distance.toFixed(2)} km</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDuration(workout.duration)}</span>
                            </div>
                            
                            {workout.pace && (
                              <div className="flex items-center gap-1">
                                <BarChart2 className="h-4 w-4" />
                                <span className="font-medium">{workout.pace}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {workout.planPath && activePlan && workout.planPath === activePlan.path && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              Plano: {activePlan.name}
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              asChild
                              className="h-8 px-2"
                            >
                              <Link href={`/dashboard/activities/${workout._id}`}>
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                Detalhes
                              </Link>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              asChild
                              className="h-8 px-2"
                            >
                              <Link href={`/dashboard/activities/edit/${workout._id}`}>
                               <Pencil className="h-3.5 w-3.5 mr-1" />
                                Editar
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {workout.notes && (
                        <>
                          <Separator className="my-3" />
                          <div className="text-sm">
                            <p className="italic text-muted-foreground">{workout.notes}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center p-8 border rounded-lg bg-muted/20">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                {totalActivities > 0 
                  ? 'Não encontramos atividades com os filtros atuais. Tente outros critérios de busca.' 
                  : 'Você ainda não registrou nenhum treino. Comece registrando seu primeiro treino.'}
              </p>
              {totalActivities > 0 ? (
                <Button onClick={resetFilters}>Limpar Filtros</Button>
              ) : (
                <Button asChild>
                  <Link href="/dashboard/log">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar Primeiro Treino
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ActivitiesPage;