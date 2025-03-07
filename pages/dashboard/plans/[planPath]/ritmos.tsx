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

interface PaceConfigPageProps {
  plan: PlanModel;
  customPaces: Record<string, string>;
  isAuthenticated: boolean;
}

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
    // Se não autenticado, verificamos se há configurações no cookie
    else {
      // Será tratado no lado do cliente através do localStorage
    }

    return {
      props: {
        plan: JSON.parse(JSON.stringify(plan)),
        customPaces: customPaces,
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
      
      // Para todos os usuários (incluindo não-autenticados), salvar no localStorage
      if (typeof window !== "undefined") {
        // Salvar configurações completas
        localStorage.setItem(`pace_settings_${plan.path}`, JSON.stringify(settings));
        
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
          customPaces={customPaces} 
          onSaveSettings={handleSaveSettings} 
          isAuthenticated={isAuthenticated}
        />
        
      </div>
    </Layout>
  );
};

export default PaceConfigPage;