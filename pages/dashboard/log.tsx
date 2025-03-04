import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
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
import { ArrowLeft, Clock, Calendar, BarChart2, Save, FileText, Activity, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TimeInput from '@/components/TimeInput';
import { PlanSummary } from '@/models';
import { getUserActivePlan } from '@/lib/user-utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface LogWorkoutPageProps {
  activePlan: PlanSummary | null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard/log',
        permanent: false,
      },
    };
  }

  try {
    const userId = session.user.id;
    const activePlan = await getUserActivePlan(userId);

    return {
      props: {
        activePlan: activePlan ? JSON.parse(JSON.stringify(activePlan)) : null,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar plano ativo:', error);
    return {
      props: {
        activePlan: null,
      },
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

const LogWorkoutPage: React.FC<LogWorkoutPageProps> = ({ activePlan }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [calculatedPace, setCalculatedPace] = useState('');

  // Inicializa o formulário com valores padrão
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      title: '',
      activityType: 'easy',
      distance: undefined,
      duration: '00:00:00',
      notes: '',
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
        planPath: activePlan?.path,
        source: 'manual',
      };
      
      // Envia para a API
      const response = await fetch('/api/user/workouts/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao registrar treino');
      }
      
      // Redireciona para o dashboard após sucesso
      router.push('/dashboard?success=workout-logged');
      
    } catch (error) {
      console.error('Erro ao registrar treino:', error);
      setSubmitError(error instanceof Error ? error.message : 'Erro ao registrar treino');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Registrar Treino - Magic Training</title>
        <meta
          name="description"
          content="Registre manualmente seus treinos realizados."
        />
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Registrar Treino</h1>
            <p className="text-muted-foreground">
              Registre seus treinos realizados manualmente
            </p>
          </div>
          
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Novo Treino</CardTitle>
            <CardDescription>
              Preencha os dados do seu treino realizado
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

                {/* Plano ativo */}
                {activePlan && (
                  <Alert className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300">
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      Este treino será vinculado ao plano "{activePlan.name}".
                    </AlertDescription>
                  </Alert>
                )}

                {/* Botões de ação */}
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
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
                        Salvar Treino
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

export default LogWorkoutPage;