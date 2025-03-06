// pages/plano-trainingpeaks/[planPath].tsx
import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { GetStaticPaths, GetStaticProps } from 'next';
import { Layout } from "@/components/layout";
import { HeroLayout } from "@/components/default/HeroLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Timer, 
  Activity, 
  Info, 
  Tag, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPlanByPath, getAllPlanPaths } from "@/lib/db-utils";
import { PlanModel } from "@/models";
import { TrainingPeaksConverter } from "@/components/trainingpeaks/Converter";

interface TPPlanPageProps {
  plan: PlanModel;
}

// Mapeamento dos tipos de atividade para zonas do TrainingPeaks
const activityToZoneMap = {
    'easy': { zone: 'Z2', name: 'Fácil', percent: '60-76%' },
    'recovery': { zone: 'Z1', name: 'Recuperação', percent: '76-85%' },
    'threshold': { zone: 'Z4', name: 'Limiar', percent: '85-95%' },
    'interval': { zone: 'Z5a', name: 'VO2max', percent: '95-105%' },
    'repetition': { zone: 'Z5b', name: 'Anaeróbico', percent: '85-89%' },
    'race': { zone: 'Z4', name: 'Limiar', percent: '98-102%' },
    'marathon': { zone: 'Z3', name: 'Moderado', percent: '106-113%' },
    'long': { zone: 'Z2', name: 'Fácil', percent: '114-129%' }
  };

// Obter a zona do TrainingPeaks para uma atividade
const getTPZone = (activityType: string) => {
    return activityToZoneMap[activityType] || { zone: 'Off', name: '', percent: 'Sem ritmo' };
  };
  
  // Obter a cor da badge baseada na zona
  const getZoneColor = (zone: string) => {
    const colors = {
      'Z1': 'bg-blue-500/10 text-blue-600 border-blue-200',
      'Z2': 'bg-green-500/10 text-green-600 border-green-200',
      'Z3': 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      'Z4': 'bg-orange-500/10 text-orange-600 border-orange-200',
      'Z5a': 'bg-red-500/10 text-red-600 border-red-200',
      'Z5b': 'bg-purple-500/10 text-purple-600 border-purple-200',
      'Z5c': 'bg-pink-500/10 text-pink-600 border-pink-200',
      'off': 'bg-black text-white border-black'
    };
    return colors[zone] || colors['off'];
  };

