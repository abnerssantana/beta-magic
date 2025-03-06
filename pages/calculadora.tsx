import React, { useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, BarChart2, Calculator, Zap, Percent, Activity } from "lucide-react";
import VDOTIntensityCalculator from "@/components/calculators/VDOTIntensityCalculator";
import PaceCalculator from "@/components/calculators/PaceCalculator";
import RacePredictor from "@/components/calculators/RacePredictor";
import HeartRateCalculator from "@/components/calculators/HeartRateCalculator";

const RunningCalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("pace");

  return (
    <Layout>
      <Head>
        <title>Calculadora Avançada de Corrida - Magic Training</title>
        <meta 
          name="description" 
          content="Calculadora avançada para corredores com VDOT, previsão de tempo, zonas de FC e muito mais" 
        />
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Calculadora Avançada de Corrida</h1>
          <p className="text-muted-foreground">
            Ferramentas completas para planejamento de treino, estimativa de tempos e conversão de intensidades
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Magic Training - Calculadora Completa
            </CardTitle>
            <CardDescription>
              Selecione a ferramenta desejada ou navegue pelas abas para acessar diferentes calculadoras
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pace" className="text-xs">
                  <Activity className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Ritmo</span>
                </TabsTrigger>
                <TabsTrigger value="vdot" className="text-xs">
                  <Percent className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">VDOT</span>
                </TabsTrigger>
                <TabsTrigger value="predictor" className="text-xs">
                  <BarChart2 className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Previsão</span>
                </TabsTrigger>
                <TabsTrigger value="hr" className="text-xs">
                  <Zap className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">FC</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pace" className="space-y-4">
                <PaceCalculator />
              </TabsContent>

              <TabsContent value="vdot" className="space-y-4">
                <VDOTIntensityCalculator />
              </TabsContent>

              <TabsContent value="predictor" className="space-y-4">
                <RacePredictor />
              </TabsContent>

              <TabsContent value="hr" className="space-y-4">
                <HeartRateCalculator />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RunningCalculatorPage;