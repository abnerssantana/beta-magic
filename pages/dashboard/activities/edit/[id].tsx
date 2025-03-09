import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  Clock,
  BarChart2,
  Save,
  FileText,
  Activity,
  AlertCircle,
  InfoIcon
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TimeInput from '@/components/TimeInput';
import { WorkoutLog } from '@/models/userProfile';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

interface EditWorkoutPageProps {
  workout: WorkoutLog;
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
      },
    };
  } catch (error) {
    console.error('Erro ao buscar treino para edição:', error);
    return {
      notFound: true,
    };
  }
};

// Schema para validação do formulário
const workoutFormSchema = z.object({
  date: z.string().nonempty("A data é obrigatória"),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  activityType: z.string().nonempty("Selecione um tipo de atividade"),
  distance: z.coerce.number().positive("A distância deve ser maior que zero"),
  duration: z.string().min(5, "Duração inválida"),
  notes: z.string().optional(),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

const EditWorkoutPage: React.FC<EditWorkoutPageProps> = ({ workout }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [calculatedPace, setCalculatedPace] = useState(workout.pace || '');

  // Função para extrair e exibir o ritmo médio de um range
  const getAveragePaceFromRange = (paceStr: string): string => {
    if (!paceStr) return '';
    
    // Remover sufixo "/km" se existir
    const cleanPaceStr = paceStr.replace(/\/km$/, '').trim();
    
    // Verificar se o ritmo está em formato de range
    if (cleanPaceStr.includes('-')) {
      const [minPace, maxPace] = cleanPaceStr.split('-').map(p => p.trim());
      
      // Converter para segundos
      const minParts = minPace.split(':').map(Number);
      const maxParts = maxPace.split(':').map(Number);
      
      const minSeconds = minParts[0] * 60 + (minParts[1] || 0);
      const maxSeconds = maxParts[0] * 60 + (maxParts[1] || 0);
      
      // Calcular média
      const avgSeconds = (minSeconds + maxSeconds) / 2;
      const avgMinutes = Math.floor(avgSeconds / 60);
      const avgSecondsRemainder = Math.round(avgSeconds % 60);
      
      // Retornar no formato MM:SS
      return `${avgMinutes}:${avgSecondsRemainder.toString().padStart(2, '0')}`;
    }
    
    // Se não for range, retorna o original
    return cleanPaceStr;
  };

  // Converter a duração de minutos para formato HH:MM:SS para o formulário
  const formatDurationForInput = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes % 1) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Inicializa o formulário com valores do treino
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      date: workout.date,
      title: workout.title,
      activityType: workout.activityType,
      distance: workout.distance,
      duration: formatDurationForInput(workout.duration),
      notes: workout.notes || '',
    },
  });

  // Calcula o ritmo quando distância ou duração mudam
  const calculatePace = (distance: number, durationStr: string) => {
    if (!distance || !durationStr) {
      setCalculatedPace('');
      return;
    }

    try {
      // Converte a duração (hh:mm:ss) para minutos
      const [hours = 0, minutes = 0, seconds = 0] = durationStr.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + seconds / 60;
      
      // Calcula o ritmo em min/km
      const paceMinutes = totalMinutes / distance;
      const paceMinutesInt = Math.floor(paceMinutes);
      const paceSeconds = Math.round((paceMinutes - paceMinutesInt) * 60);
      
      setCalculatedPace(`${paceMinutesInt}:${paceSeconds.toString().padStart(2, '0')}/km`);
    } catch (error) {
      console.error('Erro ao calcular ritmo:', error);
      setCalculatedPace('');
    }
  };

  // Observa mudanças nos campos relevantes para atualizar o ritmo
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'distance' || name === 'duration') {
        calculatePace(value.distance as number, value.duration as string);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Submete o formulário
  const onSubmit = async (data: WorkoutFormValues) => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Converte a duração (hh:mm:ss) para minutos
      const [hours = 0, minutes = 0, seconds = 0] = data.duration.split(':').map(Number);
      const durationInMinutes = hours * 60 + minutes + seconds / 60;
      
      // Prepara os dados para envio
      const workoutData = {
        date: data.date,
        title: data.title,
        activityType: data.activityType,
        distance: data.distance,
        duration: durationInMinutes,
        pace: calculatedPace,
        notes: data.notes,
      };
      
      // Envia para a API
      const response = await fetch(`/api/user/workouts/${workout._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar treino');
      }
      
      toast.success("Treino atualizado com sucesso");
      
      // Redirecionar para a página de detalhes do treino
      router.push(`/dashboard/activities/${workout._id}`);
      
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      setSubmitError(error instanceof Error ? error.message : 'Erro ao atualizar treino');
      toast.error("Falha ao atualizar treino");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Editar Treino - Magic Training</title>
        <meta
          name="description"
          content="Edite os detalhes de um treino registrado."
        />
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Treino</h1>
            <p className="text-muted-foreground">
              Modifique as informações do treino registrado
            </p>
          </div>
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/activities/${workout._id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar aos Detalhes
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Editar Treino</CardTitle>
            <CardDescription>
              Atualize as informações do treino registrado em {format(parseISO(workout.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data do treino */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Treino</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="date" 
                              {...field} 
                              className="pl-10" 
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tipo de Atividade */}
                  <FormField
                    control={form.control}
                    name="activityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Atividade</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="pl-10">
                              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Corrida Fácil</SelectItem>
                              <SelectItem value="threshold">Limiar</SelectItem>
                              <SelectItem value="interval">Intervalado</SelectItem>
                              <SelectItem value="repetition">Repetições</SelectItem>
                              <SelectItem value="long">Longo</SelectItem>
                              <SelectItem value="recovery">Recuperação</SelectItem>
                              <SelectItem value="race">Competição</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Título do Treino */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Treino</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Ex: Corrida Fácil no Parque" 
                            {...field} 
                            className="pl-10" 
                          />
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Um título descritivo para seu treino
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Distância */}
                  <FormField
                    control={form.control}
                    name="distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distância (km)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="10.0" 
                              {...field}
                              onChange={e => {
                                field.onChange(e);
                                calculatePace(parseFloat(e.target.value), form.getValues('duration'));
                              }}
                              className="pl-10" 
                            />
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Duração */}
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração (hh:mm:ss)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <TimeInput
                              value={field.value}
                              onChange={(value) => {
                                field.onChange(value);
                                calculatePace(form.getValues('distance'), value);
                              }}
                              showHours={true}
                              className="pl-10"
                            />
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mostrar o ritmo calculado */}
                {calculatedPace && (
    <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-md">
      <BarChart2 className="h-5 w-5 text-primary" />
      <div>
        <p className="font-medium">Ritmo Calculado</p>
        <p className="text-lg font-bold">{calculatedPace}</p>
        {calculatedPace.includes('-') && (
          <p className="text-sm text-muted-foreground">
            Média: {getAveragePaceFromRange(calculatedPace)}/km
          </p>
        )}
      </div>
    </div>
  )}

                {/* Notas */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Adicione observações sobre o treino..." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Anote suas sensações, condições climáticas ou outros detalhes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Erro de submissão */}
                {submitError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {submitError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Nota sobre plano */}
                {workout.planPath && (
                  <Alert className="bg-primary/10 border-primary/20 text-primary">
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      Este treino está associado ao plano "{workout.planPath}". A associação será mantida.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Botões de ação */}
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => router.push(`/dashboard/activities/${workout._id}`)}
                  >
                    Cancelar
                  </Button>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditWorkoutPage;