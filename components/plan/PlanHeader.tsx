import React from 'react';
import Link from 'next/link';
import { 
  BadgeCheck, 
  Calendar, 
  AlertTriangle, 
  Settings,
  FileText,
  Timer
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { limitDescription } from '@/lib/plan-utils';
import VO2maxIndicator from '@/components/default/VO2maxConfig';
import { PlanModel } from '@/models';
import { defaultTimes } from '@/lib/plan-utils';

interface PlanHeaderProps {
  plan: PlanModel;
  startDate: string;
  endDate: string;
  selectedDistance: string;
  selectedTime: string;
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDistanceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  params: number | null;
  percentage: number;
  isAuthenticated?: boolean;
}

export function PlanHeader({
  plan,
  startDate,
  endDate,
  selectedDistance,
  selectedTime,
  handleDateChange,
  handleEndDateChange,
  handleDistanceChange,
  handleTimeChange,
  params,
  percentage,
  isAuthenticated = false
}: PlanHeaderProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Informações do Plano */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{plan.name}</h1>
              </div>
              
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
              
              <p className="text-muted-foreground">{limitDescription(plan.info, 250)}</p>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <span className="text-sm">Treinador: {plan.coach}</span>
              </div>
            </div>

            {plan.trainingPeaksUrl && (
              <div className="flex items-start gap-2 pt-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Este plano também está disponível no TrainingPeaks. Para um melhor controle e acompanhamento, 
                    recomendamos a versão premium.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs mt-1 text-white bg-blue-600 hover:bg-blue-900 hover:text-white"
                    onClick={() => window.open(plan.trainingPeaksUrl, '_blank')}
                  >
                    <FileText className="mr-1.5 h-3 w-3" />
                    Ver no TrainingPeaks
                  </Button>
                </div>
              </div>
            )}
            
            {/* Mostrar botão de configurar ritmos apenas para usuários autenticados */}
            {isAuthenticated && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/plans/${plan.path}/settings`}>
                    <Settings className="mr-1.5 h-4 w-4" />
                    Configurar Ritmos
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Configurações do Plano */}
          <div className="flex-1 space-y-4">
            <h2 className="font-medium">Configurações do Plano</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de Início */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={handleDateChange}
                />
              </div>
              
              {/* Data de Fim */}
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={handleEndDateChange}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Configuração do Ritmo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Distância de Referência */}
                <div className="space-y-2">
                  <Label htmlFor="distance">Distância</Label>
                  <select
                    id="distance"
                    value={selectedDistance}
                    onChange={handleDistanceChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {Object.keys(defaultTimes).map((distance) => (
                      <option key={distance} value={distance}>
                        {distance}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Tempo de Referência */}
                <div className="space-y-2">
                  <Label htmlFor="time">Seu Tempo</Label>
                  <div className="relative">
                    <Input
                      id="time"
                      value={selectedTime}
                      onChange={handleTimeChange}
                      placeholder="00:00:00"
                      className="pl-8"
                    />
                    <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              
              {params !== null && (
                <VO2maxIndicator params={params} percentage={percentage} showInfo={false} />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}