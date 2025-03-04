import React, { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { TrainingCard } from "@/components/PlansCard";
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from "@/components/default/Sidebar";
import { MobileHeader } from "@/components/default/MobileHeader";
import { EnhancedSearch } from "@/components/default/EnhancedSearch";

// Define types
export interface Plan {
  name: string;
  nivel?: string;
  coach?: string;
  info?: string;
  path: string;
  duration?: string;
  activities?: string[];
  img?: string;
  isNew?: boolean;
  distances?: string[];
  volume?: string;
}

export interface HomeProps {
  plans: Plan[];
  treinoPlans: Plan[];
}

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

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const [plans, treinoPlans] = await Promise.all([
    import('../planos/index').then((module) => module.default as Plan[]),
    import('../planos/treino').then((module) => module.default as Plan[]),
  ]);

  return {
    props: {
      plans,
      treinoPlans,
    },
  };
};

const Home: React.FC<HomeProps> = ({ plans = [], treinoPlans = [] }) => {
  const router = useRouter();
  const allPlans = useMemo(() => [...plans, ...treinoPlans], [plans, treinoPlans]);

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
    return allPlans.filter((plan) => {
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
  }, [allPlans, filters]);

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
        <meta name="description" content="Planos de treinamento gratuitos para corrida e fortalecimento, inspirados em renomados livros e elaborados por experientes treinadores." />
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
        {/* Sidebar */}
        <div className="hidden lg:block w-60 shrink-0">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-6">
              {/* Enhanced Search Section */}
              <div className="space-y-6">
                <EnhancedSearch
                  filters={filters}
                  allPlans={allPlans}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />

                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
                  layout
                >
                  <AnimatePresence mode="sync">
                    {filteredPlans.map((plan, index) => (
                      <motion.div
                        key={plan.path || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        layout
                      >
                        <TrainingCard
                          plan={{
                            name: plan.name,
                            trainer: plan.coach,
                            speed: plan.volume,
                            level: plan.nivel,
                            weeks: plan.duration,
                            isNew: plan.isNew,
                            activities: plan.activities,
                            path: plan.path,
                            img: plan.img,
                            info: plan.info,
                            volume: plan.volume
                          }}
                        />
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;