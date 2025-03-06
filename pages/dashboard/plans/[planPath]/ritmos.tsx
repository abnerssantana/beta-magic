import React from "react";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ConfigurePaces } from "@/components/ConfigurePaces";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, Info } from "lucide-react";
import { PlanModel } from "@/models";
import { getPlanByPath } from "@/lib/db-utils";
import { getUserCustomPaces } from "@/lib/user-utils";

interface PaceConfigPageProps {
  plan: PlanModel;
  customPaces: Record<string, string>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const { planPath } = context.params as { planPath: string };

  if (!session) {
    return {
      redirect: {
        destination: `/auth/signin?callbackUrl=/dashboard/plans/${planPath}/ritmos`,
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

    // Get user's custom paces
    const customPaces = await getUserCustomPaces(userId, planPath);

    return {
      props: {
        plan: JSON.parse(JSON.stringify(plan)),
        customPaces: customPaces || {}
      },
    };
  } catch (error) {
    console.error(`Error fetching plan settings for ${planPath}:`, error);
    return {
      notFound: true,
    };
  }
};

const PaceConfigPage: React.FC<PaceConfigPageProps> = ({ plan, customPaces }) => {
  // Handler to save settings
  const handleSaveSettings = async (settings: Record<string, string>) => {
    try {
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
      
      // Also update in localStorage for compatibility with planPage
      if (typeof window !== "undefined") {
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
      
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
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
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar aos Planos
            </Link>
          </Button>
        </div>

        <Alert variant="default" className="bg-muted">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Personalize os ritmos de acordo com seu nível atual. Você pode inserir seu tempo em uma distância de referência
            ou ajustar manualmente os ritmos individuais.
          </AlertDescription>
        </Alert>

        <ConfigurePaces 
          plan={plan} 
          customPaces={customPaces} 
          onSaveSettings={handleSaveSettings} 
        />
      </div>
    </Layout>
  );
};

export default PaceConfigPage;