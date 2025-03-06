import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Clock, Timer, ArrowRight, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PaceCalculator: React.FC = () => {
  // Estados para os diferentes tipos de cálculos
  const [distance, setDistance] = useState<number>(5);
  const [time, setTime] = useState<string>("00:25:00");
  const [pace, setPace] = useState<string>("5:00");
  const [calculatedPace, setCalculatedPace] = useState<string>("");
  const [calculatedTime, setCalculatedTime] = useState<string>("");
  const [calculatedDistance, setCalculatedDistance] = useState<number>(0);
  const [distanceUnit, setDistanceUnit] = useState<string>("km");
  const [paceUnit, setPaceUnit] = useState<string>("/km");
  const [activeCalc, setActiveCalc] = useState<string>("pace");

  // Função para converter tempo (hh:mm:ss) para segundos
  const timeToSeconds = (timeStr: string): number => {
    const [hours = "0", minutes = "0", seconds = "0"] = timeStr.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Função para converter segundos para tempo (hh:mm:ss)
  const secondsToTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Função para converter segundos para pace (mm:ss)
  const secondsToPace = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Função para converter pace (mm:ss) para segundos
  const paceToSeconds = (paceStr: string): number => {
    const [minutes = "0", seconds = "0"] = paceStr.split(":").map(Number);
    return minutes * 60 + seconds;
  };

  // Efeito para calcular pace com base na distância e tempo
  useEffect(() => {
    if (activeCalc === "pace" && distance > 0 && time) {
      const timeInSeconds = timeToSeconds(time);
      let paceInSeconds = timeInSeconds / distance;
      
      // Ajuste se a unidade for milhas
      if (distanceUnit === "mi") {
        paceInSeconds = paceInSeconds * 1.60934;
      }
      
      setCalculatedPace(secondsToPace(paceInSeconds));
    }
  }, [distance, time, distanceUnit, activeCalc]);

  // Efeito para calcular tempo com base na distância e pace
  useEffect(() => {
    if (activeCalc === "time" && distance > 0 && pace) {
      let paceInSeconds = paceToSeconds(pace);
      
      // Ajuste se a unidade for milhas
      if (paceUnit === "/mi") {
        paceInSeconds = paceInSeconds / 1.60934;
      }
      
      const timeInSeconds = paceInSeconds * distance;
      setCalculatedTime(secondsToTime(timeInSeconds));
    }
  }, [distance, pace, paceUnit, activeCalc]);

  // Efeito para calcular distância com base no tempo e pace
  useEffect(() => {
    if (activeCalc === "distance" && time && pace) {
      const timeInSeconds = timeToSeconds(time);
      let paceInSeconds = paceToSeconds(pace);
      
      // Ajuste se a unidade for milhas
      if (paceUnit === "/mi") {
        paceInSeconds = paceInSeconds / 1.60934;
      }
      
      let calculatedDist = timeInSeconds / paceInSeconds;
      
      // Arredondamento para duas casas decimais
      calculatedDist = Math.round(calculatedDist * 100) / 100;
      
      setCalculatedDistance(calculatedDist);
    }
  }, [time, pace, paceUnit, activeCalc]);

  // Função para resetar os campos
  const handleReset = () => {
    setDistance(5);
    setTime("00:25:00");
    setPace("5:00");
    setCalculatedPace("");
    setCalculatedTime("");
    setCalculatedDistance(0);
    setDistanceUnit("km");
    setPaceUnit("/km");
  };

  // Conversão comum para tabela de referência
  const commonPaceTable = [
    { pace: "4:00", label: "Elite", fiveK: "20:00", tenK: "40:00", halfMarathon: "1:24:24", marathon: "2:48:48" },
    { pace: "4:30", label: "Avançado", fiveK: "22:30", tenK: "45:00", halfMarathon: "1:34:57", marathon: "3:09:54" },
    { pace: "5:00", label: "Intermediário", fiveK: "25:00", tenK: "50:00", halfMarathon: "1:45:30", marathon: "3:31:00" },
    { pace: "5:30", label: "Médio", fiveK: "27:30", tenK: "55:00", halfMarathon: "1:56:03", marathon: "3:52:06" },
    { pace: "6:00", label: "Iniciante", fiveK: "30:00", tenK: "1:00:00", halfMarathon: "2:06:36", marathon: "4:13:12" },
    { pace: "7:00", label: "Iniciante", fiveK: "35:00", tenK: "1:10:00", halfMarathon: "2:27:42", marathon: "4:55:24" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 overflow-x-auto py-2">
        <Button
          variant={activeCalc === "pace" ? "default" : "outline"}
          onClick={() => setActiveCalc("pace")}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          Calcular Ritmo
        </Button>
        <Button
          variant={activeCalc === "time" ? "default" : "outline"}
          onClick={() => setActiveCalc("time")}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Calcular Tempo
        </Button>
        <Button
          variant={activeCalc === "distance" ? "default" : "outline"}
          onClick={() => setActiveCalc("distance")}
          className="gap-2"
        >
          <Timer className="h-4 w-4" />
          Calcular Distância
        </Button>
        <Button
          variant="secondary"
          onClick={handleReset}
          className="ml-auto"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel de Entrada */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Calculadora de Ritmo */}
            {activeCalc === "pace" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="distance">Distância</Label>
                  <div className="flex space-x-2 mt-1.5">
                    <Input
                      id="distance"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={distance}
                      onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <Select
                      value={distanceUnit}
                      onValueChange={setDistanceUnit}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km">km</SelectItem>
                        <SelectItem value="mi">milhas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="time">Tempo (hh:mm:ss)</Label>
                  <Input
                    id="time"
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="00:30:00"
                    className="mt-1.5"
                  />
                </div>

                <div className="flex items-center justify-center py-2">
                  <Badge variant="outline" className="px-4 py-2 text-lg font-semibold">
                    {calculatedPace ? `${calculatedPace} min${paceUnit}` : "0:00 min/km"}
                  </Badge>
                </div>
              </div>
            )}

            {/* Calculadora de Tempo */}
            {activeCalc === "time" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="distance-time">Distância</Label>
                  <div className="flex space-x-2 mt-1.5">
                    <Input
                      id="distance-time"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={distance}
                      onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <Select
                      value={distanceUnit}
                      onValueChange={setDistanceUnit}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km">km</SelectItem>
                        <SelectItem value="mi">milhas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="pace">Ritmo (min:seg por km/mi)</Label>
                  <div className="flex space-x-2 mt-1.5">
                    <Input
                      id="pace"
                      type="text"
                      value={pace}
                      onChange={(e) => setPace(e.target.value)}
                      placeholder="5:00"
                      className="flex-1"
                    />
                    <Select
                      value={paceUnit}
                      onValueChange={setPaceUnit}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="/km">min/km</SelectItem>
                        <SelectItem value="/mi">min/mi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-center py-2">
                  <Badge variant="outline" className="px-4 py-2 text-lg font-semibold">
                    {calculatedTime || "00:00:00"}
                  </Badge>
                </div>
              </div>
            )}

            {/* Calculadora de Distância */}
            {activeCalc === "distance" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="time-dist">Tempo (hh:mm:ss)</Label>
                  <Input
                    id="time-dist"
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="00:30:00"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="pace-dist">Ritmo (min:seg por km/mi)</Label>
                  <div className="flex space-x-2 mt-1.5">
                    <Input
                      id="pace-dist"
                      type="text"
                      value={pace}
                      onChange={(e) => setPace(e.target.value)}
                      placeholder="5:00"
                      className="flex-1"
                    />
                    <Select
                      value={paceUnit}
                      onValueChange={setPaceUnit}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="/km">min/km</SelectItem>
                        <SelectItem value="/mi">min/mi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-center py-2">
                  <Badge variant="outline" className="px-4 py-2 text-lg font-semibold">
                    {calculatedDistance ? `${calculatedDistance} ${distanceUnit}` : `0 ${distanceUnit}`}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Ritmos de Referência */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Ritmos de Referência para Provas
            </h3>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ritmo/km</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-right">5K</TableHead>
                    <TableHead className="text-right">10K</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Meia</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Maratona</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commonPaceTable.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{entry.pace}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          entry.label === "Elite" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" :
                          entry.label === "Avançado" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30" :
                          entry.label === "Intermediário" ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30" :
                          "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        }>
                          {entry.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{entry.fiveK}</TableCell>
                      <TableCell className="text-right">{entry.tenK}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">{entry.halfMarathon}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">{entry.marathon}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaceCalculator;