import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import TimeInput from './TimeInput';

interface RangeTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  showHours?: boolean;
  suffix?: string;
}

const RangeTimeInput: React.FC<RangeTimeInputProps> = ({ 
  value, 
  onChange, 
  className,
  showHours = false,
  suffix = "/km"
}) => {
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  
  // Parse initial value on mount or when value changes externally
  useEffect(() => {
    if (!value) {
      setMinValue('00:00');
      setMaxValue('00:00');
      return;
    }
    
    // Remove any suffix and trim
    const cleanValue = value.replace(/\/km|\/mi$/, '').trim();
    
    // Check if it's a range (contains "-")
    if (cleanValue.includes('-')) {
      const [min, max] = cleanValue.split('-').map(t => t.trim());
      setMinValue(min);
      setMaxValue(max);
    } else {
      // If it's not a range, use the same value for min and max with a small adjustment
      setMinValue(cleanValue);
      
      // For single values, calculate max pace as 12% slower than min
      try {
        // Parse time (assuming MM:SS format)
        const [minStr, secStr] = cleanValue.split(':');
        const totalSeconds = parseInt(minStr) * 60 + parseInt(secStr);
        const adjustedSeconds = Math.floor(totalSeconds * 1.12); // 12% slower
        
        const adjustedMin = Math.floor(adjustedSeconds / 60);
        const adjustedSec = adjustedSeconds % 60;
        
        setMaxValue(`${adjustedMin.toString().padStart(2, '0')}:${adjustedSec.toString().padStart(2, '0')}`);
      } catch (e) {
        // If parsing fails, just use the same value
        setMaxValue(cleanValue);
      }
    }
  }, [value]);
  
  // Update parent component when min or max changes
  const handleMinChange = (newMin: string) => {
    setMinValue(newMin);
    onChange(`${newMin}-${maxValue}`);
  };
  
  const handleMaxChange = (newMax: string) => {
    setMaxValue(newMax);
    onChange(`${minValue}-${newMax}`);
  };
  
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <div>
        <TimeInput
          value={minValue}
          onChange={handleMinChange}
          showHours={showHours}
          suffix={suffix}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <p className="text-xs text-muted-foreground mt-1">Mínimo</p>
      </div>
      <div>
        <TimeInput
          value={maxValue}
          onChange={handleMaxChange}
          showHours={showHours}
          suffix={suffix}
        />
        <p className="text-xs text-muted-foreground mt-1">Máximo</p>
      </div>
    </div>
  );
};

export default RangeTimeInput;