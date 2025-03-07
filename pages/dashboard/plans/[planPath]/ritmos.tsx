import React from "react";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { Layout } from "@/components/layout";
import { ConfigurePaces } from "@/components/ConfigurePaces";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { PlanModel } from "@/models";
import { getPlanByPath } from "@/lib/db-utils";
import { getUserCustomPaces } from "@/lib/user-utils";
import { getLocalPaceSettings } from "@/lib/pace-storage-utils";

interface PaceConfigPageProps {
  plan: PlanModel;
  customPaces: Record<string, string>;
  isAuthenticated: boolean;
}

// Função para processar os ritmos personalizados e garantir consistência
const processCustomPaces = (rawPaces: Record<string, string>) => {
  // Certifique-se de que temos um objeto válido
  if (!rawPaces || typeof rawPaces !== 'object') return {};
  
  const processedPaces: Record<string, string> = {};
  
  // Processa cada entrada, garantindo que formatos estejam corretos
  Object.entries(rawPaces).forEach(([key, value]) => {
    // Ignora valores vazios ou inválidos
    if (!value || value === 'undefined' || value === 'null') return;
    
    // Para ritmos personalizados (ex: custom_Easy Km)
    if (key.startsWith('custom_')) {
      // Certifique-se de que o formato está correto para ritmos
      if (key.includes('Km') || key.includes('m')) {
        // Normaliza o formato do ritmo (remove sufixos como /km e normaliza o formato)
        const normalizedValue = value.replace(/\/km$/, '').trim();
        processedPaces[key] = normalizedValue;
      } else {
        // Outros valores customizados
        processedPaces[key] = value;
      }
    } else {
      // Valores não personalizados (baseTime, adjustmentFactor, etc.)
      processedPaces[key] = value;
    }
  });
  
  return processedPaces;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const { planPath } = context.params as { planPath: string };
  const isAuthenticated = !!session;

  try {
    // Buscar o plano independentemente do status de autenticação
    const plan = await getPlanByPath(planPath);
    
    if (!plan) {
      return {
        notFound: true,
      };
    }

    // Configurações padrão para usuários não autenticados
    let customPaces = {};

    // Se autenticado, buscar ritmos personalizados do banco de dados
    if (isAuthenticated && session?.user?.id) {
      const userId = session.user.id;
      customPaces = await getUserCustomPaces(userId, planPath) || {};
    } 
    // Para debug - só no servidor
    // console.log("Server-side custom paces:", customPaces);

    return {
      props: {
        plan: JSON.parse(JSON.stringify(plan)),
        customPaces: processCustomPaces(customPaces),
        isAuthenticated
      },
    };
  } catch (error) {
    console.error(`Error fetching plan settings for ${planPath}:`, error);
    return {
      notFound: true,
    };
  }
};

const PaceConfigPage: React.FC<PaceConfigPageProps> = ({ plan, customPaces, isAuthenticated }) => {
  // État pour suivre les rythmes personnalisés côté client
  const [clientCustomPaces, setClientCustomPaces] = React.useState<Record<string, string>>(customPaces);

  // Charge les rythmes personnalisés locaux si nécessaire (pour les utilisateurs non connectés)
  React.useEffect(() => {
    if (!isAuthenticated) {
      // Récupérer les paramètres locaux
      const localPaces = getLocalPaceSettings(plan.path);
      const processedLocalPaces = processCustomPaces(localPaces);
      
      // Mettre à jour l'état uniquement si des paramètres locaux ont été trouvés
      if (Object.keys(processedLocalPaces).length > 0) {
        setClientCustomPaces(prev => ({...prev, ...processedLocalPaces}));
      }
    }
  }, [isAuthenticated, plan.path]);

  // Handler to save settings
  const handleSaveSettings = async (settings: Record<string, string>): Promise<void> => {
    try {
      // Para usuários autenticados, salvar no banco de dados via API
      if (isAuthenticated) {
        const response = await fetch(`/api/user/plans/${plan.path}/paces`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error saving settings');
        }
      }
      
      // Atualizar o estado local com as novas configurações
      setClientCustomPaces(settings);
      
      // Para todos os usuários (incluindo não-autenticados), salvar no localStorage
      if (typeof window !== "undefined") {
        // Salvar configurações completas
        localStorage.setItem(`magic_training_pace_settings_${plan.path}`, JSON.stringify(settings));
        
        // Também atualizar valores individuais para compatibilidade
        const storagePrefix = `${plan.path}_`;
        if (settings.startDate) {
          sessionStorage.setItem(`${storagePrefix}startDate`, settings.startDate);
        }
        if (settings.baseTime) {
          sessionStorage.setItem(`${storagePrefix}selectedTime`, settings.baseTime);
        }
        if (settings.baseDistance) {
          sessionStorage.setItem(`${storagePrefix}selectedDistance`, settings.baseDistance);
        }
        
        // Salvar ritmos personalizados individualmente também
        Object.entries(settings).forEach(([key, value]) => {
          if (key.startsWith('custom_')) {
            localStorage.setItem(`${storagePrefix}${key}`, value);
          }
        });
      }
      
      // Não retornamos nada (void)
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error; // Re-lançamos o erro para ser tratado pelo componente chamador
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
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Configurar Ritmos</h1>
          <p className="text-muted-foreground">
            Personalize os ritmos do plano {plan.name}
          </p>
        </div>

        <Alert variant="default" className="bg-muted">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Personalize os ritmos de acordo com seu nível atual. Você pode inserir seu tempo em uma distância de referência
            ou ajustar manualmente os ritmos individuais.
            {!isAuthenticated && (
              <span className="font-semibold ml-1">
                Suas configurações serão salvas localmente neste navegador.
              </span>
            )}
          </AlertDescription>
        </Alert>

        <ConfigurePaces 
          plan={plan} 
          customPaces={clientCustomPaces} 
          onSaveSettings={handleSaveSettings} 
          isAuthenticated={isAuthenticated}
        />
        
      </div>
    </Layout>
  );
};

export default PaceConfigPage;