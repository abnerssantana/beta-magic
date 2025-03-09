import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { ArrowLeft, Clock, Calendar, BarChart2, Save, FileText, Activity, AlertCircle, Timer, Ruler } from 'lucide-react';
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

// Schema modificado para validação do formulário
const workoutFormSchema = z.object({
  date: z.string().nonempty("A data é obrigatória"),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  activityType: z.string().nonempty("Selecione um tipo de atividade"),
  workoutType: z.enum(["distance", "time"]),
  distance: z.coerce.number().optional(),
  duration: z.string().min(5, "Duração inválida"),
  pace: z.string().optional(),
  notes: z.string().optional(),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

const LogWorkoutPage: React.FC<LogWorkoutPageProps> = ({ activePlan }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  
  // Extrair parâmetros da query para pré-preenchimento
  const { 
    date: queryDate, 
    planPath: queryPlanPath, 
    planDayIndex: queryPlanDayIndex,
    activityType: queryActivityType,
    distance: queryDistance,
    units: queryUnits,
    pace: queryPace,
    title: queryTitle
  } = router.query;

  // Determinar o tipo de treino baseado nas unidades
  const defaultWorkoutType = queryUnits === 'min' ? 'time' : 'distance';

  // Inicializa o formulário com valores padrão ou valores da query
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      date: typeof queryDate === 'string' ? queryDate : format(new Date(), 'yyyy-MM-dd'),
      title: typeof queryTitle === 'string' ? queryTitle : '',
      activityType: typeof queryActivityType === 'string' ? queryActivityType : 'easy',
      workoutType: defaultWorkoutType,
      distance: typeof queryDistance === 'string' && queryUnits !== 'min' ? parseFloat(queryDistance) : undefined,
      duration: typeof queryDistance === 'string' && queryUnits === 'min' 
        ? formatMinutesToTime(parseFloat(queryDistance)) 
        : '00:00:00',
      pace: typeof queryPace === 'string' ? queryPace : '',
      notes: '',
    },
  });

  // Função para formatar minutos como HH:MM:SS
  function formatMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  // Observar mudanças no tipo de treino e outros campos
  const workoutType = form.watch("workoutType");
  const duration = form.watch("duration");
  const pace = form.watch("pace");

  // Função para calcular ritmo a partir de distância e duração
  const calculatePace = (distance?: number, durationStr?: string) => {
    if (!distance || !durationStr || distance <= 0) {
      return '';
    }
  
    try {
      // Converte a duração (hh:mm:ss) para minutos
      const [hours = 0, minutes = 0, seconds = 0] = durationStr.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + seconds / 60;
      
      if (totalMinutes <= 0) return '';
      
      // Calcula o ritmo em min/km
      const paceMinutes = totalMinutes / distance;
      const paceMinutesInt = Math.floor(paceMinutes);
      const paceSeconds = Math.round((paceMinutes - paceMinutesInt) * 60);
      
      // Formata o ritmo como MM:SS
      return `${paceMinutesInt}:${paceSeconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Erro ao calcular ritmo:', error);
      return '';
    }
  };

  // Função para calcular distância a partir de duração e ritmo
  const calculateDistance = (durationStr?: string, paceStr?: string) => {
    if (!durationStr || !paceStr) {
      setCalculatedDistance(null);
      return;
    }
  
    try {
      // Converter duração para minutos
      const [durationHours = 0, durationMinutes = 0, durationSeconds = 0] = durationStr.split(':').map(Number);
      const totalDurationMinutes = durationHours * 60 + durationMinutes + durationSeconds / 60;
  
      // Remover sufixo "/km" se existir
      const cleanPaceStr = paceStr.replace(/\/km$/, '').trim();
      
      // Verificar se o ritmo está em formato de range (contém hífen)
      const isRangeFormat = cleanPaceStr.includes('-');
      
      let totalPaceMinutes: number;
      
      if (isRangeFormat) {
        // Se for um range, calcular a média dos dois valores
        const [minPace, maxPace] = cleanPaceStr.split('-').map(p => p.trim());
        
        // Converter o ritmo mínimo para minutos
        const [minMinutes = 0, minSeconds = 0] = minPace.split(':').map(Number);
        const minPaceMinutes = minMinutes + minSeconds / 60;
        
        // Converter o ritmo máximo para minutos
        const [maxMinutes = 0, maxSeconds = 0] = maxPace.split(':').map(Number);
        const maxPaceMinutes = maxMinutes + maxSeconds / 60;
        
        // Usar a média dos dois valores
        totalPaceMinutes = (minPaceMinutes + maxPaceMinutes) / 2;
      } else {
        // Ritmo simples (não é um range)
        const [paceMinutes = 0, paceSeconds = 0] = cleanPaceStr.split(':').map(Number);
        totalPaceMinutes = paceMinutes + paceSeconds / 60;
      }
  
      if (totalPaceMinutes <= 0) {
        setCalculatedDistance(null);
        return;
      }
  
      // Calcular distância em km
      const distanceInKm = totalDurationMinutes / totalPaceMinutes;
      setCalculatedDistance(Math.round(distanceInKm * 100) / 100); // Arredondar para 2 casas decimais
    } catch (error) {
      console.error('Erro ao calcular distância:', error);
      setCalculatedDistance(null);
    }
  };

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

  // Atualizar ritmo quando distância ou duração mudam (para treinos baseados em distância)
  useEffect(() => {
    if (workoutType === 'distance') {
      const distance = form.getValues('distance');
      if (distance) {
        const newPace = calculatePace(distance, duration);
        if (newPace) {
          form.setValue('pace', newPace);
        }
      }
    }
  }, [form, workoutType, duration]);

  // Atualizar distância calculada quando ritmo ou duração mudam (para treinos baseados em tempo)
  useEffect(() => {
    if (workoutType === 'time') {
      calculateDistance(duration, pace);
    } else {
      setCalculatedDistance(null);
    }
  }, [workoutType, duration, pace]);

  // Submete o formulário
  const onSubmit = async (data: WorkoutFormValues) => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Converte a duração (hh:mm:ss) para minutos
      const [hours = 0, minutes = 0, seconds = 0] = data.duration.split(':').map(Number);
      const durationInMinutes = hours * 60 + minutes + seconds / 60;
      
      // Prepara os dados para envio
      const workoutData: any = {
        date: data.date,
        title: data.title,
        activityType: data.activityType,
        duration: durationInMinutes,
        notes: data.notes,
        planPath: (queryPlanPath as string) || activePlan?.path,
        planDayIndex: queryPlanDayIndex ? parseInt(queryPlanDayIndex as string) : undefined,
        source: 'manual',
      };

      // Adicionar distância e ritmo com base no tipo de treino
      if (data.workoutType === 'distance') {
        // Para treinos baseados em distância, usamos a distância inserida
        workoutData.distance = data.distance;
        workoutData.pace = data.pace;
      } else {
        // Para treinos baseados em tempo, usamos a distância calculada
        workoutData.distance = calculatedDistance || 0;
        workoutData.pace = data.pace;
      }
      
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

  // Formatar ritmo para exibição
  const formatPace = (pace: string): string => {
    if (!pace) return '';
    return pace.endsWith('/km') ? pace : `${pace}/km`;
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
                              <SelectItem value="walk">Caminhada</SelectItem>
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

                {/* Tipo de treino (baseado em distância ou tempo) */}
                <FormField
                  control={form.control}
                  name="workoutType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Medição</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="distance" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2">
                              <Ruler className="h-4 w-4 text-muted-foreground" />
                              Baseado em Distância (km)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="time" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2">
                              <Timer className="h-4 w-4 text-muted-foreground" />
                              Baseado em Tempo (minutos)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Escolha se seu treino é baseado em distância (km) ou tempo (minutos)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tempo / Duração */}
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
                              onChange={field.onChange}
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

                  {/* Campo de Ritmo (usado para ambos os tipos de treino) */}
                  <FormField
                    control={form.control}
                    name="pace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ritmo Médio (min:seg/km)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="4:30" 
                              {...field}
                              className="pl-10" 
                            />
                            <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {workoutType === 'time' ? 'Usado para calcular a distância' : 'Calculado automaticamente da distância e duração'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Distância (apenas para treinos baseados em distância) */}
                {workoutType === 'distance' ? (
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
                              className="pl-10" 
                            />
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  // Para treinos baseados em tempo, mostrar a distância calculada
                  calculatedDistance !== null && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-md">
                      <Activity className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Distância Calculada</p>
                        <p className="text-lg font-bold">{calculatedDistance.toFixed(2)} km</p>
                      </div>
                    </div>
                  )
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
                {(activePlan || queryPlanPath) && (
                  <Alert className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300">
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      Este treino será vinculado ao plano "{queryPlanPath ? `via link de treino` : activePlan?.name}".
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