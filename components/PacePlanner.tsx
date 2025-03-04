import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Ruler, Thermometer, Droplets, Wind, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PredefinedDistances = {
  '5k': 5,
  '10k': 10,
  'Meia': 21.1,
  'Maratona': 42.2,
  'Personalizada': 0
};

// Utility functions
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes + (seconds || 0) / 60;
};

const minutesToTime = (minutes: number): string => {
  if (!minutes || isNaN(minutes)) return '00:00';
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatTotalTime = (timeInMinutes: number): string => {
  if (!timeInMinutes || isNaN(timeInMinutes)) return '00:00:00';
  const hours = Math.floor(timeInMinutes / 60);
  const minutes = Math.floor(timeInMinutes % 60);
  const seconds = Math.round((timeInMinutes % 1) * 60);

  const parts = [];
  if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
  parts.push(minutes.toString().padStart(2, '0'));
  parts.push(seconds.toString().padStart(2, '0'));

  return parts.join(':');
};

const PacePlanner = () => {
  const [selectedDistance, setSelectedDistance] = useState('5k');
  const [customDistance, setCustomDistance] = useState(0);
  const [splits, setSplits] = useState<{ id: number; distance: number; pace: string }[]>([]);
  const [globalPace, setGlobalPace] = useState('');
  const [temperature, setTemperature] = useState(20);
  const [humidity, setHumidity] = useState(60);
  const [windSpeed, setWindSpeed] = useState(0);

  useEffect(() => {
    const distance = selectedDistance === 'Personalizada' ? customDistance : PredefinedDistances[selectedDistance as keyof typeof PredefinedDistances];
    initializeSplits(distance);
  }, [selectedDistance, customDistance]);

  const initializeSplits = (distance: number): void => {
    const fullKm = Math.floor(distance);
    const remainder = distance - fullKm;
    
    const newSplits = Array.from({ length: fullKm }, (_, index) => ({
      id: index + 1,
      distance: 1,
      pace: '05:00'
    }));

    if (remainder > 0) {
      newSplits.push({
        id: fullKm + 1,
        distance: parseFloat(remainder.toFixed(2)),
        pace: '05:00'
      });
    }
    setSplits(newSplits);
  };

  const formatPaceInput = (input: string): string => {
    const inputTime = input.replace(/[^0-9]/g, "");
    let formattedTime = inputTime;

    if (inputTime.length > 2) {
      formattedTime = inputTime.slice(0, 2) + ":" + inputTime.slice(2);
    }
    if (inputTime.length > 4) {
      formattedTime = formattedTime.slice(0, 5);
    }

    return formattedTime;
  };

  const calculatePaceAdjustment = () => {
    let adjustment = 1.0;

    if (temperature > 20) {
      adjustment += (temperature - 20) * 0.0038;
    } else if (temperature < 10) {
      adjustment += (10 - temperature) * 0.002;
    }

    if (humidity > 60) {
      adjustment += (humidity - 60) * 0.001;
    }

    if (windSpeed > 0) {
      adjustment += (windSpeed * 0.002);
    }

    return adjustment;
  };

  const handlePaceInput = (input: string, splitId: number | null = null): void => {
    const formattedValue = formatPaceInput(input);
    
    if (splitId) {
      handleUpdateSplit(splitId, { pace: formattedValue });
    } else {
      setGlobalPace(formattedValue);
    }
  };

  const applyGlobalPace = () => {
    if (!globalPace) return;
    const updatedSplits = splits.map(split => ({
      ...split,
      pace: globalPace
    }));
    setSplits(updatedSplits);
  };

  const handleUpdateSplit = (id: number, updates: Partial<{ distance: number; pace: string }>): void => {
    setSplits(splits.map(split => 
      split.id === id ? { ...split, ...updates } : split
    ));
  };

  const handleAddSplit = () => {
    setSplits([...splits, {
      id: Date.now(),
      distance: 1,
      pace: globalPace || '05:00'
    }]);
  };

  const handleRemoveSplit = (id: number): void => {
    setSplits(splits.filter(split => split.id !== id));
  };

  const calculateTotalTime = () => {
    const adjustment = calculatePaceAdjustment();
    return splits.reduce((total, split) => {
      const paceInMinutes = timeToMinutes(split.pace) * adjustment;
      return total + (paceInMinutes * split.distance);
    }, 0);
  };

  const totalDistance = splits.reduce((sum, split) => sum + (split.distance || 0), 0);
  const totalTime = calculateTotalTime();
  const averagePace = totalDistance > 0 ? totalTime / totalDistance : 0;
  const paceAdjustment = calculatePaceAdjustment();

  return (
    <div className="space-y-6">
      {/* Seleção de Distância */}
      <Card>
        <CardHeader>
          <CardTitle>Distância</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Select
              value={selectedDistance}
              onValueChange={setSelectedDistance}
            >
              <SelectTrigger className="w-full">
                <Ruler className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Selecione a distância" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PredefinedDistances).map(([key]) => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDistance === 'Personalizada' && (
            <div className="relative">
              <Input
                type="number"
                value={customDistance}
                onChange={(e) => setCustomDistance(parseFloat(e.target.value) || 0)}
                min={0.1}
                step={0.1}
                className="w-full"
                placeholder="Distância em km"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Condições Climáticas */}
      <Card>
        <CardHeader>
          <CardTitle>Condições Climáticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Temperatura (°C)</label>
              <div className="relative">
                <Input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  min={-20}
                  max={50}
                  className="pl-10"
                />
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Umidade (%)</label>
              <div className="relative">
                <Input
                  type="number"
                  value={humidity}
                  onChange={(e) => setHumidity(parseFloat(e.target.value))}
                  min={0}
                  max={100}
                  className="pl-10"
                />
                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vento (km/h)</label>
              <div className="relative">
                <Input
                  type="number"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                  min={0}
                  max={100}
                  className="pl-10"
                />
                <Wind className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {paceAdjustment > 1 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg flex items-start">
              <AlertTriangle className="text-yellow-500 mt-1 mr-2 shrink-0 h-4 w-4" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  Ajuste de Ritmo Necessário
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  As condições atuais podem tornar seu ritmo aproximadamente {((paceAdjustment - 1) * 100).toFixed(1)}% mais lento que o normal.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ritmo Global */}
      <Card>
        <CardHeader>
          <CardTitle>Ritmo Base</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                type="text"
                value={globalPace}
                onChange={(e) => handlePaceInput(e.target.value)}
                placeholder="00:00"
                className="pl-10"
              />
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={applyGlobalPace} className="w-full sm:w-auto">
              Aplicar a Todos os Splits
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Splits */}
      <Card>
        <CardHeader>
          <CardTitle>Splits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {splits.map((split, index) => (
                <motion.div
                  key={split.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Km {index + 1}</label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={split.distance}
                              onChange={(e) => handleUpdateSplit(split.id, {
                                distance: parseFloat(e.target.value) || 0
                              })}
                              step="0.1"
                              min="0.1"
                              className="pl-10"
                            />
                            <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Ritmo</label>
                          <div className="relative">
                            <Input
                              type="text"
                              value={split.pace || ''}
                              onChange={(e) => handlePaceInput(e.target.value, split.id)}
                              placeholder="00:00"
                              className="pl-10"
                            />
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="flex justify-end items-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSplit(split.id)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              variant="outline"
              onClick={handleAddSplit}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Split
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sumário */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Distância Total</div>
                <div className="text-2xl font-bold mt-1">{totalDistance.toFixed(2)} km</div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  {paceAdjustment > 1 ? 'Tempo Total (Ajustado)' : 'Tempo Total'}
                </div>
                <div className="text-2xl font-bold mt-1">{formatTotalTime(totalTime)}</div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  {paceAdjustment > 1 ? 'Ritmo Médio (Ajustado)' : 'Ritmo Médio'}
                </div>
                <div className="text-2xl font-bold mt-1">{minutesToTime(averagePace)}/km</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PacePlanner;