import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TimeInput from "@/components/TimeInput";
import { PlanModel } from "@/models";
import { Slider } from "@/components/ui/slider";
import { defaultTimes, findClosestRaceParams, findPaceValues } from "@/lib/plan-utils";
import { Check, Info, Save, AlertTriangle, ArrowLeft, Clock, Calendar, BarChart2 } from "lucide-react";
import { getPlanByPath } from "@/lib/db-utils";
import { getUserCustomPaces } from "@/lib/user-utils";
import { storageHelper } from "@/lib/plan-utils";
import VO2maxIndicator from "@/components/default/VO2maxConfig";
import { toast } from "sonner";

interface PaceSetting {
  name: string;
  value: string;
  default: string;
  isCustom: boolean;
  description?: string;
}

interface PlanSettingsProps {
  plan: PlanModel;
  customPaces: Record<string, string>;
  baseParams: number | null;
}

// Descrições dos ritmos para melhorar a compreensão
const paceDescriptions: Record<string, string> = {
  "Recovery Km": "Ritmo de recuperação - use após treinos intensos ou para recuperação ativa",
  "Easy Km": "Ritmo fácil - sua zona de conversação, para a maioria dos treinos",
  "M Km": "Ritmo de maratona - sustentável para provas longas",
  "T Km": "Ritmo de limiar - na fronteira entre aeróbico e anaeróbico",
  "I Km": "Ritmo de intervalo - para melhorar VO₂max em intervalos de 3-5 min",
  "R 1000m": "Ritmo de repetição - para treinar velocidade e economia de corrida",
  "I 800m": "Intervalo de 800m - ritmo ligeiramente mais rápido que o ritmo I",
  "R 400m": "Repetição de 400m - para desenvolvimento de velocidade"
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const { planPath } = context.params as { planPath: string };

  if (!session) {
    return {
      redirect: {
        destination: `/auth/signin?callbackUrl=/dashboard/plans/${planPath}/settings`,
        permanent: false,
      },
    };
  }

  try {
    const userId = session.user.id;
    const plan = await getPlanByPath(planPath);
    
    if (!plan) {
      return {
        notFound: true,
      };
    }

    // Obter os ritmos personalizados do usuário
    const customPaces = await getUserCustomPaces(userId, planPath);
    
    // Determinar parâmetros base para o plano
    // Usar 5km como distância de referência por padrão
    const baseTime = customPaces["baseTime"] || defaultTimes["5km"];
    const baseDistance = customPaces["baseDistance"] || "5km";
    const baseParams = findClosestRaceParams(baseTime, baseDistance);

    return {
      props: {
        plan: JSON.parse(JSON.stringify(plan)),
        customPaces: customPaces || {},
        baseParams
      },
    };
  } catch (error) {
    console.error(`Erro ao buscar configurações do plano ${planPath}:`, error);
    return {
      notFound: true,
    };
  }
};

