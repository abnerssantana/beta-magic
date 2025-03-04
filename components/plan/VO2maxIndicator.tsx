import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const getVO2maxLevel = (vo2max: number) => {
  if (vo2max >= 75) return { label: 'Elite', color: 'text-emerald-500' };
  if (vo2max >= 65) return { label: 'Excelente', color: 'text-green-500' };
  if (vo2max >= 55) return { label: 'Muito Bom', color: 'text-blue-500' };
  if (vo2max >= 45) return { label: 'Bom', color: 'text-yellow-500' };
  if (vo2max >= 35) return { label: 'Regular', color: 'text-orange-500' };
  return { label: 'Iniciante', color: 'text-red-500' };
};

interface VO2maxIndicatorProps {
  params: number;
  percentage: number;
}

const VO2maxIndicator: React.FC<VO2maxIndicatorProps> = ({ params, percentage }) => {
  const level = getVO2maxLevel(params);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium block h-6 leading-6">
          VO2max estimado
        </label>
        <span className={`text-sm font-medium ${level.color}`}>
          {level.label}
        </span>
      </div>
      
      <div className="w-full h-9 bg-secondary/50 relative rounded-md overflow-hidden ring-2 ring-border">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-r from-red-500/20 via-yellow-500/20 to-green-500/20" />
        
        {/* Progress Bar */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-linear-to-r from-red-500 via-yellow-500 to-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Marker Line */}
        <motion.div
          className="absolute top-0 h-full w-0.5 bg-white shadow-xs"
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
    </div>
  );
};

export default VO2maxIndicator;