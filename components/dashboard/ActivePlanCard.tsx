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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
        <CardHeader className="bg-muted/20 p-2">
          <CardTitle className="text-sm">Plano de Treino Ativo</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="flex flex-col items-center justify-center py-2 text-center">
            <div className="rounded-full bg-muted p-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-1">Nenhum plano ativo</h3>
            <p className="text-xs text-muted-foreground max-w-md mb-2">
              Selecione um plano para começar a acompanhar seu progresso.
            </p>
            <Button asChild size="sm" className="h-7 text-xs">
              <Link href="/dashboard/plans">
                Escolher Plano
                <ChevronRight className="ml-1 h-3 w-3" />
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
  const formattedStartDate = format(planStartDate, "dd 'de' MMM", { locale: ptBR });
  const formattedEndDate = format(endDate, "dd 'de' MMM", { locale: ptBR });

  return (
    <Card className="overflow-hidden border-primary/10">
      <CardContent className="p-3 space-y-3">
        {/* Título e Informações básicas */}
        <div className="flex justify-between items-start">
          <Link href={`/plano/${activePlan.path}`} className="hover:text-primary transition-colors">
            <h3 className="text-sm font-medium line-clamp-1">{activePlan.name}</h3>
          </Link>
          {activePlan.isNew && (
            <Badge variant="destructive" className="text-xs h-5 py-0">Novo</Badge>
          )}
        </div>

        {/* Informações do plano */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <User2 className="h-3.5 w-3.5 mt-0.5" />
            <span className="line-clamp-1">{activePlan.coach}</span>
          </div>
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 mt-0.5" />
            <span className="line-clamp-1">{activePlan.nivel}</span>
          </div>
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mt-0.5" />
            <span className="line-clamp-1">{activePlan.duration}</span>
          </div>
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <BarChart2 className="h-3.5 w-3.5 mt-0.5" />
            <span className="line-clamp-1">{activePlan.volume} km/sem</span>
          </div>
        </div>
        
        <Separator className="my-1" />
        
        {/* Progresso do plano */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Progresso do plano</span>
            <Badge variant="outline" className="font-mono text-xs h-4 py-0 px-1">
              {daysCompleted} / {durationInDays} dias
            </Badge>
          </div>
          <Progress value={planProgress} className="h-1.5" />
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Início: {formattedStartDate}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Flag className="h-3 w-3" />
              <span>Término: {formattedEndDate}</span>
            </div>
          </div>
        </div>
        
        {/* Progresso semanal */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progresso semanal</span>
            <span className="font-medium">{weekProgress}%</span>
          </div>
          <Progress value={weekProgress} className="h-1.5" />
        </div>
        
        {/* Botões de ação */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="h-7 text-xs border-primary/20 hover:bg-primary/5"
          >
            <Link href={`/dashboard/plans/${activePlan.path}/ritmos`}>
              <Settings className="mr-1 h-3 w-3" />
              Ritmos
              {!isAuthenticated && (
                <span className="ml-1 text-xxs text-muted-foreground">(local)</span>
              )}
            </Link>
          </Button>
          
          <Button 
            size="sm" 
            asChild 
            className="h-7 text-xs"
          >
            <Link href={`/plano/${activePlan.path}`}>
              Ver Plano
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedActivePlanCard;