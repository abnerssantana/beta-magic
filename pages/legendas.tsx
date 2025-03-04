import React, { useState } from "react";
import Head from "next/head";
import { Layout } from "@/components/layout";
import { HeroLayout } from "@/components/default/HeroLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Info
} from "lucide-react";
import {
  FaRunning,
  FaTachometerAlt,
  FaHeartbeat,
  FaBolt,
  FaHistory
} from 'react-icons/fa';

const rhythmTypes = [
  {
    key: 'recovery',
    icon: <FaHistory />,
    title: "Ritmo de Recuperação",
    description: "Recuperação ativa após treinos intensos.",
    intensity: "Abaixo de 60% da FCmax. Ritmo muito leve e confortável.",
    purpose: "Facilitar recuperação, promover circulação sanguínea e remover subprodutos do metabolismo.",
    iconColor: "text-purple-500"
  },
  {
    key: 'easy',
    icon: <FaRunning />,
    title: "Ritmo Fácil",
    description: "Aquecimentos, desaquecimentos, corridas fáceis e de recuperação.",
    intensity: "59-74% do VO2max ou 65-79% da FCmax. Ritmo confortável e conversacional.",
    purpose: "Construir base aeróbica, fortalecer o coração e melhorar a capacidade muscular de processar oxigênio.",
    iconColor: "text-blue-500"
  },
  {
    key: 'marathon',
    icon: <FaTachometerAlt />,
    title: "Ritmo de Maratona",
    description: "Corridas constantes ou repetições longas.",
    intensity: "75-84% do VO2max ou 80-90% da FCmax.",
    purpose: "Simular condições de maratona ou manter ritmo moderado em corridas longas.",
    iconColor: "text-green-500"
  },
  {
    key: 'threshold',
    icon: <FaHeartbeat />,
    title: "Ritmo de Limiar",
    description: "Corridas constantes, prolongadas ou intervalos de cruzeiro.",
    intensity: "83-88% do VO2max ou 88-92% da FCmax. Corrida intensa, mas confortável.",
    purpose: "Melhorar resistência e capacidade aeróbica, aumentando o limiar de lactato.",
    iconColor: "text-red-500"
  },
  {
    key: 'interval',
    icon: <FaBolt />,
    title: "Ritmo de Intervalo",
    description: "Treinos intervalados de alta intensidade.",
    intensity: "97-100% do VO2max ou 98-100% da FCmax. Ritmo intenso, sustentável por 10-12 minutos.",
    purpose: "Aumentar potência aeróbica (VO2max) e melhorar eficiência cardiovascular.",
    iconColor: "text-yellow-500"
  }
];

interface RhythmType {
  key: string;
  icon: JSX.Element;
  title: string;
  description: string;
  intensity: string;
  purpose: string;
  iconColor: string;
}

const RhythmDetails = ({ rhythmType }: { rhythmType: RhythmType }) => (
  <Card className="bg-muted/50">
    <CardContent className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <span className={`text-3xl ${rhythmType.iconColor}`}>{rhythmType.icon}</span>
        <div>
          <h3 className="text-lg font-semibold">{rhythmType.title}</h3>
          <p className="text-sm text-muted-foreground">{rhythmType.description}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <h4 className="text-sm font-medium">Intensidade</h4>
          <p className="text-sm text-muted-foreground">{rhythmType.intensity}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Propósito</h4>
          <p className="text-sm text-muted-foreground">{rhythmType.purpose}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function LegendasPage() {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  return (
    <Layout>
      <Head>
        <title>Legendas dos Ritmos de Corrida - Magic Training</title>
        <meta
          name="description"
          content="Explore as legendas dos ritmos de corrida do Magic Training. Entenda os diferentes ritmos como Fácil, Maratona, Limiar, Intervalo e Recuperação, e como eles podem otimizar seu treinamento e melhorar seu desempenho."
        />
      </Head>

      <div className="mx-auto">
        <HeroLayout
          title="Legendas dos Ritmos"
          description="Compreenda os diferentes ritmos de corrida para otimizar seu treinamento. Cada ritmo tem um propósito específico e contribui para seu desenvolvimento como corredor."
          
          info={
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <p className="text-sm text-primary/90">
                      Dicas importantes para entender os ritmos
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                    className="text-primary"
                  >
                    {isInfoExpanded ?
                      <ChevronUp className="h-4 w-4" /> :
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                </div>

                <AnimatePresence>
                  {isInfoExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4"
                    >
                      <ul className="space-y-2 text-sm text-primary/80 list-disc list-inside">
                        <li>Cada ritmo tem uma função específica no treinamento</li>
                        <li>Respeite sempre os limites do seu corpo</li>
                        <li>A variação de ritmos é fundamental para o desenvolvimento</li>
                        <li>Sempre priorize a técnica e a recuperação</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          }
        >
          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <p className="text-sm text-primary/90">
                    Lembre-se: sempre ouça seu corpo e ajuste o ritmo conforme necessário. 
                    Respeitar seus limites é fundamental para evitar lesões e overtraining. 
                    <span className="font-semibold ml-1">Todo poder vem da base!</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {rhythmTypes.map((rhythmType) => (
              <RhythmDetails 
                key={rhythmType.key} 
                rhythmType={rhythmType} 
              />
            ))}
          </div>
        </HeroLayout>
      </div>
    </Layout>
  );
}