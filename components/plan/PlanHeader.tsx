import React from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  User2, 
  Activity, 
  Settings,
  FileText
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

export function PlanHeader({
  plan,
  isAuthenticated = false,
  ...otherProps // Outros props não utilizados neste arquivo
}: PlanHeaderProps) {
  return (
    <div className="space-y-4 mb-6">
      <Card className="overflow-hidden border-border/60 hover:border-border/90 transition-all duration-300">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header com nome e badges */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{plan.name}</h1>
              {plan.isNew && (
                <Badge variant="destructive" className="text-xs">Novo</Badge>
              )}
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">{plan.nivel}</Badge>
              {plan.distances?.map((distance, index) => (
                <Badge key={index} variant="secondary">{distance}</Badge>
              ))}
              
              {plan.duration && (
                <div className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                  <Calendar className="h-3 w-3" />
                  {plan.duration}
                </div>
              )}
            </div>
            
            {/* Descrição */}
            <p className="text-muted-foreground">{limitDescription(plan.info, 250)}</p>
            
            {/* Informações adicionais */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User2 className="h-4 w-4" />
                <span>Treinador: {plan.coach}</span>
              </div>
              
              {plan.volume && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>{plan.volume} km/sem</span>
                </div>
              )}
            </div>

            {/* Botão de configurar ritmos - agora visível para todos */}
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm"
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