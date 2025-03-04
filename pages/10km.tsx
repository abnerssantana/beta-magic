import React, { useMemo } from 'react';
import Head from 'next/head';
import { GetStaticProps } from 'next';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout';
import { TrainingCard } from '@/components/PlansCard';
import {
  Timer,
  Award,
  TrendingUp,
  Calendar,
  Heart,
  Target,
  Dumbbell,
  Footprints,
  Share2,
  Flame,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPlansByDistance } from '@/lib/db-utils';
import { PlanSummary } from '@/lib/field-projection';

interface TenKPageProps {
  plans: PlanSummary[];
}

export const getStaticProps: GetStaticProps<TenKPageProps> = async () => {
  try {
    // Busca planos com distância 10km do banco de dados
    const tenKPlans = await getPlansByDistance('10km', { fields: 'summary' });

    return {
      props: {
        plans: JSON.parse(JSON.stringify(tenKPlans)),
      },
      revalidate: 3600 // Revalidar a cada hora
    };
  } catch (error) {
    console.error('Erro ao buscar planos de 10km:', error);
    return { 
      props: { 
        plans: [] 
      },
      revalidate: 60 // Em caso de erro, tenta novamente após 1 minuto
    };
  }
};

const PageHeader = () => (
  <Card className="border-none shadow-none">
    <CardContent className="p-2 space-y-4">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90">
            Treino de 10km
          </h1>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center text-primary/80">
              <Target className="mr-1.5 h-4 w-4" />
              30-50km semanais
            </div>
            <div className="flex items-center text-muted-foreground/90">
              <Timer className="mr-1.5 h-4 w-4" />
              50-60 min média
            </div>
            <div className="flex items-center text-muted-foreground/90">
              <Calendar className="mr-1.5 h-4 w-4" />
              12-16 semanas
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              try {
                const shareData = {
                  title: 'Treino de 10km - Magic Training',
                  text: 'Descubra planos de treino especializados para 10km no Magic Training',
                  url: window.location.href
                };

                if (navigator.share) {
                  await navigator.share(shareData);
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                }
              } catch (error) {
                console.error('Error sharing:', error);
              }
            }}
            className="text-muted-foreground hover:text-foreground ring-1 ring-border"
          >
            <Share2 className="h-5 w-5" />
            <span className="sr-only">Compartilhar página</span>
          </Button>
        </div>
      </div>

      {/* Description */}
      <div className="hidden md:block">
        <CardDescription className="text-base text-muted-foreground/90 leading-relaxed">
          A prova de 10km é uma distância clássica que combina resistência e velocidade, sendo um marco 
          importante na evolução de todo corredor. É uma distância que exige um preparo mais sólido que os 
          5km, mas ainda permite manter um ritmo relativamente forte durante todo o percurso. Ideal para 
          corredores que já dominaram os 5km e buscam um novo desafio, ou para quem quer construir uma 
          base sólida visando distâncias maiores como a meia maratona.
        </CardDescription>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: <Flame className="h-4 w-4" />,
            label: "Dificuldade",
            value: "Moderada-Alta"
          },
          {
            icon: <Heart className="h-4 w-4" />,
            label: "Intensidade",
            value: "70-85% FCM"
          },
          {
            icon: <Footprints className="h-4 w-4" />,
            label: "Frequência",
            value: "4-5x/semana"
          },
          {
            icon: <Calendar className="h-4 w-4" />,
            label: "Duração",
            value: "12-16 semanas"
          }
        ].map((stat, index) => (
          <Card key={index} className="bg-secondary/30 ring-1 ring-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  {stat.icon}
                  {stat.label}
                </div>
                <p className="font-medium">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Training Principles */}
      <Card className="bg-secondary/30 ring-1 ring-border">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground/90">
                Metodologia Comprovada
              </h3>
              <p className="text-sm text-muted-foreground">
                Planos de treinamento desenvolvidos por treinadores experientes e baseados em metodologias 
                científicas, com mais de 3.000 corredores já beneficiados
              </p>
            </div>
            <Button className="ring-1 ring-border">
              Ver Metodologia
            </Button>
          </div>
        </CardContent>
      </Card>
    </CardContent>
  </Card>
);

const Block: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, className }) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const TenKPage: React.FC<TenKPageProps> = ({ plans }) => {
  const plansByLevel = useMemo(() => {
    const levels = ['iniciante', 'intermediário', 'avançado', 'elite'];
    return levels.reduce((acc, level) => {
      acc[level] = plans.filter(plan => plan.nivel?.toLowerCase() === level);
      return acc;
    }, {} as Record<string, PlanSummary[]>);
  }, [plans]);

  return (
    <Layout>
      <Head>
        <title>Treino de 10km - Planos e Guia Completo | Magic Training</title>
        <meta 
          name="description" 
          content="Encontre planos de treino especializados para 10km. Programas estruturados para todos os níveis, com foco em resistência e velocidade." 
        />
        <meta property="og:title" content="Treino de 10km - Guia Completo e Planos" />
        <meta property="og:type" content="website" />
      </Head>

      <div className="container mx-auto px-4">
        <PageHeader />

        <div className="space-y-6 mt-6">
          {/* Training Components Block */}
          <Block
            title="Componentes do Treino"
            icon={<Dumbbell className="h-5 w-5 text-primary" />}
          >
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  title: "Base Aeróbica",
                  description: "Desenvolvimento da resistência necessária para completar os 10km com consistência"
                },
                {
                  title: "Treinos Específicos",
                  description: "Combinação de treinos longos, intervalados e de ritmo para melhorar performance"
                },
                {
                  title: "Periodização Científica",
                  description: "Progressão estruturada do volume e intensidade para maximizar resultados"
                }
              ].map((component, i) => (
                <Card key={i} className="p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">{component.title}</h4>
                  <p className="text-sm text-muted-foreground">{component.description}</p>
                </Card>
              ))}
            </div>
          </Block>

          {/* Training Plans Blocks */}
          {Object.entries(plansByLevel).map(([level, levelPlans]) => (
            levelPlans.length > 0 && (
              <Block
                key={level}
                title={`Planos para Nível ${level.charAt(0).toUpperCase() + level.slice(1)}`}
                icon={<Award className="h-5 w-5 text-primary" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="sync">
                    {levelPlans.map((plan) => (
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
                </div>
              </Block>
            )
          ))}

          {/* Tips Block */}
          <Block
            title="Dicas para o Treino"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-4">
              {[
                {
                  title: "Progressão Gradual",
                  text: "Aumente o volume e intensidade gradualmente para evitar lesões e otimizar adaptações"
                },
                {
                  title: "Nutrição e Hidratação",
                  text: "Aprenda a se alimentar e hidratar adequadamente para treinos mais longos"
                },
                {
                  title: "Recuperação",
                  text: "Priorize o descanso e a recuperação entre os treinos para maximizar os resultados"
                }
              ].map((tip, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-1 bg-primary rounded-full" />
                  <div>
                    <h4 className="font-medium mb-1">{tip.title}</h4>
                    <p className="text-sm text-muted-foreground">{tip.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Block>
        </div>
      </div>
    </Layout>
  );
};

export default TenKPage;