const PlanSettings: React.FC<PlanSettingsProps> = ({
  plan,
  customPaces,
  baseParams,
}) => {
  const router = useRouter();
  const [baseTime, setBaseTime] = useState(customPaces["baseTime"] || defaultTimes["5km"]);
  const [baseDistance, setBaseDistance] = useState(customPaces["baseDistance"] || "5km");
  const [params, setParams] = useState(baseParams);
  const [paceSettings, setPaceSettings] = useState<PaceSetting[]>([]);
  const [allPaces, setAllPaces] = useState<Record<string, string> | null>(null);
  const [adjustmentFactor, setAdjustmentFactor] = useState(
    parseFloat(customPaces["adjustmentFactor"] || "100")
  );
  const [startDate, setStartDate] = useState(
    customPaces["startDate"] || storageHelper.getStartDate(plan.path)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("running");
  
  // Calcular percentual para VO2max indicator
  const percentage = params ? (params / 85) * 100 : 0;

  // Função para extrair o valor do tempo de um ritmo
  const extractPaceTimeValue = (pace: PaceSetting): string => {
    if (!pace.value || typeof pace.value !== 'string') {
      return "00:00";
    }
    
    // O ritmo está no formato "MM:SS" ou pode ter um sufixo "/km"
    // Remover qualquer texto adicional e manter apenas MM:SS
    const cleanValue = pace.value.replace(/\/km$/, '').trim();
    
    // Verificar se é um formato válido MM:SS
    if (/^\d{1,2}:\d{2}$/.test(cleanValue)) {
      return cleanValue;
    }
    
    return "00:00";
  };

  // Calcular ritmos quando os parâmetros mudarem
  useEffect(() => {
    if (params !== null) {
      const calculatedPaces = findPaceValues(params);
      setAllPaces(calculatedPaces);

      // Transformar em configurações de ritmo
      if (calculatedPaces) {
        const settings: PaceSetting[] = Object.entries(calculatedPaces)
          .filter(([key]) => key !== "Params")
          .map(([key, value]) => {
            const isCustomKey = `custom_${key}`;
            const customValue = customPaces[isCustomKey];
            
            // Garantir que value e customValue são strings
            const safeValue = typeof value === 'string' ? value : String(value || "00:00");
            const safeCustomValue = typeof customValue === 'string' ? customValue : String(customValue || "");
            
            return {
              name: key,
              value: safeCustomValue || safeValue,
              default: safeValue,
              isCustom: !!customValue,
              description: paceDescriptions[key] || ""
            };
          });
        
        setPaceSettings(settings);
      }
    }
  }, [params, customPaces]);

  // Atualizar parâmetros quando o tempo base mudar
  useEffect(() => {
    const newParams = findClosestRaceParams(baseTime, baseDistance);
    setParams(newParams);
  }, [baseTime, baseDistance]);

  // Aplicar o fator de ajuste a todos os ritmos
  const applyAdjustmentFactor = () => {
    if (!allPaces) return;
    
    // Função para ajustar um ritmo
    const adjustPace = (pace: string, factor: number): string => {
      if (!pace || typeof pace !== 'string') {
        return "00:00";
      }
      
      // Converte o ritmo para segundos
      const [minutes, seconds] = pace.split(":").map(Number);
      const totalSeconds = (isNaN(minutes) ? 0 : minutes) * 60 + (isNaN(seconds) ? 0 : seconds);
      
      // Aplica o fator de ajuste
      const adjustedSeconds = totalSeconds * (100 / factor);
      
      // Converte de volta para o formato mm:ss
      const adjustedMinutes = Math.floor(adjustedSeconds / 60);
      const adjustedSecondsRemainder = Math.round(adjustedSeconds % 60);
      
      return `${adjustedMinutes}:${adjustedSecondsRemainder.toString().padStart(2, '0')}`;
    };
    
    // Aplicar o ajuste a todos os ritmos
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
    // Garantir que o valor está no formato MM:SS
    const formattedValue = newValue.trim();
    
    newSettings[index] = {
      ...newSettings[index],
      value: formattedValue,
      isCustom: formattedValue !== newSettings[index].default
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
  const saveSettings = async () => {
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
      
      // Adicionar ritmos personalizados
      paceSettings.forEach(setting => {
        if (setting.isCustom) {
          settingsToSave[`custom_${setting.name}`] = setting.value;
        }
      });
      
      // Salvar a data no localStorage também
      storageHelper.saveSettings(plan.path, { startDate });
      
      // Enviar para a API
      const response = await fetch(`/api/user/plans/${plan.path}/paces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsToSave),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao salvar configurações");
      }
      
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

  // Função para formatar o nome do ritmo para exibição
  const formatPaceName = (name: string): string => {
    const replacements: Record<string, string> = {
      "Recovery Km": "Recuperação",
      "Easy Km": "Fácil",
      "M Km": "Maratona",
      "T Km": "Limiar",
      "Race Pace": "Prova",
      "I Km": "Intervalo",
      "R 1000m": "Repetição 1000m",
      "I 800m": "Intervalo 800m",
      "R 400m": "Repetição 400m"
    };

    return replacements[name] || name;
  };

  return (
    <Layout>
      <Head>
        <title>Configurar Ritmos - {plan.name}</title>
        <meta
          name="description"
          content="Personalize os ritmos do seu plano de treinamento."
        />
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Configurar Ritmos</h1>
            <p className="text-muted-foreground">
              Personalize os ritmos do plano {plan.name}
            </p>
          </div>
          
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/plans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar aos Planos
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuração Base */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração Base</CardTitle>
              <CardDescription>
                Defina seu ritmo base e data inicial do plano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data inicial */}
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
              
              <Separator className="my-4" />
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseDistance">Distância de Referência</Label>
                  <select
                    id="baseDistance"
                    value={baseDistance}
                    onChange={(e) => setBaseDistance(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {Object.keys(defaultTimes).map((distance) => (
                      <option key={distance} value={distance}>
                        {distance}
                      </option>
                    ))}
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
                </div>

                {/* VO2max indicator */}
                {params !== null && (
                  <div className="pt-2">
                    <VO2maxIndicator params={params} percentage={percentage} />
                  </div>
                )}

                <Alert className="bg-muted">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Esta configuração determina o seu ritmo de corrida com base no seu tempo atual.
                    Use uma distância e tempo recentes para obter os ritmos mais precisos.
                  </AlertDescription>
                </Alert>
              </div>
              
              <Separator />
              
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
                  Use este controle para ajustar todos os ritmos de uma vez.
                  <span className="font-medium"> Valores menores = ritmos mais rápidos</span> (para atletas mais avançados), 
                  <span className="font-medium"> valores maiores = ritmos mais lentos</span> (para iniciantes).
                </p>
                
                <div className="flex gap-2 mt-4">
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
            </CardContent>
          </Card>

          {/* Ritmos Calculados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Ritmos Calculados
              </CardTitle>
              <CardDescription>
                VO₂Max estimado: {params || "N/A"} ml/kg/min - Personalize seus ritmos de treino
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="running">Ritmos de Corrida</TabsTrigger>
                  <TabsTrigger value="intervals">Intervalados</TabsTrigger>
                </TabsList>
                
                <TabsContent value="running" className="space-y-6 pt-4">
                  {paceSettings
                    .filter(pace => 
                      ["Recovery Km", "Easy Km", "M Km", "T Km", "Race Pace"].includes(pace.name)
                    )
                    .map((pace, index) => (
                      <div key={index} className="space-y-2 bg-muted/20 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            {formatPaceName(pace.name)}
                            {pace.isCustom && (
                              <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 text-xs">
                                Personalizado
                              </Badge>
                            )}
                          </Label>
                          <button
                            onClick={() => resetPaceSetting(
                              paceSettings.findIndex(p => p.name === pace.name)
                            )}
                            className="text-xs text-muted-foreground hover:text-primary"
                          >
                            Resetar
                          </button>
                        </div>
                        <TimeInput
                          value={extractPaceTimeValue(pace)}
                          onChange={(value) => updatePaceSetting(
                            paceSettings.findIndex(p => p.name === pace.name),
                            value
                          )}
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
                </TabsContent>
                
                <TabsContent value="intervals" className="space-y-6 pt-4">
                  {paceSettings
                    .filter(pace => 
                      ["I Km", "R 1000m", "I 800m", "R 400m"].includes(pace.name)
                    )
                    .map((pace, index) => (
                      <div key={index} className="space-y-2 bg-muted/20 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            {formatPaceName(pace.name)}
                            {pace.isCustom && (
                              <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 text-xs">
                                Personalizado
                              </Badge>
                            )}
                          </Label>
                          <button
                            onClick={() => resetPaceSetting(
                              paceSettings.findIndex(p => p.name === pace.name)
                            )}
                            className="text-xs text-muted-foreground hover:text-primary"
                          >
                            Resetar
                          </button>
                        </div>
                        <TimeInput
                          value={extractPaceTimeValue(pace)}
                          onChange={(value) => updatePaceSetting(
                            paceSettings.findIndex(p => p.name === pace.name),
                            value
                          )}
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Alert variant={saveSuccess ? "default" : "default"} className={saveSuccess ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300" : "bg-muted"}>
          {saveSuccess ? (
            <>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Configurações salvas com sucesso! Seus ritmos personalizados serão aplicados ao plano.
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Lembre-se de salvar suas alterações antes de sair. Suas configurações serão aplicadas ao visualizar o plano.
              </AlertDescription>
            </>
          )}
        </Alert>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/plano/${plan.path}`)}
          >
            Ver Plano Completo
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default PlanSettings;