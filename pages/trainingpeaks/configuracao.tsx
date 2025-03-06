import React, { useState } from "react";
import Head from "next/head";
import { Layout } from "@/components/layout";
import { HeroLayout } from "@/components/default/HeroLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TrainingPeaksConverter } from "@/components/trainingpeaks/Converter";

const ConfiguracaoLimiarPage = () => {
  const [thresholdPace, setThresholdPace] = useState("4:00");

  return (
    <Layout>
      <Head>
        <title>Configuração de Limiar - Magic Training</title>
        <meta name="description" content="Configure seu ritmo de limiar para o formato de zonas do TrainingPeaks" />
      </Head>

      <HeroLayout
        title="Configuração de Limiar TrainingPeaks"
        description="Configure seu ritmo de limiar para o formato de zonas do TrainingPeaks baseado em porcentagens do limiar"
      >
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              {(
                <div className="bg-muted/30 p-4 rounded-lg mb-4 space-y-2">
                  <p className="text-sm font-medium">Como configurar no TrainingPeaks:</p>
                  <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Faça login no TrainingPeaks</li>
                    <li>Vá para Perfil → Custom Zones</li>
                    <li>Clique em "Add New Zones"</li>
                    <li>Selecione "Pace" como tipo de zona</li>
                    <li>Cole os valores gerados abaixo diretamente nas zonas</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cada zona deve ser configurada com o valor baixo e alto gerado pelo conversor.
                    Copie facilmente os valores usando os botões abaixo da tabela.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="threshold">Seu Ritmo de Limiar</Label>
                <div className="flex gap-2 w-full sm:w-fit">
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