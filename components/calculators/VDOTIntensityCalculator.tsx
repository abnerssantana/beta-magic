import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Info, Percent, Activity, Heart } from "lucide-react";
import { races, paces } from "@/lib/PacesRaces";
import VO2maxIndicator from '@/components/default/VO2maxConfig';

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

const VDOTIntensityCalculator: React.FC = () => {
  // Estados
  const [vdot, setVdot] = useState<number>(50);
  const [thresholdPace, setThresholdPace] = useState<string>("4:00");
  const [customDistance, setCustomDistance] = useState<string>("5km");
  const [customTime, setCustomTime] = useState<string>("20:00");
  const [inputMethod, setInputMethod] = useState<string>("slider");
  
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
      const [h = "0", m = "0", s = "0"] = time.split(":").map(Number);
      const totalSeconds = h * 3600 + m * 60 + Number(s);
      
      let closestRace = races[0];
      let minDiff = Number.MAX_VALUE;
      
      // Encontrar o valor VDOT mais próximo
      for (const race of races) {
        if (race[distance as keyof typeof race]) {
          const raceTime = race[distance as keyof typeof race] as string;
          const [rh = "0", rm = "0", rs = "0"] = raceTime.split(":").map(Number);
          const raceSeconds = rh * 3600 + rm * 60 + rs;
          
          const diff = Math.abs(raceSeconds - totalSeconds);
          
          if (diff < minDiff) {
            minDiff = diff;
            closestRace = race;
          }
        }
      }
      
      return closestRace.Params;
    } catch (error) {
      console.error("Erro ao encontrar VDOT:", error);
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Seleção de método de entrada */}
        <Tabs value={inputMethod} onValueChange={setInputMethod} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="slider">VDOT Direto</TabsTrigger>
            <TabsTrigger value="custom">Tempo em Corrida</TabsTrigger>
          </TabsList>

          {/* VDOT direto com slider */}
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
                Arraste o slider para ajustar seu valor VDOT entre 30 e 85
              </p>
            </div>
          </TabsContent>

          {/* Cálculo com tempo e distância */}
          <TabsContent value="custom" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Distância</label>
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
            
            <div className="bg-muted/20 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm">VDOT calculado:</span>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {vdot}
                </Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Indicador VO2max */}
        <VO2maxIndicator params={vdot} percentage={percentage} />

        {/* Previsões de tempo baseadas no VDOT atual */}
        {vdotRaceTimes && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Tempos Previstos (VDOT {vdot})
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {vdotRaceTimes.map((item) => (
                <Card key={item.distance} className="bg-muted/20 border-border/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">{item.distance}</div>
                    <div className="font-bold">{item.time}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabela de intensidades */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Intensidades de Treinamento</h3>
        </div>

        <div className="bg-muted/20 p-3 rounded-lg">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Ritmo de Limiar (T):</span>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">
              {thresholdPace}/km
            </Badge>
            <span className="text-sm text-muted-foreground">
              (100% do ritmo de limiar, ~88% VO2max)
            </span>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zona</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                <TableHead className="text-right">% Limiar</TableHead>
                <TableHead className="text-right">Ritmo</TableHead>
                <TableHead className="text-right hidden md:table-cell">VDOT</TableHead>
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
                    <TableCell className="font-medium">{intensity.paceType}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {intensity.description}
                    </TableCell>
                    <TableCell className="text-right">{intensity.percentOfThreshold}%</TableCell>
                    <TableCell className="text-right font-semibold">
                      {calculatedPace}/km
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
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
        
        {/* Equivalências Fisiológicas */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Equivalências Fisiológicas</h3>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zona</TableHead>
                  <TableHead className="text-right">% do Limiar</TableHead>
                  <TableHead className="text-right">% do VO2max</TableHead>
                  <TableHead className="text-right">% da FC máxima</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intensities.map((intensity) => (
                  <TableRow key={intensity.paceType + "-physio"}>
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
        </div>

        <div className="bg-muted/20 p-3 rounded-lg text-sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p>
                <strong>Como usar:</strong> Esta tabela mostra a relação entre o ritmo de limiar (T) e os outros ritmos de treino no sistema VDOT.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VDOTIntensityCalculator;