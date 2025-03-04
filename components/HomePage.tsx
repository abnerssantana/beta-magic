import React, { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedSearch } from "@/components/default/EnhancedSearch";
import { MobileHeader } from "@/components/default/MobileHeader";
import FeaturedContent, { getLevelBadgeStyles } from "@/components/default/FeaturedContent";
import { Badge } from "@/components/ui/badge";
import { PlanSummary } from '@/lib/field-projection';
import { getPlanSummaries } from '@/lib/db-utils';

interface Filters {
  searchTerm: string;
  level: string;
  trainer: string;
  duration: string;
  volume: string;
  distance: string;
  type: string;
}

type QueryKeyMap = {
  [K in keyof Filters]: string;
};

interface HomeProps {
  plans: PlanSummary[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    // Buscar apenas os sumários dos planos (sem dailyWorkouts)
    const allPlans = await getPlanSummaries();

    return {
      props: {
        plans: JSON.parse(JSON.stringify(allPlans)),
      },
      revalidate: 3600, // Revalidar a cada 1 hora
    };
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return {
      props: {
        plans: [],
      },
      revalidate: 60,
    };
  }
};

// Featured Plans Component
const FeaturedPlans = ({ plans }: { plans: PlanSummary[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Planos em Destaque</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {plans.map((plan) => (
            <motion.div
              key={plan.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              layout
            >
              <a
                href={`/plano/${plan.path}`}
                className="block h-full"
              >
                <TrainingCard plan={plan} />
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </CardContent>
  </Card>
);

// Enhanced TrainingCard component
const TrainingCard = ({ plan }: { plan: PlanSummary }) => (
  <div className="group relative hover:shadow-md transition-all duration-300 h-full bg-white dark:bg-muted/30 border-border/40 hover:border-border/90 overflow-hidden flex flex-col rounded-lg border">
    <div className="p-5 flex flex-col h-full space-y-4">
      {/* Header Section */}
      <div className="space-y-3 grow">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {plan.name}
          </h3>
          {plan.isNew && (
            <Badge 
              variant="destructive" 
              className="text-xs"
            >
              Novo
            </Badge>
          )}
        </div>
        
        {plan.coach && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="line-clamp-1">{plan.coach}</span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {plan.volume && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>{plan.volume} km/sem</span>
            </div>
          )}
          {(plan.duration) && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>{plan.duration}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {plan.nivel && (
            <Badge 
              variant="outline"
              className={getLevelBadgeStyles(plan.nivel)}
            >
              {plan.nivel}
            </Badge>
          )}
          {plan.distances?.map((distance, idx) => (
            <Badge 
              key={`${plan.path}-${distance}-${idx}`}
              variant="secondary"
              className="bg-secondary/30 hover:bg-secondary/50 text-xs border-0 
                       text-secondary-foreground/90 dark:bg-secondary/20 
                       dark:hover:bg-secondary/30 dark:text-secondary-foreground/80"
            >
              {distance}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Home: React.FC<HomeProps> = ({ plans = [] }) => {
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    level: "todos",
    trainer: "todos",
    duration: "qualquer",
    volume: "qualquer",
    distance: "todas",
    type: "todos"
  });

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      searchTerm: router.query.q?.toString() || "",
      level: router.query.nivel?.toString() || "todos",
      trainer: router.query.coach?.toString() || "todos",
      duration: router.query.duracao?.toString() || "qualquer",
      volume: router.query.volume?.toString() || "qualquer",
      distance: router.query.distance?.toString() || "todas"
    }));
  }, [router.query]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (!plan) return false;

      const searchMatch = filters.searchTerm === "" || [
        plan.name,
        plan.coach,
        plan.nivel,
        plan.info
      ].some(field =>
        field?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );

      const levelMatch = filters.level === "todos" ||
        plan.nivel?.toLowerCase() === filters.level.toLowerCase();

      const trainerMatch = filters.trainer === "todos" ||
        plan.coach?.toLowerCase() === filters.trainer.toLowerCase();

      const durationMatch = filters.duration === "qualquer" ||
        plan.duration?.toLowerCase().includes(filters.duration.toLowerCase());

      const volumeMatch = filters.volume === "qualquer" ||
        plan.volume?.toString() === filters.volume;

      const distanceMatch = filters.distance === "todas" ||
        (plan.distances && plan.distances.includes(filters.distance));

      return searchMatch && levelMatch && trainerMatch &&
        durationMatch && volumeMatch && distanceMatch;
    });
  }, [plans, filters]);

  const hasActiveFilters = useMemo(() => {
    return filters.searchTerm !== "" ||
      filters.level !== "todos" ||
      filters.trainer !== "todos" ||
      filters.duration !== "qualquer" ||
      filters.volume !== "qualquer" ||
      filters.distance !== "todas" ||
      filters.type !== "todos";
  }, [filters]);

  // Featured plans (top 6)
  const featuredPlans = useMemo(() => {
    return plans
      .filter(plan => plan.isNew)
      .slice(0, 6);
  }, [plans]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const queryKeyMap: QueryKeyMap = {
      searchTerm: 'q',
      level: 'nivel',
      trainer: 'coach',
      duration: 'duracao',
      volume: 'volume',
      distance: 'distance',
      type: 'tipo'
    };

    const queryKey = queryKeyMap[key];
    const newQuery = { ...router.query };

    if (value &&
      value !== 'todos' &&
      value !== 'todas' &&
      value !== 'qualquer' &&
      value !== '') {
      newQuery[queryKey] = value.toLowerCase();
    } else {
      delete newQuery[queryKey];
    }

    router.replace(
      { pathname: router.pathname, query: newQuery },
      undefined,
      { shallow: true }
    );

    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    router.replace({ pathname: router.pathname }, undefined, { shallow: true });
    setFilters({
      searchTerm: "",
      level: "todos",
      trainer: "todos",
      duration: "qualquer",
      volume: "qualquer",
      distance: "todas",
      type: "todos"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Magic Training - Planilhas de treinamento para corrida</title>
        <meta 
          name="description" 
          content="Planos de treinamento gratuitos para corrida e fortalecimento, inspirados em renomados livros e elaborados por experientes treinadores." 
        />
        <meta property="og:title" content="Magic Training - Planilhas de treinamento para corrida" />
        <meta property="og:description" content="Planos de treinamento gratuitos para corrida e fortalecimento, inspirados em renomados livros e elaborados por experientes treinadores." />
        <meta property="og:url" content={typeof window !== "undefined" ? window.location.href : ""} />
        <meta property="og:image" content="/img/pages/home.jpg" />
        <meta property="og:site_name" content="Magic Training" />
        <meta property="og:type" content="website" />
      </Head>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader />
      </div>

      <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              {/* Search Section */}
              <div className="space-y-6">
                <EnhancedSearch
                  filters={filters}
                  allPlans={plans}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />

                {!hasActiveFilters ? (
                  <>
                    {/* Featured Plans */}
                    {featuredPlans.length > 0 && (
                      <FeaturedPlans plans={featuredPlans} />
                    )}

                    {/* Featured Content */}
                    <FeaturedContent />
                  </>
                ) : (
                  // Filtered Plans Grid
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
                    layout
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredPlans.map((plan) => (
                        <motion.div
                          key={plan.path}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          layout
                        >
                          <a
                            href={`/plano/${plan.path}`}
                            className="block h-full"
                          >
                            <TrainingCard plan={plan} />
                          </a>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {filteredPlans.length === 0 && (
                      <motion.div
                        className="col-span-full text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <p className="text-lg text-muted-foreground">
                          Nenhum plano encontrado com os filtros selecionados.
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;