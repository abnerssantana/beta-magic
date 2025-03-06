// pages/planos-trainingpeaks.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Info } from 'lucide-react';
import { getPlanSummaries } from '@/lib/db-utils';
import { PlanSummary } from '@/models';

interface PlanosTrainingPeaksProps {
  plans: PlanSummary[];
}

export default function PlanosTrainingPeaks({ plans }: PlanosTrainingPeaksProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [nivelFilter, setNivelFilter] = useState('todos');
  
  // Filtrar planos com base no termo de busca e filtro de nível
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = searchTerm === '' || 
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.coach.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.info.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesNivel = nivelFilter === 'todos' || plan.nivel === nivelFilter;
    
    return matchesSearch && matchesNivel;
  });

  return (
    <Layout>
      <Head>
        <title>Planos para TrainingPeaks - Magic Training</title>
        <meta 
          name="description" 
          content="Visualize e adapte seus planos de treinamento para o formato de zonas do TrainingPeaks" 
        />
      </Head>

      <div className="mx-auto">
        <HeroLayout
          title="Planos para TrainingPeaks"
          description="Visualize seus planos de treinamento com as zonas de ritmo do TrainingPeaks para facilitar a criação de workouts na plataforma"
          
          info={
            <Card className="bg-primary/5 border-primary/20 p-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <p className="text-sm text-primary/90">
                    Selecione um plano para visualizá-lo com as zonas do TrainingPeaks. Você poderá definir seu ritmo de limiar 
                    e exportar as zonas diretamente para o TrainingPeaks.
                  </p>
                </div>
              </CardContent>
            </Card>
          }
        >
          <div className="space-y-6">
            {/* Filtros */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar planos..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Tabs 
                  value={nivelFilter} 
                  onValueChange={setNivelFilter}
                  className="sm:w-80"
                >
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="todos">Todos</TabsTrigger>
                    <TabsTrigger value="iniciante">Iniciante</TabsTrigger>
                    <TabsTrigger value="intermediário">Interm.</TabsTrigger>
                    <TabsTrigger value="avançado">Avançado</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            {/* Lista de planos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map(plan => (
                <Link 
                  key={plan.path} 
                  href={`/trainingpeaks/${plan.path}`}
                  className="block h-full"
                >
                  <Card className="hover:shadow-md transition-all duration-200 h-full border-border/40 hover:border-border/90">
                    <CardContent className="p-4 h-full flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium">{plan.name}</h3>
                        <Badge variant="outline">{plan.nivel}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2 flex-grow">
                        {plan.info}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                        <span className="text-muted-foreground">{plan.coach}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{plan.duration}</span>
                        {plan.volume && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{plan.volume} km/sem</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plan.distances?.map((distance, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {distance}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {filteredPlans.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum plano encontrado com os filtros selecionados.
                  </p>
                </div>
              )}
            </div>
          </div>
        </HeroLayout>
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<PlanosTrainingPeaksProps> = async () => {
  try {
    const plans = await getPlanSummaries();
    
    return {
      props: {
        plans: JSON.parse(JSON.stringify(plans))
      },
      revalidate: 3600 // Revalidar a cada hora
    };
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return {
      props: {
        plans: []
      },
      revalidate: 60
    };
  }
};