const TrainingPeaksPlanPage: React.FC<TPPlanPageProps> = ({ plan }) => {
  const [thresholdPace, setThresholdPace] = useState("4:00");
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Organizar treinos por semanas
  const weeklyWorkouts = useMemo(() => {
    const result: { weekNumber: number; days: any[] }[] = [];
    let currentWeek: { weekNumber: number; days: any[] } = { weekNumber: 1, days: [] };
    
    plan.dailyWorkouts.forEach((workout, index) => {
      currentWeek.days.push(workout);
      
      if ((index + 1) % 7 === 0) {
        result.push(currentWeek);
        currentWeek = { weekNumber: result.length + 1, days: [] };
      }
    });
    
    // Adicionar a última semana se não estiver completa
    if (currentWeek.days.length > 0) {
      result.push(currentWeek);
    }
    
    return result;
  }, [plan.dailyWorkouts]);

  return (
    <Layout>
      <Head>
        <title>{`${plan.name} (TrainingPeaks) - Magic Training`}</title>
        <meta name="description" content={`Formato TrainingPeaks para o plano ${plan.name}`} />
      </Head>

      <HeroLayout
        title={`${plan.name} - Formato TrainingPeaks`}
        description="Visualize e adapte seu plano para o formato de zonas do TrainingPeaks baseado em porcentagens do limiar"
        info={
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <p className="text-sm text-primary/90">
                  Os ritmos de treino estão convertidos para as zonas do TrainingPeaks, facilitando
                  a adaptação do plano para a plataforma.
                </p>
              </div>
            </CardContent>
          </Card>
        }
      >
        {/* Informações do plano */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Informações do Plano</span>
              <Badge variant="outline">{plan.nivel}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Duração</p>
                  <p className="text-sm">{plan.duration || 'Não especificado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Treinador</p>
                  <p className="text-sm">{plan.coach}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Volume</p>
                  <p className="text-sm">{plan.volume ? `${plan.volume} km/semana` : 'Variável'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {plan.distances?.map((distance, index) => (
                <Badge key={index} variant="secondary">
                  {distance}
                </Badge>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{plan.info}</p>
              
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/plano/${plan.path}`} target="_blank" rel="noopener noreferrer">
                    Ver plano original
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversor de Ritmo do Limiar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Configuração de Limiar</span>
              <div className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => setShowInstructions(!showInstructions)}
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Mostrar/esconder instruções
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showInstructions && (
              <div className="bg-muted/30 p-4 rounded-lg mb-4 space-y-2">
                <p className="text-sm font-medium">Como usar este conversor:</p>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Insira seu ritmo de limiar atual no formato min:seg por km</li>
                  <li>As zonas de treino serão calculadas automaticamente</li>
                  <li>Use estas zonas ao criar o plano no TrainingPeaks</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  O ritmo de limiar (threshold) é o ritmo que você consegue manter em um esforço máximo de aproximadamente 1 hora.
                  Para muitos corredores, está próximo do ritmo de 10K ou um pouco mais lento.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="threshold">Seu Ritmo de Limiar</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="threshold"
                    type="text"
                    value={thresholdPace}
                    onChange={(e) => setThresholdPace(e.target.value)}
                    placeholder="4:00"
                    className="pl-3 pr-12"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-sm text-muted-foreground">/km</span>
                  </div>
                </div>
              </div>
            </div>
            
            <TrainingPeaksConverter thresholdPace={thresholdPace} />
          </CardContent>
        </Card>

        {/* Plano por Semanas */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Plano de Treinamento (Formato TrainingPeaks)</h2>
          
          <Accordion type="single" collapsible className="w-full">
            {weeklyWorkouts.map((week, weekIndex) => (
              <AccordionItem key={weekIndex} value={`week-${week.weekNumber}`}>
                <AccordionTrigger className="hover:bg-muted/30 px-4 py-3 rounded-lg">
                  <span className="font-medium">Semana {week.weekNumber}</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4">
                  <div className="grid gap-3">
                    {week.days.map((day, dayIndex) => (
                      <div key={dayIndex} className="border rounded-lg p-3 bg-muted/20">
                        <div className="font-medium mb-2">
                          Dia {weekIndex * 7 + dayIndex + 1}
                        </div>
                        
                        {day.note && (
                          <p className="text-sm text-muted-foreground mb-2">{day.note}</p>
                        )}
                        
                        <div className="space-y-3">
                          {day.activities.map((activity, actIndex) => {
                            const tpZone = getTPZone(activity.type);
                            return (
                              <div key={actIndex} className="bg-background p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={getZoneColor(tpZone.zone)}>
                                      {tpZone.zone} ({tpZone.percent})
                                    </Badge>
                                    <span className="font-medium">{tpZone.name}</span>
                                  </div>
                                  <div className="text-sm">
                                    {activity.distance} {activity.units}
                                  </div>
                                </div>
                                
                                {activity.note && (
                                  <p className="text-sm mb-2">{activity.note}</p>
                                )}
                                
                                {activity.workouts && activity.workouts.length > 0 && (
                                  <div className="space-y-2 mt-2">
                                    {activity.workouts.map((workout, wIndex) => (
                                      <div key={wIndex} className="bg-muted/30 p-2 rounded">
                                        {workout.note && (
                                          <p className="text-xs mb-2">{workout.note}</p>
                                        )}
                                        
                                        {workout.series && workout.series.length > 0 && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {workout.series.map((serie, sIndex) => {
                                              // Determinar a zona com base no tipo de treino
                                              let serieZone = tpZone.zone;
                                              if (activity.type === 'interval') serieZone = 'Z5a';
                                              if (activity.type === 'repetition') serieZone = 'Z5b';
                                              if (activity.type === 'threshold') serieZone = 'Z4';
                                              
                                              return (
                                                <div 
                                                  key={sIndex} 
                                                  className="bg-muted/50 p-2 rounded text-xs"
                                                >
                                                  <div className="flex items-center gap-1 mb-1">
                                                    <Badge 
                                                      variant="outline" 
                                                      className={`${getZoneColor(serieZone)} text-xs px-1 py-0`}
                                                    >
                                                      {serieZone}
                                                    </Badge>
                                                    <span className="font-medium">{serie.sets}</span>
                                                  </div>
                                                  <div className="flex items-center justify-between">
                                                    <span>
                                                      {serie.work}
                                                      {serie.distance && ` (${serie.distance})`}
                                                    </span>
                                                    {serie.rest && (
                                                      <span className="text-muted-foreground">
                                                        / {serie.rest}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </HeroLayout>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const paths = await getAllPlanPaths().then(paths => {
      return paths.map(path => ({
        params: { planPath: path }
      }));
    });
    
    return {
      paths,
      fallback: 'blocking'
    };
  } catch (error) {
    console.error('Erro ao gerar paths para planos TrainingPeaks:', error);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps<TPPlanPageProps> = async ({ params }) => {
  try {
    const plan = await getPlanByPath(params?.planPath as string);
    
    if (!plan) {
      return { notFound: true };
    }
    
    return {
      props: {
        plan: JSON.parse(JSON.stringify(plan))
      },
      revalidate: 3600 // Revalidar a cada hora
    };
  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    return { notFound: true };
  }
};

export default TrainingPeaksPlanPage;