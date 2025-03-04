import React, { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { AnimatePresence, motion } from 'framer-motion';
import { TrainingCard } from "@/components/PlansCard";
import { Layout } from "@/components/layout";
import { EnhancedSearch } from "@/components/default/EnhancedSearch";
import { Card, CardContent } from "@/components/ui/card";
import { getPlanSummaries } from '@/lib/db-utils';
import { PlanSummary } from '@/models';

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

interface PlansPageProps {
  plans: PlanSummary[];
}

export const getStaticProps: GetStaticProps<PlansPageProps> = async () => {
  try {
    // Buscar apenas os sumários dos planos (sem dailyWorkouts) usando a nova função otimizada
    const plans = await getPlanSummaries();
    
    return {
      props: {
        plans: JSON.parse(JSON.stringify(plans)),
      },
      revalidate: 3600, // Revalidar a cada hora
    };
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return {
      props: {
        plans: [],
      },
      // Revalidar mais rapidamente em caso de erro
      revalidate: 60,
    };
  }
};

const PlansPage: React.FC<PlansPageProps> = ({ plans = [] }) => {
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

  // Sincronizar filtros com a query string da URL
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

  // Filtrar planos com base nos critérios selecionados
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
    <Layout>
      <Head>
        <title>Planilhas de corrida completas - Magic Training</title>
        <meta 
          name="description" 
          content="Explore todos os planos de treino para corrida disponíveis no Magic Training, filtrados por distância, nível e objetivos." 
        />
        <meta property="og:title" content="Explore Planos de Treino para Corrida - Magic Training" />
        <meta property="og:description" content="Planos de treinamento gratuitos para corrida, inspirados em renomados livros e elaborados por experientes treinadores." />
        <meta property="og:url" content={typeof window !== "undefined" ? window.location.href : ""} />
        <meta property="og:image" content="/img/pages/plans.jpg" />
        <meta property="og:type" content="website" />
      </Head>

      <div className="space-y-8">
        <Card className="border-none shadow-none">
          <CardContent className="p-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90 mb-4">
              Todos os Planos
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Explore nossa coleção completa de planos de treinamento para corrida. 
              Use os filtros para encontrar o plano ideal para sua distância, nível de experiência e objetivos.
            </p>
            
            <EnhancedSearch
              filters={filters}
              allPlans={plans}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </CardContent>
        </Card>

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
                <TrainingCard plan={plan} />
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
      </div>
    </Layout>
  );
};

export default PlansPage;