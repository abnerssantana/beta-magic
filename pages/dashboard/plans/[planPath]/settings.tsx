import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TimeInput from "@/components/TimeInput";
import { PlanModel } from "@/models";
import { Slider } from "@/components/ui/slider";
import { defaultTimes, findClosestRaceParams, findPaceValues } from "@/lib/plan-utils";
import { Check, Info, Save, AlertTriangle, ArrowLeft, Clock } from "lucide-react";
import { getPlanByPath } from "@/lib/db-utils";
import { getUserCustomPaces } from "@/lib/user-utils";

interface PaceSetting {
  name: string;
  value: string;
  default: string;
  isCustom: boolean;
}

interface PlanSettingsProps {
  plan: PlanModel;
  customPaces: Record<string, string>;
  baseParams: number | null;
}

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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
            
            return {
              name: key,
              value: customValue || value,
              default: value,
              isCustom: !!customValue
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
      // Converte o ritmo para segundos
      const [minutes, seconds] = pace.split(":").map(Number);
      const totalSeconds = minutes * 60 + seconds;
      
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
  };

  // Função para atualizar um ritmo específico
  const updatePaceSetting = (index: number, newValue: string) => {
    const newSettings = [...paceSettings];
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
        adjustmentFactor: adjustmentFactor.toString()
      };
      
      // Adicionar ritmos personalizados
      paceSettings.forEach(setting => {
        if (setting.isCustom) {
          settingsToSave[`custom_${setting.name}`] = setting.value;
        }
      });
      
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
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Não foi possível salvar as configurações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
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
                Defina seu ritmo base para calcular os demais ritmos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      className="pl-10"
                    />
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

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
                  Valores menores = ritmos mais rápidos, valores maiores = ritmos mais lentos.
                </p>
                
                <Button 
                  variant="outline" 
                  onClick={applyAdjustmentFactor}
                  className="w-full mt-2"
                >
                  Aplicar Ajuste Global
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ritmos Calculados */}
          <Card>
            <CardHeader>
              <CardTitle>Ritmos Calculados</CardTitle>
              <CardDescription>
                VO₂Max estimado: {params || "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="running">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="running">Ritmos de Corrida</TabsTrigger>
                  <TabsTrigger value="intervals">Intervalados</TabsTrigger>
                </TabsList>
                
                <TabsContent value="running" className="space-y-4">
                  {paceSettings
                    .filter(pace => 
                      ["Recovery Km", "Easy Km", "M Km", "T Km"].includes(pace.name)
                    )
                    .map((pace, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-sm">
                            {pace.name.replace(" Km", "")}
                            {pace.isCustom && (
                              <span className="ml-2 text-xs text-blue-500">(Personalizado)</span>
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
                        <div className="flex items-center gap-2">
                          <TimeInput
                            value={pace.value.split(" ")[0]}
                            onChange={(value) => updatePaceSetting(
                              paceSettings.findIndex(p => p.name === pace.name),
                              value
                            )}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">/km</span>
                        </div>
                      </div>
                    ))}
                </TabsContent>
                
                <TabsContent value="intervals" className="space-y-4">
                  {paceSettings
                    .filter(pace => 
                      ["I Km", "R 1000m", "R 400m", "R 200m"].includes(pace.name)
                    )
                    .map((pace, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-sm">
                            {pace.name}
                            {pace.isCustom && (
                              <span className="ml-2 text-xs text-blue-500">(Personalizado)</span>
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
                        <div className="flex items-center gap-2">
                          <TimeInput
                            value={pace.value.split(" ")[0]}
                            onChange={(value) => updatePaceSetting(
                              paceSettings.findIndex(p => p.name === pace.name),
                              value
                            )}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">/km</span>
                        </div>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Alert variant={saveSuccess ? "success" : "default"} className={saveSuccess ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300" : "bg-muted"}>
          {saveSuccess ? (
            <>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Configurações salvas com sucesso!
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Lembre-se de salvar suas alterações antes de sair.
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