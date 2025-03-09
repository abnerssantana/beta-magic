import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlanSummary } from "@/models";
import { getUserPlans } from "@/lib/user-utils";
import {
  getRecommendedPlansFromQuestionnaire,
  updateUserRecommendations
} from "@/lib/user-plans-utils";
import {
  BookmarkPlus,
  Bookmark,
  Play,
  Target,
  Settings,
  ChevronRight,
  Filter,
  Star
} from "lucide-react";
import RecommendedPlans from "@/components/dashboard/RecommendedPlans";
import SavedPlans from "@/components/dashboard/SavedPlans";
import { toast } from "sonner";

interface PlansPageProps {
  activePlan: PlanSummary | null;
  savedPlans: PlanSummary[];
  recommendedPlans: PlanSummary[];
  userLevel: string | null; // Alterado para aceitar null explicitamente
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/dashboard/plans",
        permanent: false,
      },
    };
  }

  try {
    const userId = session.user.id;

    // Obter planos do usuário (ativo e salvos)
    const { activePlan, savedPlans } = await getUserPlans(userId);

    // Buscar planos recomendados baseados no questionário
    const recommendedPlans = await getRecommendedPlansFromQuestionnaire(userId);

    // Se não tiver recomendações, atualizar baseado nos treinos
    if (recommendedPlans.length === 0) {
      await updateUserRecommendations(userId);
    }

    // Determinar nível do usuário (para UI)
    let userLevel = null;
    try {
      const client = await import('@/lib/mongodb').then(mod => mod.default);
      const db = (await client).db('magic-training');
      const userProfile = await db.collection('userProfiles').findOne({ userId });

      if (userProfile?.questionnaire?.calculatedLevel) {
        userLevel = userProfile.questionnaire.calculatedLevel;
      }
    } catch (error) {
      console.error("Erro ao buscar nível do usuário:", error);
      // userLevel continua como null
    }

    return {
      props: {
        activePlan: activePlan ? JSON.parse(JSON.stringify(activePlan)) : null,
        savedPlans: JSON.parse(JSON.stringify(savedPlans)),
        recommendedPlans: JSON.parse(JSON.stringify(recommendedPlans)),
        userLevel // Agora é null se não for definido, permitindo serialização
      },
    };
  } catch (error) {
    console.error("Erro ao buscar planos do usuário:", error);
    return {
      props: {
        activePlan: null,
        savedPlans: [],
        recommendedPlans: [],
        userLevel: null // Explicitamente null em vez de undefined
      },
    };
  }
};

// Mapeamento de níveis para cores
const levelColors = {
  'iniciante': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'intermediário': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'avançado': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'elite': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
};

const UserPlansPage: React.FC<PlansPageProps> = ({
  activePlan,
  savedPlans,
  recommendedPlans,
  userLevel
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const [activatingPlanId, setActivatingPlanId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [removingPlanId, setRemovingPlanId] = useState<string | null>(null);

  const handleActivatePlan = async (planPath: string) => {
    setIsActivating(true);
    setActivatingPlanId(planPath);

    try {
      const response = await fetch("/api/user/plans/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planPath }),
      });

      if (!response.ok) {
        throw new Error("Falha ao ativar o plano");
      }

      toast.success("Plano ativado com sucesso!");

      // Recarregar a página para mostrar as mudanças
      window.location.reload();
    } catch (error) {
      console.error("Erro ao ativar plano:", error);
      toast.error("Não foi possível ativar o plano. Tente novamente.");
    } finally {
      setIsActivating(false);
      setActivatingPlanId(null);
    }
  };

  const handleSavePlan = async (planPath: string, save: boolean) => {
    setIsSaving(true);
    if (!save) {
      setRemovingPlanId(planPath);
    }

    try {
      const response = await fetch("/api/user/plans/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planPath, save }),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerenciar o plano");
      }

      toast.success(save ? "Plano salvo com sucesso!" : "Plano removido com sucesso!");

      // Recarregar a página para mostrar as mudanças
      window.location.reload();
    } catch (error) {
      console.error("Erro ao gerenciar plano:", error);
      toast.error(save ? "Não foi possível salvar o plano." : "Não foi possível remover o plano.");
    } finally {
      setIsSaving(false);
      setRemovingPlanId(null);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Meus Planos - Magic Training</title>
        <meta
          name="description"
          content="Gerencie seus planos de treinamento no Magic Training."
        />
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meus Planos</h1>
            <p className="text-muted-foreground">
              Gerencie seus planos de treinamento
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                Voltar ao Dashboard
              </Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href="/encontrar-plano">
                <Filter className="mr-2 h-4 w-4" />
                Encontrar Novo Plano
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Plano Ativo</TabsTrigger>
            <TabsTrigger value="saved">Planos Salvos</TabsTrigger>
            <TabsTrigger value="recommended">Recomendados</TabsTrigger>
          </TabsList>

          {/* Plano Ativo */}
          <TabsContent value="active" className="space-y-4">
            {activePlan ? (
              <Card>
                <CardHeader>
                  <CardTitle>{activePlan.name}</CardTitle>
                  <CardDescription>{activePlan.coach}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={levelColors[activePlan.nivel as keyof typeof levelColors] || ''}>
                        {activePlan.nivel}
                      </Badge>
                      {activePlan.distances?.map((distance, idx) => (
                        <Badge key={idx} variant="secondary">
                          {distance}
                        </Badge>
                      ))}
                      <Badge variant="outline">{activePlan.duration}</Badge>
                      {activePlan.volume && (
                        <Badge variant="outline">{activePlan.volume} km/sem</Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground">
                      {activePlan.info}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="default" asChild>
                        <Link href={`/plano/${activePlan.path}`}>
                          <Play className="mr-2 h-4 w-4" />
                          Ver Plano Completo
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/dashboard/plans/${activePlan.path}/ritmos`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Configurar Ritmos
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Play className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nenhum plano ativo</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    Você ainda não ativou nenhum plano. Ative um dos seus planos salvos ou encontre um novo plano.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button asChild>
                      <Link href="/encontrar-plano">
                        Encontrar Plano
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Planos Salvos - Novo design */}
          <TabsContent value="saved" className="space-y-4">
            {savedPlans.length > 0 ? (
              <SavedPlans
                plans={savedPlans}
                onActivatePlan={handleActivatePlan}
                onRemovePlan={handleSavePlan}
                isActivating={isActivating}
                activatingPlanId={activatingPlanId}
                isRemoving={isSaving}
                removingPlanId={removingPlanId}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Bookmark className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nenhum plano salvo</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    Você ainda não salvou nenhum plano. Navegue pelos planos recomendados ou encontre novos planos.
                  </p>
                  <Button asChild>
                    <Link href="/encontrar-plano">
                      Descobrir Planos
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Planos Recomendados - Usando o componente RecommendedPlans */}
          <TabsContent value="recommended">
            <div className="space-y-4">
              <Card className="bg-primary/5 border-primary/20 py-4 px-0">
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-primary/90">
                    <Star className="h-4 w-4 text-primary" />
                    {userLevel ? (
                      <p>Recomendações baseadas no seu nível <strong>{userLevel}</strong></p>
                    ) : (
                      <p>Encontre seu plano ideal com nosso questionário</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <RecommendedPlans
                plans={recommendedPlans}
                userLevel={userLevel}
                onSavePlan={handleSavePlan}
                onActivatePlan={handleActivatePlan}
                isSaving={isSaving}
                isActivating={isActivating}
                activatingPlanId={activatingPlanId}
                savedPlanPaths={savedPlans.map(plan => plan.path)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserPlansPage;