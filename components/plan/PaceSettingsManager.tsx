import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, AlertTriangle, Info } from "lucide-react";
import TimeInput from "@/components/TimeInput";
import { toast } from "sonner";

interface PaceSetting {
  name: string;
  value: string;
  default: string;
  isCustom: boolean;
  description?: string;
}

interface PaceSettingsManagerProps {
  paceSettings: PaceSetting[];
  onUpdatePaceSetting: (index: number, newValue: string) => void;
  onResetPaceSetting: (index: number) => void;
  onApplyAdjustment: () => void;
  onResetAll: () => void;
  onSaveSettings: () => void;
  activeTab: string;
  isSaving: boolean;
  saveSuccess: boolean;
}

// Descrições dos ritmos para melhorar a compreensão
const paceDescriptions: Record<string, string> = {
  "Recovery Km": "Ritmo muito leve para recuperação ativa após treinos intensos",
  "Easy Km": "Ritmo fácil - use para a maioria dos treinos, deve permitir conversar",
  "M Km": "Ritmo de maratona - sustentável para provas longas",
  "T Km": "Ritmo de limiar - entre aeróbico e anaeróbico, desafiador mas mantível",
  "I Km": "Ritmo de intervalo - para melhorar VO₂max em intervalos de 3-5 min",
  "R 1000m": "Ritmo de repetição - mais rápido, para melhorar economia de corrida",
  "I 800m": "Intervalo de 800m - pouco mais rápido que o ritmo I",
  "R 400m": "Repetição de 400m - alta velocidade para desenvolvimento de potência"
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

const PaceSettingsManager: React.FC<PaceSettingsManagerProps> = ({
  paceSettings,
  onUpdatePaceSetting,
  onResetPaceSetting,
  onApplyAdjustment,
  onResetAll,
  onSaveSettings,
  activeTab,
  isSaving,
  saveSuccess
}) => {
  // Filtrar os ritmos baseados na aba ativa
  const runningPaces = paceSettings.filter(pace => 
    ["Recovery Km", "Easy Km", "M Km", "T Km", "Race Pace"].includes(pace.name)
  );
  
  const intervalPaces = paceSettings.filter(pace => 
    ["I Km", "R 1000m", "I 800m", "R 400m"].includes(pace.name)
  );
  
  // Selecionar os ritmos a serem exibidos
  const displayedPaces = activeTab === "running" ? runningPaces : intervalPaces;
  
  return (
    <div className="space-y-6">
      {/* Ritmos */}
      <div className="space-y-6">
        {displayedPaces.map((pace, index) => {
          // Encontrar o índice real no array original
          const originalIndex = paceSettings.findIndex(p => p.name === pace.name);
          
          return (
            <div key={pace.name} className="space-y-2 bg-muted/20 p-3 rounded-lg">
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
                  onClick={() => onResetPaceSetting(originalIndex)}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Resetar
                </button>
              </div>
              <TimeInput
                value={extractPaceTimeValue(pace)}
                onChange={(value) => onUpdatePaceSetting(originalIndex, value)}
                showHours={false}
                suffix="/km"
                className="flex-1"
              />
              {pace.description && (
                <p className="text-xs text-muted-foreground italic">
                  {paceDescriptions[pace.name] || pace.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Botões de ação */}
      <div className="flex justify-center space-x-2">
        <Button 
          variant="outline" 
          onClick={onApplyAdjustment}
          className="flex-1"
        >
          Aplicar Ajuste Global
        </Button>
        <Button 
          variant="outline" 
          onClick={onResetAll}
          className="flex-1 border-muted-foreground/30"
        >
          Resetar Todos
        </Button>
      </div>
      
      {/* Mensagem de status */}
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
      
      {/* Botão de salvar */}
      <Button 
        onClick={onSaveSettings}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
};

export default PaceSettingsManager;