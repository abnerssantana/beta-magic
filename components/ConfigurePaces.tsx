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
import VO2maxIndicator from '@/components/default/VO2maxConfig';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  defaultTimes, 
  essentialPaces, 
  paceDescriptions, 
  paceDisplayNames,
  findClosestRaceParams, 
  findPaceValues,
  isValidPace,
  adjustPace
} from '@/lib/pace-manager';

// Interface para representar uma configuração de ritmo
interface PaceSetting {
  name: string;       // Nome do ritmo (ex: "Easy Km")
  value: string;      // Valor atual (pode ser personalizado)
  default: string;    // Valor padrão calculado
  isCustom: boolean;  // Se foi personalizado pelo usuário
  description?: string; // Descrição opcional
}

interface ConfigurePacesProps {
  plan: PlanSummary;
  onSaveSettings: (settings: Record<string, string>) => Promise<void>;
  customPaces?: Record<string, string>;
}

export function ConfigurePaces({ plan, onSaveSettings, customPaces = {} }: ConfigurePacesProps) {
  // Estados principais
  const [baseTime, setBaseTime] = useState(customPaces["baseTime"] || "00:19:57");
  const [baseDistance, setBaseDistance] = useState(customPaces["baseDistance"] || "5km");
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

  // Calcular percentual para VO2max indicator
  const percentage = params ? (params / 85) * 100 : 0;

  // Extrair valor de tempo de um ritmo
  const extractPaceTimeValue = (pace: PaceSetting): string => {
    if (!isValidPace(pace.value)) {
      return "00:00";
    }
    
    // A função normalizePace já está incluída na biblioteca pace-manager
    return pace.value.replace(/\/km$/, '').trim();
  };

  // Atualizar parâmetros quando o tempo base mudar
  useEffect(() => {
    const newParams = findClosestRaceParams(baseTime, baseDistance);
    setParams(newParams);
  }, [baseTime, baseDistance]);

  // Calcular ritmos quando os parâmetros mudarem
  useEffect(() => {
    if (params !== null) {
      const calculatedPaces = findPaceValues(params);
      setAllPaces(calculatedPaces);

      // Transformar em configurações de ritmo
      if (calculatedPaces) {
        // Mapear apenas os ritmos essenciais
        const settings: PaceSetting[] = essentialPaces
          .map(key => {
            const isCustomKey = `custom_${key}`;
            const customValue = customPaces[isCustomKey];
            const defaultValue = calculatedPaces[key] || "00:00";
            
            return {
              name: key,
              value: customValue && isValidPace(customValue) ? customValue : defaultValue,
              default: defaultValue,
              isCustom: !!(customValue && isValidPace(customValue)),
              description: paceDescriptions[key] || ""
            };
          })
          .filter(setting => isValidPace(setting.default)); // Filtrar apenas ritmos válidos
        
        setPaceSettings(settings);
      }
    }
  }, [params, customPaces]);

  // Aplicar o fator de ajuste a todos os ritmos
  const applyAdjustmentFactor = () => {
    if (!allPaces) return;
    
    // Aplicar o ajuste a todos os ritmos usando a função adjustPace
    const adjustedSettings = paceSettings.map(setting => {
      return {
        ...setting,
        value: adjustPace(setting.default, adjustmentFactor),
        isCustom: true
      };
    });
    
    setPaceSettings(adjustedSettings);
    toast.success("Ajuste global aplicado a todos os ritmos");
  };

  // Função para atualizar um ritmo específico
  const updatePaceSetting = (index: number, newValue: string) => {
    const newSettings = [...paceSettings];
    
    // Não precisa formatar o valor, pois TimeInput já retorna o formato correto
    newSettings[index] = {
      ...newSettings[index],
      value: newValue,
      isCustom: newValue !== newSettings[index].default
    };
    
    setPaceSettings(newSettings);
  };

  // Função para resetar um ritmo para o valor padrão
  const resetPaceSetting = (index: number) => {
    const newSettings = [...paceSettings];
    newSettings[index] = {
      ...newSettings[index],
      value: newSettings[index].default,
      isCustom: false
    };
    
    setPaceSettings(newSettings);
    toast.info(`Ritmo resetado para o valor padrão`);
  };

  // Resetar todos os ritmos para valores padrão
  const resetAllPaces = () => {
    const defaultSettings = paceSettings.map(setting => ({
      ...setting,
      value: setting.default,
      isCustom: false
    }));
    
    setPaceSettings(defaultSettings);
    setAdjustmentFactor(100);
    toast.info("Todos os ritmos foram resetados para valores padrão");
  };

  // Salvar todas as configurações
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Preparar dados para salvar
      const settingsToSave: Record<string, string> = {
        baseTime,
        baseDistance,
        adjustmentFactor: adjustmentFactor.toString(),
        startDate
      };
      
      // Adicionar data da prova se existir
      if (raceDate) {
        settingsToSave.raceDate = raceDate;
      }
      
      // Adicionar ritmos personalizados
      paceSettings.forEach(setting => {
        if (setting.isCustom) {
          settingsToSave[`custom_${setting.name}`] = setting.value;
        }
      });
      
      // Chamar função de salvamento
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
          {/* Configuração de datas */}
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
            {/* Configuração de ritmo base */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Ritmo Base</h3>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseDistance">Distância de Referência</Label>
                  <select
                    id="baseDistance"
                    value={baseDistance}
                    onChange={(e) => setBaseDistance(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="5km">5km</option>
                    <option value="10km">10km</option>
                    <option value="21km">Meia Maratona (21km)</option>
                    <option value="42km">Maratona (42km)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseTime">Seu Tempo na Distância</Label>
                  <div className="relative">
                    <TimeInput
                      value={baseTime}
                      onChange={setBaseTime}
                      showHours={true}
                      icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Insira o tempo que você consegue correr na distância selecionada
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

            {/* Ajuste global */}
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
              </div>
            </div>
          </div>

          <Separator />

          {/* Ritmos Calculados */}
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
                  <TimeInput
                    value={extractPaceTimeValue(pace)}
                    onChange={(value) => updatePaceSetting(index, value)}
                    showHours={false}
                    suffix="/km"
                    className="flex-1"
                  />
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