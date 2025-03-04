import React, { useMemo } from 'react';
import Head from 'next/head';
import { GetStaticProps } from 'next';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout';
import { TrainingCard } from '@/components/PlansCard';
import {
  Timer,
  Award,
  Calendar,
  Heart,
  Target,
  Dumbbell,
  Footprints,
  Share2,
  Flame,
  Mountain
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

interface UltraPageProps {
  plans: PlanSummary[];
}

export const getStaticProps: GetStaticProps<UltraPageProps> = async () => {
  try {
    // Buscar planos para distâncias acima de 42km
    // Buscamos por "50km", "80km", etc. 
    // Poderia ser melhorado para buscar todas as distâncias ultra de uma vez
    const ultraPlans = await Promise.all([
      getPlansByDistance('50km', { fields: 'summary' }),
      getPlansByDistance('80km', { fields: 'summary' }),
      getPlansByDistance('100km', { fields: 'summary' }),
      getPlansByDistance('160km', { fields: 'summary' })
    ]).then(results => {
      // Combinar todos os resultados e remover duplicatas por path
      const allPlans = results.flat();
      const uniquePlans = allPlans.filter((plan, index, self) =>
        index === self.findIndex(p => p.path === plan.path)
      );
      return uniquePlans;
    });

    return {
      props: {
        plans: JSON.parse(JSON.stringify(ultraPlans)),
      },
      revalidate: 3600 // Revalidar a cada hora
    };
  } catch (error) {
    console.error('Erro ao buscar planos de ultramaratona:', error);
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
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90">
            Treino de Ultramaratona
          </h1>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center text-primary/80">
              <Target className="mr-1.5 h-4 w-4" />
              80-160km semanais
            </div>
            <div className="flex items-center text-muted-foreground/90">
              <Timer className="mr-1.5 h-4 w-4" />
              6:00-24:00h média
            </div>
            <div className="flex items-center text-muted-foreground/90">
              <Calendar className="mr-1.5 h-4 w-4" />
              16-24 semanas
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
                  title: 'Treino de Ultramaratona - Magic Training',
                  text: 'Descubra planos de treino especializados para ultramaratona no Magic Training',
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

      <div className="hidden md:block">
        <CardDescription className="text-base text-muted-foreground/90 leading-relaxed">
          As ultramaratonas representam o extremo da corrida de longa distância, com percursos 
          que ultrapassam os 42,195km da maratona tradicional. São provas que exigem não apenas 
          preparo físico excepcional, mas também força mental, estratégia de nutrição e gestão 
          de energia. Nossos planos são desenvolvidos por ultramaratonistas experientes e 
          adaptados para diferentes distâncias e terrenos, desde provas de 50km até desafios 
          de múltiplos dias.
        </CardDescription>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: <Flame className="h-4 w-4" />,
            label: "Dificuldade",
            value: "Muito Alta"
          },
          {
            icon: <Heart className="h-4 w-4" />,
            label: "Intensidade",
            value: "60-80% FCM"
          },
          {
            icon: <Footprints className="h-4 w-4" />,
            label: "Frequência",
            value: "5-7x/semana"
          },
          {
            icon: <Calendar className="h-4 w-4" />,
            label: "Duração",
            value: "16-24 semanas"
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

      <Card className="bg-secondary/30 ring-1 ring-border">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground/90">
                Metodologia Especializada
              </h3>
              <p className="text-sm text-muted-foreground">
                Planos desenvolvidos por ultramaratonistas experientes como Sarah McCormack, 
                combinando conhecimento prático com ciência do esporte
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

const UltraPage: React.FC<UltraPageProps> = ({ plans }) => {
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
        <title>Treino de Ultramaratona - Planos e Guia Completo | Magic Training</title>
        <meta 
          name="description" 
          content="Descubra planos de treino especializados para ultramaratona. Programas desenvolvidos por ultramaratonistas experientes para distâncias acima de 42km." 
        />
        <meta property="og:title" content="Treino de Ultramaratona - Guia Completo e Planos" />
        <meta property="og:type" content="website" />
      </Head>

      <div className="container mx-auto px-4">
        <PageHeader />

        <div className="space-y-6 mt-6">
          <Block
            title="Componentes do Treino"
            icon={<Dumbbell className="h-5 w-5 text-primary" />}
          >
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  title: "Resistência Específica",
                  description: "Treinos longos consecutivos e adaptação a diferentes terrenos"
                },
                {
                  title: "Gestão de Energia",
                  description: "Estratégias de nutrição e hidratação para eventos de longa duração"
                },
                {
                  title: "Preparação Mental",
                  description: "Desenvolvimento de resiliência e gestão de fadiga prolongada"
                }
              ].map((component, i) => (
                <Card key={i} className="p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">{component.title}</h4>
                  <p className="text-sm text-muted-foreground">{component.description}</p>
                </Card>
              ))}
            </div>
          </Block>

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

          <Block
            title="Aspectos Essenciais"
            icon={<Mountain className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-4">
              {[
                {
                  title: "Back-to-Back Long Runs",
                  text: "Treinos longos em dias consecutivos para simular fadiga da prova"
                },
                {
                  title: "Nutrição Avançada",
                  text: "Estratégias específicas para eventos de múltiplas horas ou dias"
                },
                {
                  title: "Gestão de Equipamentos",
                  text: "Experiência com equipamentos e adaptação a diferentes condições"
                },
                {
                  title: "Treino Específico",
                  text: "Adaptação ao terreno e condições similares à prova alvo"
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

export default UltraPage;