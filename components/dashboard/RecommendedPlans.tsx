import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlanSummary } from '@/models';
import { Compass, Target, User2, Calendar, Activity, ChevronRight, Play, BookmarkPlus } from 'lucide-react';

interface RecommendedPlansProps {
  plans: PlanSummary[];
  userLevel?: string | null; // Atualizado para aceitar string | null
  onSavePlan?: (planPath: string, save: boolean) => Promise<void>;
  onActivatePlan?: (planPath: string) => Promise<void>;
  isSaving?: boolean;
  isActivating?: boolean;
  activatingPlanId?: string | null;
  savedPlanPaths?: string[];
}

const RecommendedPlans: React.FC<RecommendedPlansProps> = ({ 
  plans, 
  userLevel,
  onSavePlan,
  onActivatePlan,
  isSaving = false,
  isActivating = false,
  activatingPlanId = null,
  savedPlanPaths = []
}) => {
  // Se não há planos recomendados, mostrar mensagem e link para encontrar planos
  if (!plans || plans.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Compass className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-2">Encontre seu plano ideal</p>
          <p className="text-xs text-muted-foreground mb-4">
            Responda algumas perguntas para descobrirmos qual plano combina com você
          </p>
          <Button asChild size="sm">
            <Link href="/encontrar-plano">
              Descobrir Planos
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Função para determinar o estilo do badge baseado no nível
  const getLevelBadgeStyles = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'iniciante': return 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30';
      case 'intermediário': return 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30';
      case 'avançado': return 'text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30';
      case 'elite': return 'text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30';
      default: return '';
    }
  };

  // Destaques
  const featuredPlans = plans.slice(0, 6);

  return (
    <div className="space-y-4">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredPlans.map((plan) => (
            <Card key={plan.path} className={cn(
              "group relative hover:shadow-md transition-all duration-300 h-full",
              "bg-white dark:bg-muted/30 border-border/40 hover:border-border/90",
              "overflow-hidden flex flex-col p-0"
            )}>
              <div className="p-5 flex flex-col h-full space-y-4">
                {/* Header Section */}
                <div className="space-y-3 grow">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/plano/${plan.path}`}>
                      <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {plan.name}
                      </h3>
                    </Link>
                    {plan.isNew && (
                      <Badge 
                        variant="destructive" 
                        className="text-xs"
                      >
                        Novo
                      </Badge>
                    )}
                  </div>
                  
                  {plan.coach && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User2 className="h-4 w-4" />
                      <span className="line-clamp-1">{plan.coach}</span>
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {plan.volume && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        <span>{plan.volume} km/sem</span>
                      </div>
                    )}
                    {plan.duration && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{plan.duration}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {plan.nivel && (
                      <Badge 
                        variant="outline"
                        className={cn(
                          "px-2 py-0.5 text-xs capitalize font-medium rounded-md transition-colors",
                          getLevelBadgeStyles(plan.nivel)
                        )}
                      >
                        {plan.nivel}
                      </Badge>
                    )}
                    
                    {plan.distances?.map((distance, index) => (
                      <Badge 
                        key={index}
                        variant="secondary"
                        className="bg-secondary/30 hover:bg-secondary/50 text-xs border-0 
                                text-secondary-foreground/90 dark:bg-secondary/20 
                                dark:hover:bg-secondary/30 dark:text-secondary-foreground/80"
                      >
                        {distance}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {onSavePlan && onActivatePlan && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSavePlan(plan.path, true)}
                      disabled={isSaving || savedPlanPaths.includes(plan.path)}
                      className="h-8 text-xs flex-1"
                    >
                      <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
                      {savedPlanPaths.includes(plan.path) ? 'Salvo' : 'Salvar'}
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onActivatePlan(plan.path)}
                      disabled={isActivating && activatingPlanId === plan.path}
                      className="h-8 text-xs flex-1"
                    >
                      {isActivating && activatingPlanId === plan.path ? (
                        "Ativando..."
                      ) : (
                        <>
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          Ativar
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendedPlans;