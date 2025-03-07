import React from 'react';
import Link from 'next/link';
import { 
  User2, 
  Settings,
  FileText,
  BarChart2,
  CalendarDays,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { limitDescription } from '@/lib/plan-utils';
import { PlanModel } from '@/models';

interface PlanHeaderProps {
  plan: PlanModel;
  isAuthenticated?: boolean;
  startDate?: string;
  endDate?: string;
  selectedDistance?: string;
  selectedTime?: string;
  handleDateChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEndDateChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDistanceChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleTimeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  params?: number | null;
  percentage?: number;
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

export function PlanHeader({
  plan,
  isAuthenticated = false,
  ...otherProps // Outros props não utilizados neste arquivo
}: PlanHeaderProps) {
  // Criar o slug do treinador a partir do nome
  const trainerSlug = createTrainerSlug(plan.coach);

  return (
    <div className="space-y-4 mt-2 mb-6">
      <Card className="overflow-hidden border-none shadow-none pb-0 transition-all duration-300">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header com nome e badges */}
            <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90">{plan.name}</h1>
              {plan.isNew && (
                <Badge variant="destructive" className="text-xs">Novo</Badge>
              )}
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={`/treinadores/${trainerSlug}`}
                className="flex items-center text-primary/80 hover:text-primary transition-colors"
              >
                <User2 className="mr-1.5 h-4 w-4" />
                {plan.coach}
              </Link>
              <div className="flex items-center text-muted-foreground/90">
                <TrendingUp className="mr-1.5 h-4 w-4" />
                {plan.nivel}
              </div>
              <div className="flex items-center text-muted-foreground/90">
                <CalendarDays className="mr-1.5 h-4 w-4" />
                {plan.duration}
              </div>
              <div className="flex items-center text-muted-foreground/90">
                <BarChart2 className="mr-1.5 h-4 w-4" />
                {plan.volume} km/sem
              </div>
            </div>
            
            {/* Descrição */}
            <p className="text-muted-foreground">{limitDescription(plan.info, 400)}</p>

            {/* Botão de configurar ritmos - agora visível para todos */}
            <div className="pt-2">
              <Button  
                size="sm"
                className="sm:w-fit w-full"
                asChild
              >
                <Link href={`/dashboard/plans/${plan.path}/ritmos`}>
                  <Settings className="mr-1.5 h-4 w-4" />
                  Configurar Ritmos
                  {!isAuthenticated && (
                    <span className="ml-1 text-xs text-muted-foreground">(local)</span>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* TrainingPeaks Section */}
      {plan.trainingPeaksUrl && (
        <Card className="bg-secondary/30 ring-1 ring-border">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground/90">
                  Compre este plano no TrainingPeaks
                </h3>
                <p className="text-sm text-muted-foreground">
                  Após a compra, seu plano será sincronizado automaticamente com seu relógio GPS e apps favoritos.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs text-white bg-blue-600 hover:bg-blue-900 hover:text-white"
                onClick={() => window.open(plan.trainingPeaksUrl, '_blank')}
              >
                <FileText className="mr-1.5 h-3 w-3" />
                Ver no TrainingPeaks
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}