import React from 'react';
import Link from 'next/link';
import { differenceInDays, format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { 
  User2, 
  Settings,
  BarChart2,
  TrendingUp,
  ChevronRight,
  PlayCircle,
  Calendar,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PlanSummary } from '@/models';

interface EnhancedActivePlanCardProps {
  activePlan: PlanSummary | null;
  weekProgress: number;
  startDate?: string;  // Data de início do plano (da configuração do usuário)
  isAuthenticated?: boolean;
}

// Função para converter o nome do treinador em um slug URL-friendly
const createTrainerSlug = (coachName: string): string => {
  return coachName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '-')      // Substitui caracteres especiais por hífens
    .replace(/-+/g, '-')             // Remove hifens consecutivos
    .replace(/^-|-$/g, '');          // Remove hifens no início e fim
};

export const EnhancedActivePlanCard: React.FC<EnhancedActivePlanCardProps> = ({ 
  activePlan, 
  weekProgress, 
  startDate, 
  isAuthenticated = false 
}) => {
  if (!activePlan) {
    return (
      <Card className="overflow-hidden border-border/50">
        <CardHeader className="bg-muted/20 p-3">
          <CardTitle className="text-sm">Plano de Treino Ativo</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="rounded-full bg-muted p-2 mb-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-2">Nenhum plano ativo</h3>
            <p className="text-xs text-muted-foreground max-w-md mb-3">
              Selecione um plano para começar a acompanhar seu progresso.
            </p>
            <Button asChild size="sm" className="h-8 text-xs">
              <Link href="/dashboard/plans">
                Escolher um Plano
                <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Criar o slug do treinador a partir do nome
  const trainerSlug = createTrainerSlug(activePlan.coach);
  
  // Configurar datas e progresso
  const today = new Date();
  const planStartDate = startDate ? parseISO(startDate) : today;
  
  // Calcular duração total em dias (parse do formato "X semanas" ou usar valor padrão de 12 semanas)
  let durationInDays = 84; // Padrão de 12 semanas
  if (activePlan.duration) {
    const durationMatch = activePlan.duration.match(/(\d+)\s*semanas?/i);
    if (durationMatch && durationMatch[1]) {
      durationInDays = parseInt(durationMatch[1]) * 7;
    }
  }
  
  // Calcular a data de término
  const endDate = addDays(planStartDate, durationInDays);
  
  // Calcular dias completados e restantes
  const daysCompleted = Math.max(0, differenceInDays(today, planStartDate));
  const daysRemaining = Math.max(0, differenceInDays(endDate, today));
  
  // Calcular porcentagem de progresso do plano
  const planProgress = Math.min(Math.round((daysCompleted / durationInDays) * 100), 100);
  
  // Formatar datas para exibição
  const formattedStartDate = format(planStartDate, "dd 'de' MMMM", { locale: ptBR });
  const formattedEndDate = format(endDate, "dd 'de' MMMM", { locale: ptBR });

  return (
    <Card className="overflow-hidden border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground/90">{activePlan.name}</CardTitle>
          {activePlan.isNew && (
            <Badge variant="destructive" className="text-xs">Novo</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Informações do plano e progresso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Coluna de informações */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={`/treinadores/${trainerSlug}`}
                className="flex items-center text-primary/80 hover:text-primary transition-colors"
              >
                <User2 className="mr-1.5 h-4 w-4" />
                {activePlan.coach}
              </Link>
              <div className="flex items-center text-muted-foreground/90">
                <TrendingUp className="mr-1.5 h-4 w-4" />
                {activePlan.nivel}
              </div>
              <div className="flex items-center text-muted-foreground/90">
                <Calendar className="mr-1.5 h-4 w-4" />
                {activePlan.duration}
              </div>
              <div className="flex items-center text-muted-foreground/90">
                <BarChart2 className="mr-1.5 h-4 w-4" />
                {activePlan.volume} km/sem
              </div>
            </div>
            
            <Separator className="my-2" />
            
            {/* Período do plano */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  <span>Início</span>
                </div>
                <p className="text-sm font-medium">{formattedStartDate}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Flag className="mr-1 h-3 w-3" />
                  <span>Término</span>
                </div>
                <p className="text-sm font-medium">{formattedEndDate}</p>
              </div>
            </div>
          </div>
          
          {/* Coluna de progresso */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* Progresso no plano */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progresso do plano</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {daysCompleted} / {durationInDays} dias
                </Badge>
              </div>
              <Progress value={planProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {daysRemaining} dias restantes
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2 justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          asChild 
          className="h-9 border-primary/20 hover:bg-primary/5"
        >
          <Link href={`/dashboard/plans/${activePlan.path}/ritmos`}>
            <Settings className="mr-1.5 h-4 w-4" />
            Configurar Ritmos
            {!isAuthenticated && (
              <span className="ml-1 text-xs text-muted-foreground">(local)</span>
            )}
          </Link>
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="h-9"
          >
            <Link href="/dashboard/log">
              <PlayCircle className="mr-1.5 h-4 w-4" />
              Registrar Treino
            </Link>
          </Button>
          
          <Button 
            size="sm" 
            asChild 
            className="h-9"
          >
            <Link href={`/plano/${activePlan.path}`}>
              Ver Plano
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EnhancedActivePlanCard;