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

interface FiveKPageProps {
  plans: Plan[];
}

export const getStaticProps: GetStaticProps<FiveKPageProps> = async () => {
  const allPlans = await import('../planos/index').then((module) => module.default as Plan[]);
  const fiveKPlans = allPlans.filter(plan => plan.distances?.includes('5km'));

  return {
    props: {
      plans: fiveKPlans,
    },
  };
};

const PageHeader = () => (
  <Card className="border-none shadow-none">
    <CardContent className="p-2 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90">
            Treino de 5km
          </h1>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center text-primary/80">
              <Target className="mr-1.5 h-4 w-4" />
              30-50km semanais
            </div>
            <div className="flex items-center text-muted-foreground/90">
              <Timer className="mr-1.5 h-4 w-4" />
              25-30 min média
            </div>
            <div className="flex items-center text-muted-foreground/90">
              <Calendar className="mr-1.5 h-4 w-4" />
              8-12 semanas
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
                  title: 'Treino de 5km - Magic Training',
                  text: 'Descubra planos de treino especializados para 5km no Magic Training',
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
          A prova de 5km é uma das distâncias mais populares e estratégicas no mundo da corrida.
          É uma distância desafiadora que exige um equilíbrio perfeito entre velocidade e resistência,
          sendo excelente tanto para iniciantes buscando completar sua primeira prova quanto para
          corredores experientes almejando novos recordes pessoais. Nossos planos de treinamento foram
          desenvolvidos por renomados treinadores olímpicos e são baseados em metodologias consagradas
          em livros de referência e na experiência de grandes atletas.
        </CardDescription>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: <Flame className="h-4 w-4" />,
            label: "Dificuldade",
            value: "Moderada"
          },
          {
            icon: <Heart className="h-4 w-4" />,
            label: "Intensidade",
            value: "65-80% FCM"
          },
          {
            icon: <Footprints className="h-4 w-4" />,
            label: "Frequência",
            value: "3-5x/semana"
          },
          {
            icon: <Calendar className="h-4 w-4" />,
            label: "Duração",
            value: "8-12 semanas"
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
                Planos de treinamento desenvolvidos por treinadores olímpicos e inspirados em grandes atletas,
                com mais de 4.000 corredores já beneficiados
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

const FiveKPage: React.FC<FiveKPageProps> = ({ plans }) => {
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
        <title>Treino de 5km - Planos e Guia Completo | Magic Training</title>
        <meta
          name="description"
          content="Descubra planos de treino especializados para 5km. Programas para todos os níveis, do iniciante ao avançado. Melhore seu tempo e performance com treinos estruturados."
        />
        <meta property="og:title" content="Treino de 5km - Guia Completo e Planos" />
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
                  title: "Elite Coaching",
                  description: "Planos desenvolvidos por treinadores olímpicos e baseados em metodologias comprovadas"
                },
                {
                  title: "Variedade de Níveis",
                  description: "Do iniciante ao atleta avançado, com progressões adequadas para cada perfil"
                },
                {
                  title: "Metodologia Testada",
                  description: "Baseada em livros de referência e na experiência de grandes atletas"
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
                  title: "Base Científica",
                  text: "Planos estruturados com base em princípios científicos do treinamento esportivo"
                },
                {
                  title: "Flexibilidade",
                  text: "Adaptável a diferentes objetivos e níveis de condicionamento físico"
                },
                {
                  title: "Suporte Comunitário",
                  text: "Faça parte de uma comunidade com mais de 4.000 corredores que já utilizaram nossos planos"
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

export default FiveKPage;