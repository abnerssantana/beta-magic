import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange, className }) => {
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  const [focused, setFocused] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h = '00', m = '00', s = '00'] = value.split(':');
      setHours(h.padStart(2, '0'));
      setMinutes(m.padStart(2, '0'));
      setSeconds(s.padStart(2, '0'));
    }
  }, [value]);

  const updateValue = (newHours: string, newMinutes: string, newSeconds: string) => {
    onChange(`${newHours}:${newMinutes}:${newSeconds}`);
  };

  const handleInputChange = (part: 'hours' | 'minutes' | 'seconds', value: string) => {
    const numValue = parseInt(value) || 0;
    let newValue = numValue.toString().padStart(2, '0');

    switch (part) {
      case 'hours':
        newValue = Math.min(99, numValue).toString().padStart(2, '0');
        setHours(newValue);
        updateValue(newValue, minutes, seconds);
        break;
      case 'minutes':
        newValue = Math.min(59, numValue).toString().padStart(2, '0');
        setMinutes(newValue);
        updateValue(hours, newValue, seconds);
        break;
      case 'seconds':
        newValue = Math.min(59, numValue).toString().padStart(2, '0');
        setSeconds(newValue);
        updateValue(hours, minutes, newValue);
        break;
    }
  };

  return (
    <div className="relative">
      <div 
        className={cn(
          "flex items-center pl-10 rounded-md ring-offset-background",
          "border border-input bg-background",
          focused && "ring-2 ring-ring ring-offset-2",
          className
        )}
      >
        <Clock className="absolute left-3 h-4 w-4 text-muted-foreground" />
        
        <Input
          type="number"
          value={hours}
          onChange={(e) => handleInputChange('hours', e.target.value)}
          className="w-12 border-0 p-2 text-center focus:ring-0 focus-visible:ring-0"
          min="0"
          max="99"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <span className="text-muted-foreground px-0.5">:</span>
        <Input
          type="number"
          value={minutes}
          onChange={(e) => handleInputChange('minutes', e.target.value)}
          className="w-12 border-0 p-2 text-center focus:ring-0 focus-visible:ring-0"
          min="0"
          max="59"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <span className="text-muted-foreground px-0.5">:</span>
        <Input
          type="number"
          value={seconds}
          onChange={(e) => handleInputChange('seconds', e.target.value)}
          className="w-12 border-0 p-2 text-center focus:ring-0 focus-visible:ring-0"
          min="0"
          max="59"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </div>
  );
};

export default TimeInput;