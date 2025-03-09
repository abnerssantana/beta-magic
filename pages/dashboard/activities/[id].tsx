import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Activity,
  Calendar,
  Clock,
  BarChart2,
  MapPin,
  FileText,
  Trash2,
  Pencil,
  AlertTriangle,
  ChevronLeft,
  Link2
} from "lucide-react";
import { WorkoutLog } from '@/models/userProfile';
import { PlanSummary } from '@/models';
import { getUserActivePlan } from '@/lib/user-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface WorkoutDetailProps {
  workout: WorkoutLog;
  activePlan: PlanSummary | null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const { id } = context.params || {};

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard/activities',
        permanent: false,
      },
    };
  }

  if (!id) {
    return {
      notFound: true,
    };
  }

  try {
    const userId = session.user.id;

    // Buscar o plano ativo do usuário
    const activePlan = await getUserActivePlan(userId);

    // Buscar o treino específico
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/workouts/${id}`, {
      headers: {
        cookie: context.req.headers.cookie || '',
      },
    });

    if (!res.ok) {
      return {
        notFound: true,
      };
    }

    const workout = await res.json();

    // Verificar se o treino pertence ao usuário atual
    if (workout.userId !== userId) {
      return {
        redirect: {
          destination: '/dashboard/activities',
          permanent: false,
        },
      };
    }

    return {
      props: {
        workout: JSON.parse(JSON.stringify(workout)),
        activePlan: activePlan ? JSON.parse(JSON.stringify(activePlan)) : null,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do treino:', error);
    return {
      notFound: true,
    };
  }
};

const WorkoutDetail: React.FC<WorkoutDetailProps> = ({ workout, activePlan }) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Função para formatar a data com segurança
  const formatWorkoutDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return "Data inválida";
      }
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

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
      'race': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
      'long': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
    };

    return types[type] || 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
  };

  // Mapear tipo de atividade para nome legível
  const getActivityTypeName = (type: string): string => {
    const types: Record<string, string> = {
      'easy': 'Corrida Fácil',
      'recovery': 'Recuperação',
      'threshold': 'Limiar',
      'interval': 'Intervalo',
      'repetition': 'Repetição',
      'race': 'Competição',
      'long': 'Corrida Longa',
      'other': 'Outro'
    };

    return types[type] || type;
  };

  // Função para deletar o treino
  const handleDeleteWorkout = async () => {
    if (!workout._id) {
      toast.error("ID do treino não encontrado");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/user/workouts/${workout._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir treino');
      }

      toast.success("Treino excluído com sucesso");

      // Redirecionar para a página de atividades
      router.push('/dashboard/activities');
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir treino');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Formatar a data de forma segura para outros locais onde parseISO é usado
  const safeFormatDate = (dateString: string, formatStr: string, options = { locale: ptBR }): string => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return "Data inválida";
      }
      return format(date, formatStr, options);
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString);
      return "Data inválida";
    }
  };

  return (
    <Layout>
      <Head>
        <title>{workout.title} - Detalhes do Treino - Magic Training</title>
        <meta
          name="description"
          content="Detalhes completos da atividade de treino."
        />
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{workout.title}</h1>
            <p className="text-muted-foreground">
              Detalhes do treino registrado em {formatWorkoutDate(workout.date)}
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/activities">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Histórico
            </Link>
          </Button>
        </div>

        {/* Cartão principal com detalhes do treino */}
        <Card className="overflow-hidden">
          <div className={`h-2 ${getActivityColor(workout.activityType)}`}></div>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className={`h-5 w-5 ${getActivityColor(workout.activityType).split(' ')[1]}`} />
                Detalhes da Atividade
              </CardTitle>
              <Badge className={`${getActivityColor(workout.activityType)}`}>
                {getActivityTypeName(workout.activityType)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Métricas principais em cartões */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-muted/30">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <Calendar className="h-5 w-5 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-base font-medium text-center">
                    {safeFormatDate(workout.date, "dd/MM/yyyy")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <Activity className="h-5 w-5 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Distância</p>
                  <p className="text-lg font-bold">{workout.distance.toFixed(2)} km</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="text-lg font-bold">{formatDuration(workout.duration)}</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <BarChart2 className="h-5 w-5 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Ritmo Médio</p>
                  <p className="text-lg font-bold">{workout.pace || "N/A"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Informações adicionais */}
            {(workout.notes || workout.planPath) && (
              <>
                <Separator />
                <div className="space-y-4">
                  {workout.notes && (
                    <div>
                      <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Notas
                      </h3>
                      <div className="bg-muted/20 p-4 rounded-lg border border-border/50">
                        <p className="text-muted-foreground whitespace-pre-line">{workout.notes}</p>
                      </div>
                    </div>
                  )}
                  {workout.planPath && (
                    <div>
                      <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Plano Relacionado
                      </h3>
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {activePlan ? activePlan.name : workout.planPath}
                            </p>
                            {workout.planDayIndex !== undefined && (
                              <p className="text-sm text-muted-foreground mt-1">
                                <Link2 className="inline-block mr-1.5 h-3.5 w-3.5 text-primary" />
                                Vinculado ao dia {workout.planDayIndex + 1} do plano
                              </p>
                            )}
                          </div>
                          {activePlan ? (
                            <Button variant="outline" size="sm" asChild className="h-8 text-xs border-primary/20">
                              <Link href={`/plano/${activePlan.path}`}>
                                Ver Plano
                                <ChevronLeft className="ml-1.5 h-3.5 w-3.5 rotate-180" />
                              </Link>
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled className="h-8 text-xs">
                              Plano não disponível
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Informações técnicas */}
            <div className="bg-muted/10 p-3 rounded-lg">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Registrado via:</span> {workout.source === 'manual' ? 'Registro manual' : workout.source}
                </div>
                <div>
                  <span className="font-medium">Data de registro:</span> {format(new Date(workout.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
                {workout.createdAt !== workout.updatedAt && (
                  <div>
                    <span className="font-medium">Última atualização:</span> {format(new Date(workout.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 flex flex-wrap justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-primary/20 hover:bg-primary/5"
            >
              <Link href={`/dashboard/activities/edit/${workout._id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="bg-red-500/90 hover:bg-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o treino <span className="font-medium">{workout.title}</span> de {safeFormatDate(workout.date, "dd/MM/yyyy")}.
              <br /><br />
              Esta ação não pode ser desfeita e os dados serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteWorkout();
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default WorkoutDetail;