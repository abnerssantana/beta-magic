import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Info, Calendar, Medal, Timer } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import competitions from '@/src/competitions.json';

// Componentes auxiliares
interface Image {
  src: string;
  alt: string;
}

const ImageGallery: React.FC<{ images: Image[] }> = ({ images }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {images.map((img, index) => (
      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
    ))}
  </div>
);

interface Competition {
  title: string;
  distance: string;
  time: string;
  result: string;
  date: string;
}

const CompetitionCard: React.FC<{ competition: Competition }> = ({ competition }) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{competition.title}</h3>
          <Badge variant="outline" className="bg-primary/10 text-primary shrink-0">
            {competition.distance}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Timer className="h-4 w-4 shrink-0" />
            {competition.time}
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Medal className="h-4 w-4 shrink-0" />
            <span className="truncate">{competition.result}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-3">
            <Calendar className="h-4 w-4 shrink-0" />
            {formatDate(competition.date)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AboutContent = () => {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [showAllCompetitions, setShowAllCompetitions] = useState(false);

  const aboutContent = [
    "Desde os 13 anos, venho imerso no universo da computação, trilhando diferentes caminhos que moldaram minha trajetória. Iniciei minha jornada em lojas de informática, onde adquiri conhecimentos sólidos em manutenção e instalações de rede. Com o tempo, direcionei meu foco para a área que verdadeiramente me apaixonou: a infraestrutura e segurança de TI.",
    "Minha carreira é um constante aprendizado e evolução, enfrentando diariamente desafios que impulsionam minha paixão pela profissão. A capacidade de solucionar problemas complexos e aprimorar a segurança dos sistemas são aspectos que me motivam intensamente.",
    "Paralelamente, a corrida entrou em minha vida como um catalisador de transformações. Engajado em buscar performance, participei de grandes competições e me tornei um atleta federado. Essa jornada esportiva não é apenas física; é também uma fonte constante de aprendizado sobre treinamento e fisiologia.",
    "Esse amor pela corrida culminou no desenvolvimento do projeto Magic Training. O Magic Training oferece planos de treinamento personalizados para corrida e fortalecimento, além de um rank de maratonistas, estatísticas das maratonas e um calendário de eventos."
  ];

  const galleryImages = [
    { src: "/img/abnersantana-corrida1.jpg", alt: "Abner Santana correndo" },
    { src: "/img/abnersantana-corrida2.jpg", alt: "Abner Santana em competição" },
    { src: "/img/abnersantana-corrida4.jpg", alt: "Momento de corrida" },
    { src: "/img/abnersantana-corrida5.jpg", alt: "Treinamento de Abner" },
    { src: "/img/abnersantana-corrida6.jpg", alt: "Abner em maratona" },
    { src: "/img/abnersantana-corrida7.jpg", alt: "Cruzando a linha de chegada" }
  ];

  const displayedCompetitions = showAllCompetitions ? competitions : competitions.slice(0, 9);

  return (
    <Layout>
      <Head>
        <title>Sobre - Magic Training</title>
        <meta 
          name="description" 
          content="Conheça a história por trás do Magic Training, uma plataforma inovadora que combina tecnologia e paixão pela corrida." 
        />
      </Head>

      <div className="mx-auto">
        <HeroLayout
          title="Sobre o Magic Training"
          description="Descubra como a paixão pela tecnologia e pela corrida se uniram para criar uma plataforma inovadora de treinamento e análise para corredores de todos os níveis."
          
          info={
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <p className="text-sm text-primary/90">
                      Tecnologia e corrida unidas em uma plataforma única
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
                        <li>Planos personalizados baseados em ciência</li>
                        <li>Análises detalhadas de performance</li>
                        <li>Comunidade ativa de corredores</li>
                        <li>Suporte técnico especializado</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          }
        >
          <div className="space-y-8">
            {/* História */}
            <Card>
              <CardHeader>
                <CardTitle>A Jornada de Abner Santana</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutContent.map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </CardContent>
            </Card>

            {/* Galeria de Imagens */}
            <Card>
              <CardHeader>
                <CardTitle>Momentos na Corrida</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageGallery images={galleryImages} />
              </CardContent>
            </Card>

            {/* Competições */}
            <Card>
              <CardHeader>
                <CardTitle>Competições</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedCompetitions.map((competition, index) => (
                    <CompetitionCard key={index} competition={competition} />
                  ))}
                </div>

                {!showAllCompetitions && competitions.length > 9 && (
                  <Button
                    onClick={() => setShowAllCompetitions(true)}
                    className="w-full"
                    variant="outline"
                  >
                    Mostrar mais competições
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </HeroLayout>
      </div>
    </Layout>
  );
};

export default AboutContent;