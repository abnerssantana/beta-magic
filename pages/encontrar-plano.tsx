import React, { useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Info,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  Medal,
  HelpCircle
} from 'lucide-react';
import plans from '@/planos';
import { TrainingCard } from "@/components/PlansCard";

// Types for better type safety
interface TrainingTime {
  years: number;
  months: number;
}

interface FormData {
  trainingTime: TrainingTime;
  weeklyVolume: string;
  longestRace: string;
  targetDistance: string;
  usedPlan: string;
  planDuration: string;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  },
  exit: {
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  }
};

const FindPlanPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    trainingTime: { months: 0, years: 0 },
    weeklyVolume: '',
    longestRace: '',
    targetDistance: '',
    usedPlan: '',
    planDuration: ''
  });
  const [recommendedPlans, setRecommendedPlans] = useState<typeof plans>([]);
  const [error, setError] = useState('');

  // Tips for each step
  const stepTips = {
    1: "Conte todo o tempo que você já treinou, mesmo com pausas.",
    2: "Considere a média de quilômetros das últimas 4-6 semanas.",
    3: "Escolha a maior distância que você já completou em uma corrida ou treino.",
    4: "Selecione a distância que você deseja alcançar nos próximos meses.",
    5: "Indique se já seguiu um plano de treinamento estruturado anteriormente.",
    6: "Escolha por quanto tempo pode se dedicar a um plano de treinamento."
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string, value: string } }) => {
    const { name, value } = e.target;
    if (name === 'years' || name === 'months') {
      setFormData(prev => ({
        ...prev,
        trainingTime: {
          ...prev.trainingTime,
          [name]: Math.max(0, parseInt(value) || 0)
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return formData.trainingTime.years > 0 || formData.trainingTime.months > 0;
      case 2:
        return formData.weeklyVolume !== '' && parseInt(formData.weeklyVolume) >= 0;
      case 3:
        return formData.longestRace !== '';
      case 4:
        return formData.targetDistance !== '';
      case 5:
        return formData.usedPlan !== '';
      case 6:
        return formData.planDuration !== '';
      default:
        return true;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) {
      setError('Por favor, responda à pergunta antes de continuar.');
      return;
    }

    const totalMonths = formData.trainingTime.years * 12 + formData.trainingTime.months;
    const weeklyVolume = parseInt(formData.weeklyVolume);
    let userLevel = '';

    // More nuanced level determination
    if (totalMonths < 6 || weeklyVolume < 20) {
      userLevel = 'iniciante';
    } else if (totalMonths < 24 || weeklyVolume < 50) {
      userLevel = 'intermediário';
    } else if (totalMonths < 60 || weeklyVolume < 80) {
      userLevel = 'avançado';
    } else {
      userLevel = 'elite';
    }

    // Adjust level based on longest race and plan usage
    if (formData.longestRace === '10km' && userLevel === 'iniciante') {
      userLevel = 'intermediário';
    } else if (formData.longestRace === '21km') {
      if (userLevel === 'iniciante') userLevel = 'intermediário';
      if (userLevel === 'intermediário' && totalMonths >= 18) userLevel = 'avançado';
    } else if (formData.longestRace === '42km') {
      if (userLevel === 'iniciante') userLevel = 'intermediário';
      if (userLevel === 'intermediário') userLevel = 'avançado';
      if (userLevel === 'avançado' && totalMonths >= 48) userLevel = 'elite';
    }

    // Additional consideration for plan usage
    if (formData.usedPlan === 'sim') {
      if (userLevel === 'iniciante') userLevel = 'intermediário';
      if (userLevel === 'intermediário' && totalMonths >= 18) userLevel = 'avançado';
    }

    // Recommendation logic
    const recommended = plans.filter(plan => {
      // Level matching with more flexible progression
      const levelMatch = 
        plan.nivel === userLevel ||
        (userLevel === 'iniciante' && plan.nivel === 'intermediário') ||
        (userLevel === 'intermediário' && plan.nivel === 'avançado') ||
        (userLevel === 'avançado' && plan.nivel === 'elite') ||
        (userLevel === 'elite' && ['elite', 'avançado'].includes(plan.nivel));

      // Distance matching
      const distanceMatch = 
        !formData.targetDistance || 
        !plan.distances || 
        plan.distances.includes(formData.targetDistance);

      // Duration matching
      const planDurationWeeks = parseInt(plan.duration);
      const durationMatch = planDurationWeeks <= parseInt(formData.planDuration);

      // Volume matching
      const volumeMatch = 
        !plan.volume || 
        weeklyVolume >= parseInt(plan.volume);

      return levelMatch && distanceMatch && durationMatch && volumeMatch;
    });

    setRecommendedPlans(recommended);
    setStep(7);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Tempo de Treinamento</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stepTips[1]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>Há quanto tempo você treina corrida regularmente?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Anos</label>
                  <Input
                    type="number"
                    name="years"
                    min={0}
                    value={formData.trainingTime.years}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meses</label>
                  <Input
                    type="number"
                    name="months"
                    min={0}
                    value={formData.trainingTime.months}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Volume Semanal</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stepTips[2]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>Qual sua quilometragem média nas últimas semanas?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quilômetros por semana</label>
                <Input
                  type="number"
                  name="weeklyVolume"
                  min={0}
                  value={formData.weeklyVolume}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Maior Prova Completada</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stepTips[3]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>Qual a maior distância que você já completou?</CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={formData.longestRace}
                onValueChange={(value) => handleInputChange({ target: { name: 'longestRace', value }})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a distância" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5km">5km</SelectItem>
                  <SelectItem value="10km">10km</SelectItem>
                  <SelectItem value="21km">Meia Maratona (21km)</SelectItem>
                  <SelectItem value="42km">Maratona (42km)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Distância Alvo</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stepTips[4]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>Qual distância você quer treinar?</CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={formData.targetDistance}
                onValueChange={(value) => handleInputChange({ target: { name: 'targetDistance', value }})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a distância" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5km">5km</SelectItem>
                  <SelectItem value="10km">10km</SelectItem>
                  <SelectItem value="21km">Meia Maratona (21km)</SelectItem>
                  <SelectItem value="42km">Maratona (42km)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Experiência com Planilhas</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stepTips[5]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>Você já seguiu um plano de treinamento?</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                type="button"
                variant={formData.usedPlan === 'sim' ? 'default' : 'outline'}
                onClick={() => handleInputChange({ target: { name: 'usedPlan', value: 'sim' } })}
                className="flex-1"
              >
                Sim
              </Button>
              <Button
                type="button"
                variant={formData.usedPlan === 'nao' ? 'default' : 'outline'}
                onClick={() => handleInputChange({ target: { name: 'usedPlan', value: 'nao' } })}
                className="flex-1"
              >
                Não
              </Button>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Duração do Plano</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stepTips[6]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>Por quanto tempo você pode seguir um plano de treinamento?</CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={formData.planDuration}
                onValueChange={(value) => handleInputChange({ target: { name: 'planDuration', value }})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">Até 8 semanas</SelectItem>
                  <SelectItem value="12">Até 12 semanas</SelectItem>
                  <SelectItem value="16">Até 16 semanas</SelectItem>
                  <SelectItem value="20">Até 20 semanas</SelectItem>
                  <SelectItem value="24">Até 24 semanas</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <Head>
        <title>Encontre seu Plano Ideal - Magic Training</title>
        <meta 
          name="description" 
          content="Descubra o plano de treinamento perfeito para seu nível e objetivos com o Magic Training." 
        />
      </Head>

      <HeroLayout
        title="Encontre seu Plano Ideal"
        description="Responda algumas perguntas simples para descobrirmos o melhor plano de treinamento para você."
        
        info={
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <p className="text-sm text-primary/90">
                  Ajudaremos você a encontrar o plano mais adequado ao seu nível atual
                </p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-6">
          <AnimatePresence mode="sync">
            {step < 7 ? (
              <motion.div
                key="form"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={containerVariants}
                className="space-y-6"
              >
                {/* Progress Bar */}
                <div className="w-full bg-secondary/30 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / 6) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {renderStepContent()}

                {error && (
                  <div className="text-center">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                  {step > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                  )}
                  
                  {step < 6 ? (
                    <Button 
                      className="ml-auto gap-2"
                      onClick={() => validateStep() && setStep(step + 1)}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      className="ml-auto gap-2"
                    >
                      Encontrar Planos
                      <Medal className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-6"
              >
                {recommendedPlans.length > 0 ? (
                  <>
                    <Card className="bg-primary/5">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <CheckCircle2 className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="text-lg font-semibold">Planos Encontrados!</h3>
                            <p className="text-sm text-muted-foreground">
                              Encontramos {recommendedPlans.length} planos que combinam com seu perfil
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendedPlans.map((plan, index) => (
                        <TrainingCard key={index} plan={plan} />
                      ))}
                    </div>
                  </>
                ) : (
                  <Card className="bg-secondary/30">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4">
                        <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold mb-2">Nenhum plano encontrado</p>
                        <p className="text-muted-foreground">
                          Não encontramos planos que correspondam exatamente aos seus critérios.
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sugestões:
                        <ul className="list-disc list-inside mt-2">
                          <li>Tente ajustar alguns critérios</li>
                          <li>Considere planos próximos ao seu nível</li>
                          <li>Entre em contato para orientação personalizada</li>
                        </ul>
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        trainingTime: { months: 0, years: 0 },
                        weeklyVolume: '',
                        longestRace: '',
                        targetDistance: '',
                        usedPlan: '',
                        planDuration: ''
                      });
                      setStep(1);
                      setRecommendedPlans([]);
                      setError('');
                    }}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Recomeçar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </HeroLayout>
    </Layout>
  );
};

export default FindPlanPage;