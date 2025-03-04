// pages/treinadores/index.tsx
import React, { useMemo } from 'react';
import Head from 'next/head';
import { GetStaticProps } from 'next';
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import { Card, CardContent } from "@/components/ui/card";
import { TrainerCard } from '@/components/TrainerCard';
import { Info } from 'lucide-react';
import { getAllTrainers, getAllPlans } from '@/lib/db-utils';
import { PlanModel, TrainerModel } from '@/models';

interface TrainerWithPlanCount extends TrainerModel {
  planCount: number;
}

interface TrainersPageProps {
  trainers: TrainerModel[];
  plans: PlanModel[];  
}

export const getStaticProps: GetStaticProps<TrainersPageProps> = async () => {
  try {
    const [trainers, plans] = await Promise.all([
      getAllTrainers(),
      getAllPlans()
    ]);
    
    return {
      props: {
        trainers: JSON.parse(JSON.stringify(trainers)),
        plans: JSON.parse(JSON.stringify(plans)),
      },
      revalidate: 3600 // Revalidar a cada hora
    };
  } catch (error) {
    console.error('Erro ao buscar treinadores e planos:', error);
    return {
      props: {
        trainers: [],
        plans: [],
      },
      revalidate: 60
    };
  }
};

const TrainersPage: React.FC<TrainersPageProps> = ({ trainers, plans }) => {
  const trainersWithPlanCount = useMemo(() => 
    trainers.map(trainer => {
      const planCount = plans.filter(plan => 
        plan.coach.toLowerCase() === trainer.name.toLowerCase()
      ).length;
      return { ...trainer, planCount };
    }),
  [trainers, plans]);

  return (
    <Layout>
      <Head>
        <title>Treinadores - Magic Training</title>
        <meta 
          name="description" 
          content="Conheça os treinadores do Magic Training, especialistas em corrida e treinamento físico." 
        />
      </Head>

      <HeroLayout
        title="Treinadores"
        description="Conheça os especialistas por trás dos nossos planos de treinamento. Cada treinador traz uma filosofia única e anos de experiência para ajudar você a alcançar seus objetivos."
        info={
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <p className="text-sm text-primary/90">
                  Nossos treinadores incluem atletas olímpicos, fisiologistas do exercício e 
                  metodologistas reconhecidos internacionalmente no campo do treinamento de corrida.
                </p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-6">
          {trainersWithPlanCount.map((trainer) => (
            <TrainerCard 
              key={trainer.id} 
              trainer={trainer} 
              planCount={(trainer as TrainerWithPlanCount).planCount} 
            />
          ))}
        </div>
      </HeroLayout>
    </Layout>
  );
};

export default TrainersPage;