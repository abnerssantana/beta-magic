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

interface Plan {
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

interface HalfMarathonPageProps {
  plans: Plan[];
}

export const getStaticProps: GetStaticProps<HalfMarathonPageProps> = async () => {
  const allPlans = await import('../planos/index').then((module) => module.default as Plan[]);
  const halfMarathonPlans = allPlans.filter(plan => plan.distances?.includes('21km'));

  return {
    props: {
      plans: halfMarathonPlans,
    },
  };
};

const PageHeader = () => (
  <Card className="border-none shadow-none">
    <CardContent className="p-2 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90">
            Treino de Meia Maratona
          </h1>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center text-primary/80">
              <Target className="mr-1.5 h-4 w-4" />
              50-100km semanais
            </div>
            <div className="flex items-center text-muted-foreground/90">
              <Timer className="mr-1.5 h-4 w-4" />
              1:45-2:30h média
            </div>
            <div className="flex items-center text-muted-foreground/90">
              <Calendar className="mr-1.5 h-4 w-4" />
              12-24 semanas
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
                  title: 'Treino de Meia Maratona - Magic Training',
                  text: 'Descubra planos de treino especializados para meia maratona no Magic Training',
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
          A meia maratona é uma distância desafiadora que combina resistência e estratégia. 
          Com 21,097 km, é um objetivo popular tanto para corredores que querem ir além das 
          distâncias curtas quanto para aqueles que se preparam para uma maratona completa. 
          Nossos planos de treinamento são desenvolvidos por treinadores experientes e baseados 
          em metodologias científicas comprovadas, adaptados para diferentes níveis de experiência 
          e objetivos.
        </CardDescription>
      </div>

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
            value: "65-85% FCM"
          },
          {
            icon: <Footprints className="h-4 w-4" />,
            label: "Frequência",
            value: "4-6x/semana"
          },
          {
            icon: <Calendar className="h-4 w-4" />,
            label: "Duração",
            value: "12-24 semanas"
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
                Metodologia Comprovada
              </h3>
              <p className="text-sm text-muted-foreground">
                Planos desenvolvidos por treinadores renomados como Jack Daniels, Pete Pfitzinger 
                e Hal Higdon, com mais de 5.000 corredores já beneficiados
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

const HalfMarathonPage: React.FC<HalfMarathonPageProps> = ({ plans }) => {
  const plansByLevel = useMemo(() => {
    const levels = ['iniciante', 'intermediário', 'avançado', 'elite'];
    return levels.reduce((acc, level) => {
      acc[level] = plans.filter(plan => plan.nivel?.toLowerCase() === level);
      return acc;
    }, {} as Record<string, Plan[]>);
  }, [plans]);

  return (
    <Layout>
      <Head>
        <title>Treino de Meia Maratona - Planos e Guia Completo | Magic Training</title>
        <meta 
          name="description" 
          content="Descubra planos de treino especializados para meia maratona. Programas para todos os níveis, do iniciante ao avançado, com metodologias comprovadas." 
        />
        <meta property="og:title" content="Treino de Meia Maratona - Guia Completo e Planos" />
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
                  title: "Base Aeróbica Sólida",
                  description: "Desenvolvimento gradual da resistência necessária para completar 21,1km"
                },
                {
                  title: "Treinos Específicos",
                  description: "Combinação estratégica de corridas longas, ritmo e intervalados"
                },
                {
                  title: "Periodização Científica",
                  description: "Progressão estruturada de volume e intensidade para maximizar resultados"
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
            title="Dicas para o Treino"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-4">
              {[
                {
                  title: "Preparação Progressiva",
                  text: "Aumente o volume e intensidade gradualmente, respeitando os períodos de adaptação"
                },
                {
                  title: "Nutrição e Hidratação",
                  text: "Desenvolva estratégias de nutrição e hidratação durante os treinos longos"
                },
                {
                  title: "Recuperação Ativa",
                  text: "Priorize a recuperação entre treinos intensos para maximizar adaptações"
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

export default HalfMarathonPage;