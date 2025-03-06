import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Info, BarChart2, Percent, Activity, Calculator } from "lucide-react";
import { races, paces } from "@/lib/PacesRaces";
import { Button } from "@/components/ui/button";
import VO2maxIndicator from '@/components/default/VO2maxConfig';
import Head from 'next/head';

// Interface para os ritmos específicos
interface PaceIntensities {
  paceType: string;
  label: string;
  description: string;
  percentOfThreshold: number;
  percentOfVO2max: number;
  percentOfMaxHR: number;
  color: string;
}

// Componente principal
const VDOTCalculator: React.FC = () => {
  // Estados
  const [vdot, setVdot] = useState<number>(50);
  const [thresholdPace, setThresholdPace] = useState<string>("4:00");
  const [customDistance, setCustomDistance] = useState<string>("5km");
  const [customTime, setCustomTime] = useState<string>("00:20:00");
  const [inputMethod, setInputMethod] = useState<string>("custom");

  // Percentagem para o VO2max indicator (0-100%)
  const percentage = useMemo(() => (vdot / 85) * 100, [vdot]);

  // Definição de intensidades como % do limiar
  const intensities: PaceIntensities[] = [
    {
      paceType: "Recovery Km",
      label: "Recuperação",
      description: "Corridas muito fáceis para recuperação ativa",
      percentOfThreshold: 65,
      percentOfVO2max: 60,
      percentOfMaxHR: 70,
      color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
    },
    {
      paceType: "Easy Km",
      label: "Fácil",
      description: "Corridas aeróbicas que desenvolvem resistência base",
      percentOfThreshold: 76,
      percentOfVO2max: 75,
      percentOfMaxHR: 77,
      color: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30"
    },
    {
      paceType: "M Km",
      label: "Maratona",
      description: "Ritmo específico para prova de maratona",
      percentOfThreshold: 85,
      percentOfVO2max: 80,
      percentOfMaxHR: 83,
      color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
    },
    {
      paceType: "T Km",
      label: "Limiar",
      description: "Ritmo no limiar anaeróbico/lactato",
      percentOfThreshold: 100,
      percentOfVO2max: 88,
      percentOfMaxHR: 89,
      color: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
    },
    {
      paceType: "I Km",
      label: "Intervalo",
      description: "Treinos para maximizar VO2max",
      percentOfThreshold: 112,
      percentOfVO2max: 98,
      percentOfMaxHR: 95,
      color: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
    },
    {
      paceType: "R 1000m",
      label: "Repetição",
      description: "Treinos para potência e economia de corrida",
      percentOfThreshold: 130,
      percentOfVO2max: 100,
      percentOfMaxHR: 100,
      color: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30"
    }
  ];

  // Função para encontrar o VDOT a partir de um tempo e distância
  const findVDOT = (time: string, distance: string): number | null => {
    try {
      // Converter tempo para segundos
      const timeParts = time.split(":").map(part => {
        const num = Number(part);
        return isNaN(num) ? 0 : num;
      });

      const h = timeParts[0] || 0;
      const m = timeParts[1] || 0;
      const s = timeParts[2] || 0;

      const totalSeconds = (h * 3600) + (m * 60) + s;
      let closestRace = races[0];
      let minDiff = Number.MAX_VALUE;

      // Encontrar o valor VDOT mais próximo
      for (const race of races) {
        // Type-safe access to race property
        const raceTime = race[distance as keyof typeof race];

        if (raceTime) {
          // Convert to string and parse
          const raceTimeStr = String(raceTime);
          const raceParts = raceTimeStr.split(":").map(part => {
            const num = Number(part);
            return isNaN(num) ? 0 : num;
          });

          const rh = raceParts[0] || 0;
          const rm = raceParts[1] || 0;
          const rs = raceParts[2] || 0;

          // Explicitly calculate race seconds
          const raceSeconds = (rh * 3600) + (rm * 60) + rs;

          const diff = Math.abs(raceSeconds - totalSeconds);

          if (diff < minDiff) {
            minDiff = diff;
            closestRace = race;
          }
        }
      }

      return closestRace.Params;
    } catch (error) {
      console.error("Erro ao calcular VDOT:", error);
      return null;
    }
  };

  // Efeito para calcular VDOT a partir do tempo personalizado
  useEffect(() => {
    if (inputMethod === "custom" && customTime && customDistance) {
      const calculatedVDOT = findVDOT(customTime, customDistance);
      if (calculatedVDOT !== null) {
        setVdot(calculatedVDOT);
      }
    }
  }, [customTime, customDistance, inputMethod]);

  // Encontrar ritmo de limiar baseado no VDOT atual
  useEffect(() => {
    const vdotPaces = paces.find(p => p.Params === vdot);
    if (vdotPaces) {
      setThresholdPace(vdotPaces["T Km"] || "4:00");
    }
  }, [vdot]);

  // Função para converter ritmo em segundos
  const paceToSeconds = (pace: string): number => {
    const [min = 0, sec = 0] = pace.split(":").map(Number);
    return min * 60 + sec;
  };

  // Função para converter segundos em ritmo (formato MM:SS)
  const secondsToPace = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = Math.round(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Função para calcular ritmo baseado na percentagem do limiar
  const calculatePaceFromPercentage = (percentage: number): string => {
    const thresholdSeconds = paceToSeconds(thresholdPace);
    const adjustedSeconds = thresholdSeconds * (100 / percentage);
    return secondsToPace(adjustedSeconds);
  };

  // Função para obter o ritmo específico baseado no VDOT
  const getSpecificPace = (paceType: string): string => {
    const vdotPaces = paces.find(p => p.Params === vdot);
    if (vdotPaces && vdotPaces[paceType as keyof typeof vdotPaces]) {
      return vdotPaces[paceType as keyof typeof vdotPaces] as string;
    }
    return "N/A";
  };

  // Tabela de correspondência de VDOT para tempos de corrida
  const vdotRaceTimes = useMemo(() => {
    const vdotData = races.find(race => race.Params === vdot);
    if (!vdotData) return null;

    return [
      { distance: "5km", time: vdotData["5km"] as string },
      { distance: "10km", time: vdotData["10km"] as string },
      { distance: "21km", time: vdotData["21km"] as string },
      { distance: "42km", time: vdotData["42km"] as string }
    ];
  }, [vdot]);

  // Ritmos de treinamento baseados no VDOT atual
  const trainingPaces = useMemo(() => {
    if (!vdot) return null;

    const vdotPaces = paces.find(p => p.Params === vdot);
    if (!vdotPaces) return null;

    return [
      { key: 'Recovery Km', label: 'Ritmo de Recuperação', value: vdotPaces['Recovery Km'] },
      { key: 'Easy Km', label: 'Ritmo Fácil', value: vdotPaces['Easy Km'] },
      { key: 'M Km', label: 'Ritmo de Maratona', value: vdotPaces['M Km'] },
      { key: 'T Km', label: 'Ritmo de Limiar', value: vdotPaces['T Km'] },
      { key: 'I Km', label: 'Ritmo de Intervalo', value: vdotPaces['I Km'] },
      { key: 'R 1000m', label: 'Ritmo de Repetição', value: vdotPaces['R 1000m'] }
    ];
  }, [vdot]);

  return (
    <Layout>
      <Head>
        <title>Calculadora de Ritmos de Corrida e Zonas de FC - Magic Training</title>
        <meta
          name="description"
          content="Otimize seus treinos de corrida com a Calculadora de Ritmos e Zonas de Frequência Cardíaca."
        />
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Calculadora</h1>
          <p className="text-muted-foreground">
            Otimize seus treinos de corrida com a Calculadora de Ritmos, Calculadora de Zonas de Treinamento, Zonas de Frequência Cardíaca e Calculadora de Equivalências Fisiológicas.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Cálculo de VDOT
            </CardTitle>
            <CardDescription>
              Calcule seu VDOT inserindo seu tempo em uma corrida recente ou selecione um valor diretamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de método de entrada - Ordem das abas alterada */}
            <Tabs value={inputMethod} onValueChange={setInputMethod} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="custom">Desempenho</TabsTrigger>
                <TabsTrigger value="slider">VDOT</TabsTrigger>
              </TabsList>

              {/* Cálculo com tempo e distância - primeira aba */}
              <TabsContent value="custom" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Distância da Corrida</label>
                    <Select
                      value={customDistance}
                      onValueChange={setCustomDistance}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a distância" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1500m">1500m</SelectItem>
                        <SelectItem value="1600m">1600m / 1 Milha</SelectItem>
                        <SelectItem value="3km">3km</SelectItem>
                        <SelectItem value="3200m">3200m / 2 Milhas</SelectItem>
                        <SelectItem value="5km">5km</SelectItem>
                        <SelectItem value="10km">10km</SelectItem>
                        <SelectItem value="15km">15km</SelectItem>
                        <SelectItem value="21km">Meia Maratona (21,1km)</SelectItem>
                        <SelectItem value="42km">Maratona (42,2km)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seu Tempo (hh:mm:ss)</label>
                    <Input
                      type="text"
                      placeholder="00:20:00"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* VDOT direto com slider - segunda aba */}
              <TabsContent value="slider" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Valor VDOT</label>
                    <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                      {vdot}
                    </span>
                  </div>
                  <Slider
                    value={[vdot]}
                    min={30}
                    max={85}
                    step={1}
                    onValueChange={(value) => setVdot(value[0])}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ajuste o valor VDOT conforme sua condição atual ou objetivo de treinamento
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Indicador VO2max */}
            <VO2maxIndicator params={vdot} percentage={percentage} />

            {/* Ritmos de Treinamento */}
            {trainingPaces && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Seus Ritmos de Treinamento Calculados
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {trainingPaces.map(({ key, label, value }) => (
                    <Card key={key} className="bg-muted/20 border-border/50">
                      <CardContent className="p-3">
                        <div className="text-xs text-muted-foreground mb-1">{label}</div>
                        <div className="font-bold">{value}/km</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Previsões de tempo baseadas no VDOT atual */}
            {vdotRaceTimes && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Tempos Previstos em Provas
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {vdotRaceTimes.map((item) => (
                    <Card key={item.distance} className="bg-muted/20 border-border/50">
                      <CardContent className="p-3 text-center">
                        <div className="text-sm text-muted-foreground mb-1">{item.distance}</div>
                        <div className="text-xs md:text-lg font-bold">{item.time}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de intensidades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 py-2">
                <Percent className="h-5 w-5 text-primary" />
                Zonas de Treinamento
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 w-fit text-white text-xs bg-blue-600 hover:bg-blue-900 hover:text-white"
              >
                <Link href="/trainingpeaks/configuracao">
                  <Calculator className="mr-1.5 h-3.5 w-3.5" />
                  TrainingPeaks
                </Link>
              </Button>
            </div>
            <CardDescription>
              Visualize as zonas de intensidade e seus ritmos correspondentes baseados no seu limiar anaeróbico
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/20 p-3 rounded-lg">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">Seu Ritmo de Limiar (T):</span>
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">
                    {thresholdPace}/km
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    (Referência: 100% do limiar = aproximadamente 88% do VO2max)
                  </span>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zona</TableHead>
                      <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                      <TableHead className="text-right">% Limiar</TableHead>
                      <TableHead className="text-right">Ritmo</TableHead>
                      <TableHead className="text-right">VDOT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {intensities.map((intensity) => {
                      const calculatedPace = calculatePaceFromPercentage(intensity.percentOfThreshold);
                      const vdotPace = getSpecificPace(intensity.paceType);

                      return (
                        <TableRow key={intensity.paceType}>
                          <TableCell>
                            <Badge variant="outline" className={intensity.color}>
                              {intensity.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                            {intensity.description}
                          </TableCell>
                          <TableCell className="text-right">{intensity.percentOfThreshold}%</TableCell>
                          <TableCell className="text-right font-semibold">
                            {calculatedPace}/km
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              {vdotPace}/km
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="bg-yellow-200/20 p-3 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p>
                      <strong>Como usar esta calculadora:</strong> A coluna Ritmo mostra os paces calculados com base no seu limiar atual, enquanto a coluna VDOT mostra os valores precisos da tabela VDOT.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use estes ritmos para planejar seus treinos específicos e garantir que está treinando na intensidade correta para cada objetivo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equivalências Fisiológicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Calculadora de Equivalências Fisiológicas
            </CardTitle>
            <CardDescription>
              Conheça a correspondência entre diferentes métricas de intensidade para monitorar seu treino de múltiplas formas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zona</TableHead>
                    <TableHead className="text-right">% Limiar</TableHead>
                    <TableHead className="text-right">% VO2max</TableHead>
                    <TableHead className="text-right">% FC máx</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intensities.map((intensity) => (
                    <TableRow key={intensity.paceType}>
                      <TableCell>
                        <Badge variant="outline" className={intensity.color}>
                          {intensity.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{intensity.percentOfThreshold}%</TableCell>
                      <TableCell className="text-right">{intensity.percentOfVO2max}%</TableCell>
                      <TableCell className="text-right">{intensity.percentOfMaxHR}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-yellow-200/20 p-3 mt-4 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p>
                    <strong>Aplicação prática:</strong> Use esta tabela para converter entre diferentes métricas de intensidade.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Por exemplo, se seu treino pede corrida a 75% do VO2max, você pode correr a 76% do ritmo de limiar ou monitorar sua frequência cardíaca em aproximadamente 77% da sua FC máxima.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VDOTCalculator;