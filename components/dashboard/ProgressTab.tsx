import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, ArrowUpRight, Calendar, BadgeInfo } from "lucide-react";

export const ProgressTab: React.FC = () => {
  return (
    <Card className="border-border/50">
      <CardHeader className="p-3">
        <CardTitle className="text-sm">Meu Progresso</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="rounded-full bg-muted/50 p-3 mb-4">
            <BarChart2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium mb-2">Estatísticas em construção</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Logo você terá acesso a gráficos detalhados de seu progresso. 
            Continue registrando seus treinos para gerar dados de análise.
          </p>
          
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            <div className="bg-muted/30 p-3 rounded-lg flex flex-col items-center">
              <ArrowUpRight className="h-4 w-4 text-primary mb-2" />
              <h4 className="text-sm font-medium">Evolução da Distância</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Acompanhe sua progressão semanal
              </p>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg flex flex-col items-center">
              <Calendar className="h-4 w-4 text-primary mb-2" />
              <h4 className="text-sm font-medium">Consistency Score</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Índice de regularidade nos treinos
              </p>
            </div>
            <div className="col-span-2 bg-muted/30 p-3 rounded-lg flex items-center justify-center">
              <BadgeInfo className="h-4 w-4 text-muted-foreground mr-2" />
              <p className="text-xs text-muted-foreground">
                Acesse o histórico completo na aba "Visão Geral"
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTab;