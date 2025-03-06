// components/trainingpeaks/Converter.tsx
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download } from "lucide-react";

interface TrainingPeaksConverterProps {
  thresholdPace: string;
}

interface PaceZone {
  name: string;
  zone: string;
  min: number;
  max: number;
  description: string;
}

export const TrainingPeaksConverter: React.FC<TrainingPeaksConverterProps> = ({ thresholdPace }) => {
  const [thresholdSeconds, setThresholdSeconds] = useState(240); // Padrão: 4:00 min/km
  const [copied, setCopied] = useState(false);
  
  // Zonas do TrainingPeaks
  // min = porcentagem que resulta em ritmo mais rápido (menor min/km)
  // max = porcentagem que resulta em ritmo mais lento (maior min/km)
  const activityToZoneMap = {
  'recovery': { 
    zone: 'Z1', 
    name: 'Recuperação', 
    range: { min: 50, max: 76 }, 
    description: 'Corridas muito fáceis para recuperação ativa'
  },
  'easy': { 
    zone: 'Z2', 
    name: 'Fácil', 
    range: { min: 76, max: 85 }, 
    description: 'Corridas aeróbicas que desenvolvem resistência base' 
  },
  'marathon': { 
    zone: 'Z3', 
    name: 'Maratona', 
    range: { min: 85, max: 100 }, 
    description: 'Ritmo específico para prova de maratona'
  },
  'threshold': { 
    zone: 'Z4', 
    name: 'Limiar', 
    range: { min: 100, max: 112 }, 
    description: 'Ritmo no limiar anaeróbico/lactato'
  },
  'interval': { 
    zone: 'Z5a', 
    name: 'Intervalo', 
    range: { min: 112, max: 130 }, 
    description: 'Treinos para maximizar VO2max'
  },
  'repetition': { 
    zone: 'Z5b', 
    name: 'Repetição', 
    range: { min: 130, max: 150 }, 
    description: 'Treinos para potência e economia de corrida'
  },
  'race': { 
    zone: 'Z4', 
    name: 'Limiar', 
    range: { min: 100, max: 112 }, 
    description: 'Ritmo no limiar anaeróbico/lactato'
  },
  'long': { 
    zone: 'Z2', 
    name: 'Fácil', 
    range: { min: 76, max: 85 }, 
    description: 'Corridas aeróbicas que desenvolvem resistência base'
  }
};

// Função utilitária para determinar zona de um percentual
function getZoneForPercentage(percentage: number) {
  for (const [key, zone] of Object.entries(activityToZoneMap)) {
    if (percentage >= zone.range.min && percentage < zone.range.max) {
      return { key, zone };
    }
  }
  return null;
}
  
  // Converter o ritmo de limiar para segundos
  useEffect(() => {
    const seconds = convertPaceToSeconds(thresholdPace);
    if (!isNaN(seconds) && seconds > 0) {
      setThresholdSeconds(seconds);
    }
  }, [thresholdPace]);
  
  // Converter formato mm:ss para segundos
  const convertPaceToSeconds = (pace: string): number => {
    if (!pace) return 240; // Padrão: 4:00
    const parts = pace.split(':');
    if (parts.length === 1) {
      return parseInt(parts[0]) * 60;
    }
    return (parseInt(parts[0]) * 60) + parseInt(parts[1] || '0');
  };
  
  // Calcular o ritmo a partir da porcentagem do limiar
  const calculatePaceFromPercentage = (percentage: number): string => {
    const paceSeconds = thresholdSeconds * (percentage / 100);
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Gerar texto CSV para TrainingPeaks
  const generateCsvForTrainingPeaks = () => {
    let csvContent = "Zone,Name,Low,High\n";
    
    paceZones.forEach((zone, index) => {
      // No TrainingPeaks:
      // "Low" é o valor mais rápido (menor tempo por km) = menor porcentagem
      // "High" é o valor mais lento (maior tempo por km) = maior porcentagem
      const lowPaceSeconds = thresholdSeconds * (zone.min / 100); // Valor mais rápido
      const highPaceSeconds = thresholdSeconds * (zone.max / 100); // Valor mais lento
      
      // TrainingPeaks espera segundos por km
      csvContent += `${zone.zone.replace('Z', '')},${zone.name},${Math.round(lowPaceSeconds)},${Math.round(highPaceSeconds)}\n`;
    });
    
    return csvContent;
  };
  
  // Copiar para o clipboard
  const copyToClipboard = () => {
    const text = generateCsvForTrainingPeaks();
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Erro ao copiar: ', err);
      });
  };
  
  // Download do CSV
  const downloadCsv = () => {
    const csvContent = generateCsvForTrainingPeaks();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'trainingpeaks_pace_zones.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
        <Button 
          onClick={copyToClipboard} 
          variant="outline"
          size="sm"
          className="h-8 gap-1"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="text-xs">Copiar para TrainingPeaks</span>
        </Button>
        
        <Button 
          onClick={downloadCsv} 
          variant="outline"
          size="sm"
          className="h-8 gap-1"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="text-xs">CSV</span>
        </Button>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>% do Limiar</TableHead>
              <TableHead>Ritmo (min/km)</TableHead>
              <TableHead className="hidden md:table-cell">Magic Training</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paceZones.map((zone, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{zone.zone}</TableCell>
                <TableCell>{zone.name}</TableCell>
                <TableCell>{zone.min}%-{zone.max}%</TableCell>
                <TableCell className="font-mono">
                  {calculatePaceFromPercentage(zone.min)}-{calculatePaceFromPercentage(zone.max)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {zone.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};