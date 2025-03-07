import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BarChart2, Save, AlertTriangle, Check } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { PlanSummary } from '@/models';
import TimeInput from '@/components/TimeInput';
import RangeTimeInput from '@/components/RangeTimeInput';
import VO2maxIndicator from '@/components/default/VO2maxConfig';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Import pace management utilities
import { 
  defaultTimes, 
  essentialPaces, 
  paceDescriptions, 
  paceDisplayNames,
  findClosestRaceParams, 
  findPaceValues,
  isValidPace,
  adjustPace,
  PaceSetting
} from '@/lib/pace-manager';

// Define ritmos que devem ter range
const RANGE_PACES = ['Recovery Km', 'Easy Km'];

interface ConfigurePacesProps {
  plan: PlanSummary;
  onSaveSettings: (settings: Record<string, string>) => Promise<void>;
  customPaces?: Record<string, string>;
  isAuthenticated?: boolean;
}

export function ConfigurePaces({ 
  plan, 
  onSaveSettings, 
  customPaces = {}, 
  isAuthenticated = false 
}: ConfigurePacesProps) {
  // Always start with 5km as default distance if not defined in customPaces
  const initialDistance = customPaces["baseDistance"] || "5km";
  const initialTime = customPaces["baseTime"] || defaultTimes[initialDistance] || "00:19:57";
  
  const [baseTime, setBaseTime] = useState(initialTime);
  const [baseDistance, setBaseDistance] = useState(initialDistance);
  const [params, setParams] = useState<number | null>(null);
  const [paceSettings, setPaceSettings] = useState<PaceSetting[]>([]);
  const [allPaces, setAllPaces] = useState<Record<string, string> | null>(null);
  const [adjustmentFactor, setAdjustmentFactor] = useState(
    parseFloat(customPaces["adjustmentFactor"] || "100")
  );
  const [startDate, setStartDate] = useState(
    customPaces["startDate"] || format(new Date(), "yyyy-MM-dd")
  );
  const [raceDate, setRaceDate] = useState(
    customPaces["raceDate"] || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isBaseTimeUpdated, setIsBaseTimeUpdated] = useState(false);

  // Calculate percentage for VO2max indicator
  const percentage = params ? (params / 85) * 100 : 0;

  // Extract time value from a pace
  const extractPaceTimeValue = (pace: PaceSetting): string => {
    if (!isValidPace(pace.value)) {
      return "00:00";
    }
    
    // Remove any "/km" suffix and trim
    return pace.value.replace(/\/km$/, '').trim();
  };

  // Create a range pace from a single value
  const createRangePace = (baseValue: string): string => {
    if (!isValidPace(baseValue)) {
      return "00:00-00:00";
    }
    
    try {
      // Parse time (assuming MM:SS format)
      const cleanValue = baseValue.replace(/\/km|\/mi$/, '').trim();
      const [minStr, secStr] = cleanValue.split(':');
      const totalSeconds = parseInt(minStr) * 60 + parseInt(secStr);
      
      // Base pace (fastest)
      const minSeconds = totalSeconds;
      
      // Max pace (12% slower)
      const maxSeconds = Math.floor(totalSeconds * 1.12);
      
      const minMin = Math.floor(minSeconds / 60);
      const minSec = minSeconds % 60;
      
      const maxMin = Math.floor(maxSeconds / 60);
      const maxSec = maxSeconds % 60;
      
      const minTime = `${minMin.toString().padStart(2, '0')}:${minSec.toString().padStart(2, '0')}`;
      const maxTime = `${maxMin.toString().padStart(2, '0')}:${maxSec.toString().padStart(2, '0')}`;
      
      return `${minTime}-${maxTime}`;
    } catch (e) {
      console.error("Error creating range pace:", e);
      return "00:00-00:00";
    }
  };

  // Apply adjustment to a range pace
  const adjustRangePace = (rangePace: string, factor: number): string => {
    if (!rangePace.includes('-')) {
      // If it's not a range format, convert it to a range first
      rangePace = createRangePace(rangePace);
    }
    
    const [min, max] = rangePace.split('-').map(t => t.trim());
    
    // Adjust both min and max values
    const adjustedMin = adjustPace(min, factor);
    const adjustedMax = adjustPace(max, factor);
    
    return `${adjustedMin}-${adjustedMax}`;
  };

  // Handle distance change and update default time accordingly
  const handleDistanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistance = e.target.value;
    setBaseDistance(newDistance);
    
    // Always set the default time for this distance to ensure consistency
    setBaseTime(defaultTimes[newDistance] || "00:00:00");
    setIsBaseTimeUpdated(true);
    
    // Reset adjustment factor to 100% when changing the base distance
    setAdjustmentFactor(100);
  };

  // Handle manual time change
  const handleTimeChange = (newTime: string) => {
    setBaseTime(newTime);
    setIsBaseTimeUpdated(true);
    
    // Reset adjustment factor to 100% when manually changing the base time
    setAdjustmentFactor(100);
  };

   // Carregar configurações do localStorage para usuários não autenticados
   useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      const localPaceSettings = localStorage.getItem(`pace_settings_${plan.path}`);
      
      if (localPaceSettings) {
        try {
          const parsedSettings = JSON.parse(localPaceSettings);
          
          // Atualizar estados com as configurações locais
          if (parsedSettings.startDate) {
            setStartDate(parsedSettings.startDate);
          }
          
          if (parsedSettings.baseTime && parsedSettings.baseDistance) {
            setBaseTime(parsedSettings.baseTime);
            setBaseDistance(parsedSettings.baseDistance);
          }
          
          if (parsedSettings.adjustmentFactor) {
            setAdjustmentFactor(parseFloat(parsedSettings.adjustmentFactor));
          }
          
          if (parsedSettings.raceDate) {
            setRaceDate(parsedSettings.raceDate);
          }
        } catch (error) {
          console.error('Erro ao carregar configurações locais:', error);
        }
      }
    }
  }, [isAuthenticated, plan.path]);

  // Update parameters when base time changes
  useEffect(() => {
    const newParams = findClosestRaceParams(baseTime, baseDistance);
    setParams(newParams);
    
    // Mark that we've processed the base time update
    if (isBaseTimeUpdated) {
      setIsBaseTimeUpdated(false);
    }
  }, [baseTime, baseDistance, isBaseTimeUpdated]);

  // Calculate paces when parameters change
  useEffect(() => {
    if (params !== null) {
      const calculatedPaces = findPaceValues(params);
      
      if (calculatedPaces) {
        setAllPaces(calculatedPaces);
        
        // Create settings array with all essential paces
        const settings: PaceSetting[] = [];
        
        // First, ensure Recovery and Easy paces are included with good defaults,
        // even if they're not part of the calculated paces
        const recoveryDefault = calculatedPaces["Recovery Km"] || "6:00";
        const easyDefault = calculatedPaces["Easy Km"] || "5:30";
        
        // For range paces, we need to convert single values to ranges
        const recoveryDefaultRange = createRangePace(recoveryDefault);
        const easyDefaultRange = createRangePace(easyDefault);
        
        // Always include Recovery and Easy paces first
        settings.push({
          name: "Recovery Km",
          value: customPaces["custom_Recovery Km"] || 
                 (adjustmentFactor !== 100 ? adjustRangePace(recoveryDefaultRange, adjustmentFactor) : recoveryDefaultRange),
          default: recoveryDefaultRange,
          isCustom: !!customPaces["custom_Recovery Km"] || adjustmentFactor !== 100,
          description: paceDescriptions["Recovery Km"] || "Ritmo muito leve para recuperação ativa"
        });
        
        settings.push({
          name: "Easy Km",
          value: customPaces["custom_Easy Km"] || 
                 (adjustmentFactor !== 100 ? adjustRangePace(easyDefaultRange, adjustmentFactor) : easyDefaultRange),
          default: easyDefaultRange,
          isCustom: !!customPaces["custom_Easy Km"] || adjustmentFactor !== 100,
          description: paceDescriptions["Easy Km"] || "Ritmo fácil - use para a maioria dos treinos"
        });
        
        // Process all other essential paces (skipping Recovery and Easy which we've already added)
        essentialPaces
          .filter(key => key !== "Recovery Km" && key !== "Easy Km")
          .forEach(key => {
            const isCustomKey = `custom_${key}`;
            const customValue = customPaces[isCustomKey];
            const defaultValue = calculatedPaces[key] || "";
            
            // For newly calculated paces, apply the adjustment factor if needed
            let effectiveValue = defaultValue;
            if (adjustmentFactor !== 100) {
              effectiveValue = adjustPace(defaultValue, adjustmentFactor);
            }
            
            // Use custom value if available and valid, otherwise use the calculated value
            settings.push({
              name: key,
              value: customValue && isValidPace(customValue) ? customValue : effectiveValue,
              default: defaultValue,
              isCustom: !!(customValue && isValidPace(customValue)) || adjustmentFactor !== 100,
              description: paceDescriptions[key] || ""
            });
          });
        
        // Filter out invalid paces except for Recovery Km and Easy Km which should always be included
        const validSettings = settings.filter(setting => 
          setting.name === "Recovery Km" || 
          setting.name === "Easy Km" || 
          isValidPace(setting.default) || 
          isValidPace(setting.value)
        );
        
        setPaceSettings(validSettings);
      }
    }
  }, [params, customPaces, adjustmentFactor]);

  // Apply adjustment factor to all paces
  const applyAdjustmentFactor = () => {
    if (!allPaces) return;
    
    // Apply adjustment to all paces
    const adjustedSettings = paceSettings.map(setting => {
      // Check if this is a range pace
      if (RANGE_PACES.includes(setting.name)) {
        return {
          ...setting,
          value: adjustRangePace(setting.default, adjustmentFactor),
          isCustom: true
        };
      } else {
        return {
          ...setting,
          value: adjustPace(setting.default, adjustmentFactor),
          isCustom: true
        };
      }
    });
    
    setPaceSettings(adjustedSettings);
    toast.success("Ajuste global aplicado a todos os ritmos");
  };

  // Update a specific pace
  const updatePaceSetting = (index: number, newValue: string) => {
    const newSettings = [...paceSettings];
    
    newSettings[index] = {
      ...newSettings[index],
      value: newValue,
      isCustom: newValue !== newSettings[index].default
    };
    
    setPaceSettings(newSettings);
  };

  // Reset a pace to default value
  const resetPaceSetting = (index: number) => {
    const newSettings = [...paceSettings];
    
    // Apply the current adjustment factor to the default value
    let adjustedDefaultValue;
    
    if (RANGE_PACES.includes(newSettings[index].name)) {
      adjustedDefaultValue = adjustmentFactor !== 100 
        ? adjustRangePace(newSettings[index].default, adjustmentFactor)
        : newSettings[index].default;
    } else {
      adjustedDefaultValue = adjustmentFactor !== 100 
        ? adjustPace(newSettings[index].default, adjustmentFactor)
        : newSettings[index].default;
    }
      
    newSettings[index] = {
      ...newSettings[index],
      value: adjustedDefaultValue,
      isCustom: adjustmentFactor !== 100
    };
    
    setPaceSettings(newSettings);
    toast.info(`Ritmo resetado para o valor ${adjustmentFactor !== 100 ? 'ajustado' : 'padrão'}`);
  };

  // Reset all paces to default values with current adjustment factor
  const resetAllPaces = () => {
    const defaultSettings = paceSettings.map(setting => {
      let adjustedDefaultValue;
      
      if (RANGE_PACES.includes(setting.name)) {
        adjustedDefaultValue = adjustmentFactor !== 100 
          ? adjustRangePace(setting.default, adjustmentFactor)
          : setting.default;
      } else {
        adjustedDefaultValue = adjustmentFactor !== 100 
          ? adjustPace(setting.default, adjustmentFactor)
          : setting.default;
      }
      
      return {
        ...setting,
        value: adjustedDefaultValue,
        isCustom: adjustmentFactor !== 100
      };
    });
    
    setPaceSettings(defaultSettings);
    toast.info(`Todos os ritmos foram resetados para valores ${adjustmentFactor !== 100 ? 'ajustados' : 'padrão'}`);
  };

  // Save all settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Prepare data to save
      const settingsToSave: Record<string, string> = {
        baseTime,
        baseDistance,
        adjustmentFactor: adjustmentFactor.toString(),
        startDate
      };
      
      // Add race date if it exists
      if (raceDate) {
        settingsToSave.raceDate = raceDate;
      }
      
      // Add custom paces
      paceSettings.forEach(setting => {
        if (setting.isCustom || setting.name === "Recovery Km" || setting.name === "Easy Km") {
          settingsToSave[`custom_${setting.name}`] = setting.value;
        }
      });
      
      // Call save function
      await onSaveSettings(settingsToSave);
      
      setSaveSuccess(true);
      toast.success("Configurações salvas com sucesso!");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Não foi possível salvar as configurações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Ritmos</CardTitle>
          <CardDescription>
            Personalize os ritmos do plano {plan.name} com base nas suas necessidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date configuration */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial do Plano</Label>
              <div className="relative">
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Esta é a data em que você vai começar (ou começou) o plano de treinamento.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="raceDate">Data da Prova <span className="text-muted-foreground">(opcional)</span></Label>
              <div className="relative">
                <Input
                  type="date"
                  id="raceDate"
                  value={raceDate}
                  onChange={(e) => setRaceDate(e.target.value)}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Data da prova alvo para a qual você está treinando.
              </p>
            </div>
          </div>

          <Separator />
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Base pace configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Ritmo Base</h3>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseDistance">Distância de Referência</Label>
                  <select
                    id="baseDistance"
                    value={baseDistance}
                    onChange={handleDistanceChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="5km">5km</option>
                    <option value="10km">10km</option>
                    <option value="21km">Meia Maratona (21km)</option>
                    <option value="42km">Maratona (42km)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Ao mudar a distância, os valores são recalculados e o ajuste global é resetado para 100%
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseTime">Seu Tempo na Distância</Label>
                  <div className="relative">
                    <TimeInput
                      value={baseTime}
                      onChange={handleTimeChange}
                      showHours={true}
                      icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ao mudar seu tempo, os ritmos são recalculados e o ajuste global é resetado para 100%
                  </p>
                </div>

                {/* VO2max indicator */}
                {params !== null && (
                  <div className="pt-2">
                    <VO2maxIndicator params={params} percentage={percentage} />
                  </div>
                )}
              </div>
            </div>

            {/* Global adjustment */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Ajuste Global</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="adjustmentFactor">Fator de Ajuste Global</Label>
                    <span className="text-sm text-muted-foreground">{adjustmentFactor}%</span>
                  </div>
                  <Slider
                    id="adjustmentFactor"
                    value={[adjustmentFactor]}
                    min={80}
                    max={120}
                    step={1}
                    onValueChange={(value) => setAdjustmentFactor(value[0])}
                  />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Valores menores = ritmos mais rápidos</span> (para atletas mais avançados)<br/>
                    <span className="font-medium">Valores maiores = ritmos mais lentos</span> (para iniciantes)
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={applyAdjustmentFactor}
                    className="flex-1"
                  >
                    Aplicar Ajuste Global
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetAllPaces}
                    className="flex-1 border-muted-foreground/30"
                  >
                    Resetar Todos
                  </Button>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground">
                    <AlertTriangle className="inline-block h-3 w-3 mr-1" />
                    Mudar a distância ou o tempo de referência redefine o ajuste global para 100%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Calculated paces */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Ritmos Calculados
              </h3>
              <p className="text-sm text-muted-foreground">
                VO₂Max estimado: {params || "N/A"} ml/kg/min
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paceSettings.map((pace, index) => (
                <div key={pace.name} className="space-y-2 bg-muted/20 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {paceDisplayNames[pace.name] || pace.name}
                      {pace.isCustom && (
                        <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 text-xs">
                          Personalizado
                        </Badge>
                      )}
                    </Label>
                    <button
                      onClick={() => resetPaceSetting(index)}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Resetar
                    </button>
                  </div>
                  
                  {RANGE_PACES.includes(pace.name) ? (
                    <RangeTimeInput
                      value={extractPaceTimeValue(pace)}
                      onChange={(value) => updatePaceSetting(index, value)}
                      showHours={false}
                      suffix="/km"
                      className="flex-1"
                    />
                  ) : (
                    <TimeInput
                      value={extractPaceTimeValue(pace)}
                      onChange={(value) => updatePaceSetting(index, value)}
                      showHours={false}
                      suffix="/km"
                      className="flex-1"
                    />
                  )}
                  
                  {pace.description && (
                    <p className="text-xs text-muted-foreground italic">
                      {pace.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>Salvando...</>
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4" />
              Configurações Salvas!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}