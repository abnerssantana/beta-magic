import React, { useState } from 'react';
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { Layout } from '@/components/layout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Info,
  ChevronDown,
  Youtube,
  Dumbbell, 
  Timer,
  Rabbit,
  User2,
  Calendar,
  Share2,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import treinoPlans, { TrainingPlan } from "../../planos/treino";

// Types
interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  time?: number;
  video?: string;
}

interface DayData {
  day: string;
  note?: string;
  exercises: Exercise[];
}

interface TreinoPlanPageProps {
  plan: TrainingPlan & { data?: DayData[] };
}

// Utility functions
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0
    ? `${minutes} min ${remainingSeconds} seg`
    : `${seconds} seg`;
};

// Exercise Card Component
const ExerciseCard = ({ exercise, openModal }: { exercise: Exercise; openModal: (url: string) => void }) => (
  <Card 
    className="group relative hover:shadow-md transition-all duration-300"
    onClick={() => exercise.video && openModal(exercise.video)}
  >
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold group-hover:text-primary transition-colors">
          {exercise.name}
        </h3>
        {exercise.video && (
          <Badge variant="secondary" className="bg-red-500/10 text-red-500 shrink-0">
            <Youtube className="h-4 w-4 mr-1" />
            Video
          </Badge>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground">
        {exercise.sets && exercise.reps && (
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            {exercise.sets} x {exercise.reps}
          </div>
        )}
        {exercise.sets && exercise.time && (
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            {exercise.sets} x {formatTime(exercise.time)}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Day Accordion Component
interface DayAccordionProps {
  day: DayData;
  openModal: (url: string) => void;
  isOpen: boolean;
  toggleDay: () => void;
}

const DayAccordion: React.FC<DayAccordionProps> = ({ day, openModal, isOpen, toggleDay }) => {
  const icon = day.exercises[0].name === "Dia de corrida" ? 
    <Rabbit className="h-5 w-5 text-primary" /> : 
    <Dumbbell className="h-5 w-5 text-primary" />;

  return (
    <Card className="mb-4">
      <CardHeader className="cursor-pointer" onClick={toggleDay}>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {icon}
            {day.day}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="p-0 h-auto"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </CardTitle>
      </CardHeader>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent>
              {day.note && (
                <Card className="mb-4 bg-primary/5 border-primary/20">
                  <CardContent className="p-4 flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-1" />
                    <p className="text-sm text-primary/90">{day.note}</p>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {day.exercises.map((exercise, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <ExerciseCard 
                      exercise={exercise} 
                      openModal={openModal} 
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Main Component
const TreinoPlan: React.FC<TreinoPlanPageProps> = ({ plan }) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [openDayIndex, setOpenDayIndex] = useState(0);

  if (!plan) {
    return <div>Plano não encontrado</div>;
  }

  const openModal = (url: string) => setVideoUrl(url);
  const closeModal = () => setVideoUrl("");
  const toggleDay = (index: number) => {
    setOpenDayIndex(openDayIndex === index ? -1 : index);
  };

  const getLevelBadgeStyle = (level: string) => {
    switch (level.toLowerCase()) {
      case "iniciante":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800";
      case "intermediário":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800";
      case "avançado":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800";
      case "elite":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700";
    }
  };

  return (
    <Layout>
      <Head>
        <title>{`${plan.name} (${plan.nivel}) - Magic Training`}</title>
        <meta name="description" content={plan.info} />
        <meta property="og:title" content={`Planilha ${plan.name}`} />
        <meta property="og:description" content={plan.info || ''} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/img/pages/home.jpg" />
        <meta property="og:site_name" content="Magic Training" />
      </Head>

      <div className="mx-auto">
        <Card className="border-none shadow-none">
          <CardContent className="mt-3 p-2 space-y-4">
            {/* Header Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90">
                  {plan.name}
                </h1>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-md",
                      getLevelBadgeStyle(plan.nivel)
                    )}
                  >
                    {plan.nivel}
                  </Badge>
                  <div className="flex items-center text-muted-foreground/90">
                    <User2 className="mr-1.5 h-4 w-4" />
                    {plan.coach}
                  </div>
                  <div className="flex items-center text-muted-foreground/90">
                    <Calendar className="mr-1.5 h-4 w-4" />
                    {plan.duration}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {plan.videoUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(plan.videoUrl, '_blank', 'noopener,noreferrer')}
                    className="text-red-500 hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-950/50 ring-1 ring-red-200 dark:ring-red-800"
                  >
                    <Youtube className="h-5 w-5" />
                    <span className="sr-only">Ver vídeo do plano</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const shareData = {
                      title: `Plano de Treino: ${plan.name}`,
                      text: `Confira este plano de treino no Magic Training!`,
                      url: window.location.href
                    };
                    
                    if (navigator.share) {
                      navigator.share(shareData);
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copiado para a área de transferência!');
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground ring-1 ring-border"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="sr-only">Compartilhar plano</span>
                </Button>
              </div>
            </div>

            {/* Plan Description */}
            <div className="hidden md:block">
              <CardDescription className="text-base text-muted-foreground/90 leading-relaxed">
                {plan.info}
              </CardDescription>
            </div>

            <div className="md:hidden">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal ring-1 ring-border"
                  >
                    <span className="line-clamp-1 flex-1 text-muted-foreground">
                      {plan.info}
                    </span>
                    <Info className="h-4 w-4 ml-2 shrink-0" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold mb-2">
                      Sobre o plano
                    </DialogTitle>
                    <DialogDescription className="text-base text-foreground">
                      {plan.info}
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 mt-4 px-2">
          {plan.data && plan.data.map((day, index) => (
            <DayAccordion 
              key={index} 
              day={day} 
              openModal={openModal} 
              isOpen={index === openDayIndex}
              toggleDay={() => toggleDay(index)}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!videoUrl} onOpenChange={() => closeModal()}>
        <DialogContent className="sm:max-w-3xl">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={videoUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = treinoPlans.map((plan) => ({
    params: { planPath: plan.path },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const plan = treinoPlans.find((plan) => plan.path === params?.planPath);

  if (!plan || !["iniciante", "intermediário", "avançado", "elite"].includes(plan.nivel)) {
    return { notFound: true };
  }

  try {
    const planData = await import(`../../planos/treinos/${plan.path}.json`)
      .then(module => module.default);
    return { 
      props: { 
        plan: { ...plan, data: planData } 
      } 
    };
  } catch (error) {
    console.error(`Error loading plan data for ${plan.path}:`, error);
    return { props: { plan } };
  }
};

export default TreinoPlan;