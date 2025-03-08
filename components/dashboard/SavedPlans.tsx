// components/dashboard/SavedPlans.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlanSummary } from '@/models';
import { Bookmark, Play, Target, User2, Calendar, Activity } from 'lucide-react';

interface SavedPlansProps {
    plans: PlanSummary[];
    onActivatePlan: (planPath: string) => Promise<void>;
    onRemovePlan: (planPath: string, save: boolean) => Promise<void>;
    isActivating: boolean;
    activatingPlanId: string | null;
    isRemoving: boolean;
    removingPlanId: string | null;
}

const SavedPlans: React.FC<SavedPlansProps> = ({
    plans,
    onActivatePlan,
    onRemovePlan,
    isActivating,
    activatingPlanId,
    isRemoving,
    removingPlanId
}) => {
    if (!plans || plans.length === 0) {
        return null; // Este componente não lida com o estado vazio - já é tratado no componente pai
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

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plans.map((plan) => (
                    <Card
                        key={plan.path}
                        className={cn(
                            "group hover:shadow-md transition-all duration-300",
                            "bg-white dark:bg-muted/30 border-border/50 hover:border-border/90"
                        )}
                    >
                        <CardContent>
                            <div className="flex items-start gap-3">


                                <div className="flex-1 min-w-0 space-y-3">
                                    <div>
                                        <Link
                                            href={`/plano/${plan.path}`}
                                            className="hover:text-primary transition-colors"
                                        >
                                            <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                {plan.name}</h3>
                                        </Link>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User2 className="h-4 w-4" />
                                            <span className="line-clamp-1">{plan.coach}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <div className="flex flex-wrap items-center gap-3 text-sm me-3">
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

                                            <div className="flex flex-wrap gap-1 items-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "px-2 py-0.5 text-xs capitalize font-medium rounded-md transition-colors",
                                                        getLevelBadgeStyles(plan.nivel)
                                                    )}
                                                >
                                                    {plan.nivel}
                                                </Badge>

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
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            disabled={isActivating}
                                            onClick={() => onActivatePlan(plan.path)}
                                            className="h-8 text-xs flex-1"
                                        >
                                            {isActivating && activatingPlanId === plan.path ? (
                                                "Ativando..."
                                            ) : (
                                                <>
                                                    <Play className="mr-1.5 h-3.5 w-3.5" />
                                                    Ativar Plano
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onRemovePlan(plan.path, false)}
                                            disabled={isRemoving && removingPlanId === plan.path}
                                            className="h-8 text-xs flex-1"
                                        >
                                            {isRemoving && removingPlanId === plan.path ? (
                                                "Removendo..."
                                            ) : (
                                                <>
                                                    <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                                                    Remover
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default SavedPlans;