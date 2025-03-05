import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export const ProgressTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu Progresso</CardTitle>
        <CardDescription>
          Acompanhe sua evolução ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <div className="rounded-full bg-muted p-3 mb-4 inline-block">
            <BarChart2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Dados de progresso em breve</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Estamos trabalhando para trazer gráficos detalhados e análises do seu progresso.
            Continue treinando e logo você poderá visualizar sua evolução.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTab;