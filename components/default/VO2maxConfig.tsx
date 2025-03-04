import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VO2MaxLevel {
  label: string;
  color: string;
  range: string;
  description: string;
}

const getVO2maxLevel = (vo2max: number): VO2MaxLevel => {
  if (vo2max >= 75) return { 
    label: 'Elite', 
    color: 'text-emerald-500', 
    range: '75+',
    description: 'Nível de atleta profissional de elite, capaz de competir em nível internacional.' 
  };
  if (vo2max >= 65) return { 
    label: 'Excelente', 
    color: 'text-green-500', 
    range: '65-74',
    description: 'Performance excepcional, comparável a atletas de alta competição.' 
  };
  if (vo2max >= 55) return { 
    label: 'Muito Bom', 
    color: 'text-blue-500', 
    range: '55-64',
    description: 'Condicionamento avançado, acima da média de corredores experientes.' 
  };
  if (vo2max >= 45) return { 
    label: 'Bom', 
    color: 'text-yellow-500', 
    range: '45-54',
    description: 'Boa condição física, típica de corredores regulares e praticantes de esportes.' 
  };
  if (vo2max >= 35) return { 
    label: 'Regular', 
    color: 'text-orange-500', 
    range: '35-44',
    description: 'Condicionamento médio, comum em pessoas moderadamente ativas.' 
  };
  return { 
    label: 'Iniciante', 
    color: 'text-red-500', 
    range: '<35',
    description: 'Nível de condicionamento inicial, típico de quem começa a praticar atividades físicas.' 
  };
};

interface VO2maxIndicatorProps {
  params: number;
  percentage: number;
  showInfo?: boolean;
  className?: string;
}

const VO2maxIndicator: React.FC<VO2maxIndicatorProps> = ({ 
  params, 
  percentage, 
  showInfo = true,
  className 
}) => {
  const level = getVO2maxLevel(params);
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-1.5">
          VO₂max estimado
          {showInfo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" align="start" className="max-w-80">
                  <p className="text-sm">
                    O VO₂max é a taxa máxima de consumo de oxigênio durante o exercício. 
                    É um indicador importante da sua capacidade aeróbica e fitness cardiovascular.
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium">Classificação:</p>
                    <ul className="text-xs space-y-0.5">
                      <li><span className="text-emerald-500 font-medium">Elite:</span> 75+ ml/kg/min</li>
                      <li><span className="text-green-500 font-medium">Excelente:</span> 65-74 ml/kg/min</li>
                      <li><span className="text-blue-500 font-medium">Muito Bom:</span> 55-64 ml/kg/min</li>
                      <li><span className="text-yellow-500 font-medium">Bom:</span> 45-54 ml/kg/min</li>
                      <li><span className="text-orange-500 font-medium">Regular:</span> 35-44 ml/kg/min</li>
                      <li><span className="text-red-500 font-medium">Iniciante:</span> &lt;35 ml/kg/min</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </label>
        <span className={`text-sm font-medium ${level.color}`}>
          {level.label}
        </span>
      </div>
      
      <div className="w-full h-9 bg-secondary/50 relative rounded-md overflow-hidden ring-2 ring-border">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20" />
        
        {/* Progress Bar */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Marker Line */}
        <motion.div
          className="absolute top-0 h-full w-0.5 bg-white shadow-md"
          initial={{ left: 0 }}
          animate={{ left: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center text-foreground font-medium">
          <Heart className="mr-2 h-4 w-4" />
          <span>{params} ml/kg/min</span>
        </div>
      </div>
      
      {/* Level description */}
      <p className="text-xs text-muted-foreground">
        <span className={`font-medium ${level.color}`}>{level.label} ({level.range} ml/kg/min):</span> {level.description}
      </p>
    </div>
  );
};

export default VO2maxIndicator;