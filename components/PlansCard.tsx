import { User2, Calendar, Activity } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TrainingPlan {
  name: string;
  trainer?: string;
  speed?: string;
  volume?: string;
  level?: string;
  weeks?: string;
  duration?: string;
  isNew?: boolean;
  activities?: string[];
  path: string;
  img?: string;
  info?: string;
}

interface TrainingCardProps {
  plan: TrainingPlan;
  className?: string;
}

const getLevelBadgeStyles = (level: string) => {
  switch (level.toLowerCase()) {
    case 'iniciante': return 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30';
    case 'intermediário': return 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30';
    case 'avançado': return 'text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30';
    case 'elite': return 'text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30';
    default: return '';
  }
}

export function TrainingCard({ plan, className }: TrainingCardProps) {
  const planLink = plan.path.startsWith('treino/') 
  ? `/${plan.path}` 
  : `/plano/${plan.path}`;

  return (
    <Card className={cn(
      "group relative hover:shadow-md transition-all duration-300 h-full",
      "bg-white dark:bg-muted/30 border-border/40 hover:border-border/90",
      "overflow-hidden flex flex-col",
      className
    )}>
      <Link href={planLink} className="absolute inset-0 z-10">
        <span className="sr-only">Ver detalhes do plano {plan.name}</span>
      </Link>

      <div className="p-5 flex flex-col h-full space-y-4">
        {/* Header Section */}
        <div className="space-y-3 grow">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {plan.name}
            </h3>
            {plan.isNew && (
              <Badge 
                variant="destructive" 
                className="text-xs"
              >
                Novo
              </Badge>
            )}
          </div>
          
          {plan.trainer && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User2 className="h-4 w-4" />
              <span className="line-clamp-1">{plan.trainer}</span>
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
            {(plan.weeks || plan.duration) && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{plan.weeks || plan.duration}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {plan.level && (
              <Badge 
                variant="outline"
                className={cn(
                  "px-2 py-0.5 text-xs capitalize font-medium rounded-md transition-colors",
                  getLevelBadgeStyles(plan.level)
                )}
              >
                {plan.level}
              </Badge>
            )}
            {plan.activities?.map((activity, index) => (
              <Badge 
                key={index}
                variant="secondary"
                className="bg-secondary/30 hover:bg-secondary/50 text-xs border-0 
                         text-secondary-foreground/90 dark:bg-secondary/20 
                         dark:hover:bg-secondary/30 dark:text-secondary-foreground/80"
              >
                {activity}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}