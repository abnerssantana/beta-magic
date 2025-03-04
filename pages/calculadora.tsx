import React, { useState, useEffect } from "react";
import Head from "next/head";
import { Layout } from "@/components/layout";
import { HeroLayout } from "@/components/default/HeroLayout";
import {
  Info,
  Heart,
  Ruler,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TimeInput from "@/components/TimeInput";
import { races, paces } from "@/lib/PacesRaces";
import {
  PaceData,
  RaceDistance,
  PaceCalculatorProps, RhythmZones,
} from '@/types/calculator';
import { motion, AnimatePresence } from "framer-motion";

const defaultTimes = {
  "1500m": "00:05:24",
  "1600m": "00:05:50",
  "3km": "00:11:33",
  "3200m": "00:12:28",
  "5km": "00:19:57",
  "10km": "00:41:21",
  "15km": "01:03:36",
  "21km": "01:31:35",
  "42km": "03:10:49"
};

const initialRhythmZones: RhythmZones = {
  recuperação: { min: 58, max: 65, bpmMin: "", bpmMax: "" },
  fácil: { min: 65, max: 79, bpmMin: "", bpmMax: "" },
  maratona: { min: 80, max: 90, bpmMin: "", bpmMax: "" },
  limiar: { min: 88, max: 92, bpmMin: "", bpmMax: "" },
  intervalado: { min: 98, max: 100, bpmMin: "", bpmMax: "" },
  repetição: { min: 99, max: 102, bpmMin: "", bpmMax: "" },
};

// Sub-components
const AnimatedNumber = ({ value }: { value: string | number }) => (
  <motion.span
    key={value}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
  >
    {value}
  </motion.span>
);

const PaceCalculator = ({
  selectedTime,
  selectedDistance,
  handleTimeChange,
  handleDistanceChange,
  params,
  selectedPaces,
  percentage
}: PaceCalculatorProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Calculadora de Ritmo</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Distância</label>
            <Select
              value={selectedDistance}
              onValueChange={(value: RaceDistance) => handleDistanceChange(value)}
            >
              <SelectTrigger className="w-full">
                <Ruler className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Selecione a distância" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(defaultTimes).map((distance) => (
                  <SelectItem key={distance} value={distance as RaceDistance}>
                    {distance}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tempo</label>
            <TimeInput
              value={selectedTime}
              onChange={handleTimeChange}
            />
          </div>
        </div>

        {/* Stats Card */}
        <Card className="bg-linear-to-br from-primary to-primary/80">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Average Pace */}
              <div className="border-r border-primary-foreground/20">
                <div className="space-y-2">
                  <span className="text-sm text-primary-foreground/90">Ritmo Médio</span>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-primary-foreground">
                      {(() => {
                        const [h = "0", m = "0", s = "0"] = selectedTime.split(":");
                        const totalSeconds = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
                        const distance = selectedDistance.endsWith('km')
                          ? parseFloat(selectedDistance)
                          : parseFloat(selectedDistance) / 1000;

                        if (totalSeconds && distance) {
                          const paceMinutes = Math.floor((totalSeconds / distance) / 60);
                          const paceSeconds = Math.round((totalSeconds / distance) % 60);
                          return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
                        }
                        return '-:--';
                      })()}
                    </span>
                    <span className="ml-2 text-sm text-primary-foreground/90">/km</span>
                  </div>
                </div>
              </div>

              {/* VO2max */}
              <div className="space-y-2">
                <span className="text-sm text-primary-foreground/90">VO2max estimado</span>
                <div className="text-4xl font-bold text-primary-foreground">
                  <AnimatedNumber value={params || '-'} />
                </div>
                <div className="w-full bg-primary-foreground/20 rounded-full h-1.5">
                  <motion.div
                    className="bg-linear-to-r from-destructive to-emerald-500 rounded-full h-1.5"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Paces */}
      {selectedPaces && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Ritmos de Treinamento</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'Recovery Km', label: 'Ritmo de Recuperação' },
              { key: 'Easy Km', label: 'Ritmo Fácil' },
              { key: 'M Km', label: 'Ritmo de Maratona' },
              { key: 'T Km', label: 'Ritmo de Limiar' },
              { key: 'I Km', label: 'Ritmo de Intervalo' },
              { key: 'R 1000m', label: 'Ritmo de Repetição' }
            ].map(({ key, label }) => (
              <Card key={key} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-lg font-semibold">
                    <AnimatedNumber value={selectedPaces[key] || '-'} /> /km
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Race Time Predictions */}
      {params && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Previsão de Tempos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {["1500m", "1600m", "3km", "5km", "10km", "15km", "21km", "42km"].map((distance) => {
              const raceData = races.find((race) => race.Params === params);
              const predictedTime = raceData?.[distance as keyof typeof raceData];

              return (
                <Card key={distance} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">{distance}</div>
                    <div className="text-lg font-semibold">
                      <AnimatedNumber value={predictedTime || '-'} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const HeartRateZones = ({
  fcMaxima,
  handleHRInput,
  rhythmZones
}: {
  fcMaxima: string;
  handleHRInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rhythmZones: RhythmZones;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Zonas de Frequência Cardíaca</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="w-full">
        <div className="relative">
          <Input
            type="number"
            value={fcMaxima}
            onChange={handleHRInput}
            placeholder="Digite sua FC máxima"
            className="pl-10"
          />
          <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Object.entries(rhythmZones).map(([zone, { min, max, bpmMin, bpmMax }]) => (
            <motion.div
              key={zone}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
            >
              <Card className="bg-muted/50 h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium capitalize">Zona {zone}</h3>
                      <span className="text-xs text-muted-foreground">
                        {`${min}%-${max}%`}
                      </span>
                    </div>

                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-linear-to-r from-destructive to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{
                          width: fcMaxima ? `${(max / 102) * 100}%` : "0%"
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-2xl font-bold tracking-tight">
                      {bpmMin && bpmMax ? (
                        <span>
                          {bpmMin}
                          <span className="text-muted-foreground/50 mx-2">-</span>
                          {bpmMax}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">batimentos/min</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Main Component
export default function CalculatorPage() {
  const [selectedTime, setSelectedTime] = useState("00:19:57");
  const [selectedDistance, setSelectedDistance] = useState<RaceDistance>("5km");
  const [params, setParams] = useState<number | null>(null);
  const [selectedPaces, setSelectedPaces] = useState<PaceData | null>(null);
  const [fcMaxima, setFcMaxima] = useState("");
  const [rhythmZones, setRhythmZones] = useState<RhythmZones>(initialRhythmZones);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  // Utility functions
  const timeToSeconds = (time: string): number => {
    const [h = 0, m = 0, s = 0] = time.split(":").map(parseFloat);
    return (h * 3600) + (m * 60) + s;
  };

  const calculateRhythms = (fc: number): void => {
    const newRhythms = { ...rhythmZones };
    Object.entries(newRhythms).forEach(([key, value]) => {
      newRhythms[key] = {
        ...value,
        bpmMin: Math.round(fc * (value.min / 100)),
        bpmMax: Math.round(fc * (value.max / 100))
      };
    });
    setRhythmZones(newRhythms);
  };

  // Event handlers
  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
  };

  const handleDistanceChange = (value: RaceDistance) => {
    setSelectedDistance(value);
    setSelectedTime(defaultTimes[value as RaceDistance]);
    setParams(null);
  };

  const handleHRInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFcMaxima(value);
    const fcValue = parseInt(value);
    if (!isNaN(fcValue) && fcValue > 0) {
      calculateRhythms(fcValue);
    }
  };

  // Effects
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedTime", selectedTime);
      localStorage.setItem("selectedDistance", selectedDistance);
    }
  }, [selectedTime, selectedDistance]);

  useEffect(() => {
    if (selectedTime !== "00:00:00") {
      const inputSeconds = timeToSeconds(selectedTime);
      const closestRace = races.reduce((closest, current) => {
        const currentSeconds = timeToSeconds(current[selectedDistance as RaceDistance]);
        const closestSeconds = timeToSeconds(closest[selectedDistance as RaceDistance]);
        return Math.abs(currentSeconds - inputSeconds) <
          Math.abs(closestSeconds - inputSeconds)
          ? current
          : closest;
      }, races[0]);
      setParams(closestRace.Params);
    }
  }, [selectedTime, selectedDistance]);

  useEffect(() => {
    if (params) {
      const foundPaces = paces.find((pace) => pace.Params === params);
      if (foundPaces) {
        setSelectedPaces(foundPaces as PaceData);
      } else {
        setSelectedPaces(null);
      }
    } else {
      setSelectedPaces(null);
    }
  }, [params]);

  const percentage = params ? (params / 85) * 100 : 0;

  return (
    <Layout>
      <Head>
        <title>Calculadora de Ritmos de Corrida e Zonas de FC - Magic Training</title>
        <meta
          name="description"
          content="Otimize seus treinos de corrida com a Calculadora de Ritmos e Zonas de Frequência Cardíaca do Magic Training."
        />
      </Head>

      <div className="mx-auto">
        <HeroLayout
          title="Calculadora de Ritmos"
          description="Descubra seus ritmos ideais e frequências cardíacas para otimizar seus treinos de corrida.
            Lembre-se de que esses valores são guias e podem precisar de ajustes com base em sua resposta
            ao treinamento, condições externas e objetivos específicos."

          info={
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <p className="text-sm text-primary/90">
                      Dicas para usar as calculadoras e otimizar seu treinamento
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                    className="text-primary"
                  >
                    {isInfoExpanded ?
                      <ChevronUp className="h-4 w-4" /> :
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                </div>

                <AnimatePresence>
                  {isInfoExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4"
                    >
                      <ul className="space-y-2 text-sm text-primary/80 list-disc list-inside">
                        <li>Insira seu melhor tempo para a distância escolhida (dos últimos 3 meses)</li>
                        <li>Use a previsão de tempos para planejar objetivos</li>
                        <li>Insira sua FC máxima para obter zonas de frequências cardíacas</li>
                        <li>Ajuste seus treinos com base nos ritmos</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          }
        >
          <div className="space-y-6">
            <PaceCalculator
              selectedTime={selectedTime}
              selectedDistance={selectedDistance}
              handleTimeChange={handleTimeChange}
              handleDistanceChange={handleDistanceChange}
              params={params}
              selectedPaces={selectedPaces}
              percentage={percentage}
            />

            <HeartRateZones
              fcMaxima={fcMaxima}
              handleHRInput={handleHRInput}
              rhythmZones={rhythmZones}
            />
          </div>
        </HeroLayout>
      </div>
    </Layout>
  );
}