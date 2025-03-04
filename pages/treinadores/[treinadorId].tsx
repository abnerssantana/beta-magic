// pages/treinadores/[treinadorId].tsx
import React from 'react';
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { Layout } from '@/components/layout';
import { TrainerProfile } from '@/components/TraineProfile';
import { TrainerBiography } from '@/components/TrainerBiography';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingCard } from '@/components/PlansCard';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllTrainers, getTrainerById, getPlansByTrainer } from '@/lib/db-utils';
import { PlanModel, TrainerModel } from '@/models';

interface TrainerPageProps {
  trainer: TrainerModel;
  trainerPlans: PlanModel[];
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const trainers = await getAllTrainers();
    
    const paths = trainers.map((trainer) => ({
      params: { treinadorId: trainer.id },
    }));

    return { 
      paths, 
      fallback: 'blocking' // Permite gerar páginas sob demanda se não existirem no build
    };
  } catch (error) {
    console.error('Erro ao gerar paths para treinadores:', error);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps<TrainerPageProps> = async ({ params }) => {
  try {
    const trainer = await getTrainerById(params?.treinadorId as string);

    if (!trainer) {
      return {
        notFound: true,
      };
    }

    const trainerPlans = await getPlansByTrainer(trainer.name);

    return { 
      props: { 
        trainer: JSON.parse(JSON.stringify(trainer)), 
        trainerPlans: JSON.parse(JSON.stringify(trainerPlans))
      },
      revalidate: 3600 // Revalidar a cada hora
    };
  } catch (error) {
    console.error(`Erro ao buscar treinador ${params?.treinadorId}:`, error);
    return { notFound: true };
  }
};

const TrainerPage: React.FC<TrainerPageProps> = ({ trainer, trainerPlans }) => {
  return (
    <Layout>
      <Head>
        <title>{`${trainer.name} - Magic Training`}</title>
        <meta 
          name="description" 
          content={`Conheça ${trainer.name}, treinador no Magic Training. Explore seus planos de treinamento e metodologia.`} 
        />
        <meta property="og:title" content={`${trainer.name} - Treinador Magic Training`} />
        <meta property="og:description" content={`Conheça ${trainer.name}, treinador no Magic Training. Explore seus planos de treinamento e metodologia.`} />
        <meta property="og:image" content={trainer.profileImage} />
      </Head>

      <div className="container mx-auto space-y-8">
        <TrainerProfile trainer={trainer} />
        
        <TrainerBiography biography={trainer.biography} />
        
        {/* Planos de Treinamento */}
        <Card>
          <CardHeader>
            <CardTitle>Planos de Treinamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="wait">
                {trainerPlans.map((plan) => (
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
              
              {trainerPlans.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">
                    Não há planos disponíveis deste treinador no momento.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TrainerPage;