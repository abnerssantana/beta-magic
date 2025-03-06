// pages/plano-trainingpeaks/configuracao-limiar.tsx
import React, { useState } from "react";
import Head from "next/head";
import { Layout } from "@/components/layout";
import { HeroLayout } from "@/components/default/HeroLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { TrainingPeaksConverter } from "@/components/trainingpeaks/Converter";

const ConfiguracaoLimiarPage = () => {
  const [thresholdPace, setThresholdPace] = useState("4:00");
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <Layout>
      <Head>
        <title>Configuração de Limiar - Magic Training</title>
        <meta name="description" content="Configure seu ritmo de limiar para o formato de zonas do TrainingPeaks" />
      </Head>

      <HeroLayout
        title="Configuração de Limiar"
        description="Configure seu ritmo de limiar para o formato de zonas do TrainingPeaks baseado em porcentagens do limiar"
      >
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Configuração de Limiar</span>
                <div className="flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => setShowInstructions(!showInstructions)}
                        >
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        Mostrar/esconder instruções
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showInstructions && (
                <div className="bg-muted/30 p-4 rounded-lg mb-4 space-y-2">
                  <p className="text-sm font-medium">Como usar este conversor:</p>
                  <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Insira seu ritmo de limiar atual no formato min:seg por km</li>
                    <li>As zonas de treino serão calculadas automaticamente</li>
                    <li>Use estas zonas ao criar o plano no TrainingPeaks</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    O ritmo de limiar (threshold) é o ritmo que você consegue manter em um esforço máximo de aproximadamente 1 hora.
                    Para muitos corredores, está próximo do ritmo de 10K ou um pouco mais lento.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="threshold">Seu Ritmo de Limiar</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="threshold"
                      type="text"
                      value={thresholdPace}
                      onChange={(e) => setThresholdPace(e.target.value)}
                      placeholder="4:00"
                      className="pl-3 pr-12"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <span className="text-sm text-muted-foreground">/km</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <TrainingPeaksConverter thresholdPace={thresholdPace} />
            </CardContent>
          </Card>
        </div>
      </HeroLayout>
    </Layout>
  );
};

export default ConfiguracaoLimiarPage;