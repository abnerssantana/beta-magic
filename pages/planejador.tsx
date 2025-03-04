import React, { useState } from 'react';
import Head from 'next/head';
import { Layout } from "@/components/layout";
import { HeroLayout } from "@/components/default/HeroLayout";
import { Info, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import PacePlanner from '@/components/PacePlanner';

export default function PacePlannerPage() {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  return (
    <Layout>
      <Head>
        <title>Planejador de Ritmo de Corrida - Magic Training</title>
        <meta 
          name="description" 
          content="Planeje seus splits e ritmos de corrida com precisão usando o planejador de ritmo do Magic Training. Ajuste seu ritmo baseado nas condições climáticas." 
        />
      </Head>

      <div className="mx-auto">
        <HeroLayout
          title="Planejador de Ritmo"
          description="Planeje sua estratégia de corrida definindo ritmos específicos para cada trecho do percurso. 
            Use esta ferramenta para calcular tempos parciais e totais com base nos ritmos planejados, 
            considerando também as condições climáticas."

          info={
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <p className="text-sm text-primary/90">
                      Dicas para usar o planejador de ritmo
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
                        <li>Selecione uma distância predefinida ou personalize sua própria</li>
                        <li>Ajuste as condições climáticas para cálculos mais precisos</li>
                        <li>Use o ritmo base para definir um pace consistente</li>
                        <li>Personalize splits individuais para estratégias específicas</li>
                        <li>Verifique o sumário para uma visão geral do seu plano</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          }
        >
          <PacePlanner />
        </HeroLayout>
      </div>
    </Layout>
  );
}