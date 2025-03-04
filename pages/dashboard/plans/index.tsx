import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlanSummary } from "@/models";
import { getUserPlans } from "@/lib/user-utils";
import { BookmarkPlus, Bookmark, Play, Settings, ChevronRight, Filter } from "lucide-react";

interface PlansPageProps {
  activePlan: PlanSummary | null;
  savedPlans: PlanSummary[];
  recommendedPlans: PlanSummary[];
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
    const { activePlan, savedPlans, recommendedPlans } = await getUserPlans(userId);

    return {
      props: {
        activePlan: activePlan ? JSON.parse(JSON.stringify(activePlan)) : null,
        savedPlans: JSON.parse(JSON.stringify(savedPlans)),
        recommendedPlans: JSON.parse(JSON.stringify(recommendedPlans))
      },
    };
  } catch (error) {
    console.error("Erro ao buscar planos do usuário:", error);
    return {
      props: {
        activePlan: null,
        savedPlans: [],
        recommendedPlans: []
      },
    };
  }
};

const UserPlansPage: React.FC<PlansPageProps> = ({
  activePlan,
  savedPlans,
  recommendedPlans,
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const [activatingPlanId, setActivatingPlanId] = useState<string | null>(null);

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

      // Recarregar a página para mostrar as mudanças
      window.location.reload();
    } catch (error) {
      console.error("Erro ao ativar plano:", error);
      alert("Não foi possível ativar o plano. Tente novamente.");
    } finally {
      setIsActivating(false);
      setActivatingPlanId(null);
    }
  };

  const handleSavePlan = async (planPath: string, save: boolean) => {
    try {
      const response = await fetch("/api/user/plans/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planPath, save }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar o plano");
      }

      // Recarregar a página para mostrar as mudanças
      window.location.reload();
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      alert("Não foi possível salvar o plano. Tente novamente.");
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'iniciante': return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case 'intermediário': return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case 'avançado': return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case 'elite': return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      default: return "";
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
                      <Badge variant="outline" className={getLevelBadgeVariant(activePlan.nivel)}>
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
                        <Link href={`/dashboard/plans/${activePlan.path}/settings`}>
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

          {/* Planos Salvos */}
          <TabsContent value="saved" className="space-y-4">
            {savedPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPlans.map((plan) => (
                  <Card key={plan.path} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.coach}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className={getLevelBadgeVariant(plan.nivel)}>
                            {plan.nivel}
                          </Badge>
                          {plan.distances && plan.distances[0] && (
                            <Badge variant="secondary">{plan.distances[0]}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {plan.info}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={isActivating}
                        onClick={() => handleActivatePlan(plan.path)}
                        className="w-full"
                      >
                        {isActivating && activatingPlanId === plan.path ? (
                          "Ativando..."
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Ativar Plano
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
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
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Planos Recomendados */}
          <TabsContent value="recommended" className="space-y-4">
            {recommendedPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedPlans.map((plan) => (
                  <Card key={plan.path} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.coach}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className={getLevelBadgeVariant(plan.nivel)}>
                            {plan.nivel}
                          </Badge>
                          {plan.distances && plan.distances[0] && (
                            <Badge variant="secondary">{plan.distances[0]}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {plan.info}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSavePlan(plan.path, true)}
                      >
                        <BookmarkPlus className="mr-2 h-4 w-4" />
                        Salvar
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleActivatePlan(plan.path)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Ativar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Filter className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Recomendações em breve</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    Estamos trabalhando para trazer recomendações personalizadas para você.
                  </p>
                  <Button asChild>
                    <Link href="/encontrar-plano">
                      Encontrar Planos
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserPlansPage;
