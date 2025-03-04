import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import { Card, CardContent, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Info, Heart } from 'lucide-react';
import { FaYoutube, FaDonate, FaUsers, FaDiscord, FaStrava } from 'react-icons/fa';

interface SupportOptionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  link: string;
  linkText: string;
  colorClass?: string;
}

const SupportOption: React.FC<SupportOptionProps> = ({ icon: Icon, title, description, link, linkText, colorClass = "text-primary" }) => (
  <Card className="h-full">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Icon className={`w-8 h-8 ${colorClass}`} />
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-muted-foreground">
        {description}
      </p>
      <Button asChild variant="link" className={`${colorClass} p-0 h-auto font-medium hover:no-underline`}>
        <Link href={link} target="_blank" rel="noopener noreferrer">
          {linkText}
        </Link>
      </Button>
    </CardContent>
  </Card>
);

interface BenefitProps {
  text: string;
}

const Benefit: React.FC<BenefitProps> = ({ text }) => (
  <div className="flex items-center gap-3">
    <Heart className="h-5 w-5 text-red-500" />
    <span className="text-muted-foreground">{text}</span>
  </div>
);

export default function SupportPage() {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const benefits = [
    "Acesso antecipado a novos vídeos e conteúdos",
    "Participação em sorteios de produtos esportivos",
    "Consultoria personalizada sobre planos de treinamento",
    "Bate-papos exclusivos com especialistas em corrida",
    "Descontos em eventos e produtos parceiros",
    "Reconhecimento especial na comunidade"
  ];

  const supportOptions = [
    {
      icon: FaYoutube,
      title: "Torne-se Membro",
      description: "Apoie-nos tornando-se membro do nosso canal no YouTube. Desfrute de conteúdos exclusivos, lives especiais e participe de sorteios!",
      link: "https://www.youtube.com/channel/UCKl5xev9VFkTV0YTHO74DIQ/join",
      linkText: "Seja Membro",
      colorClass: "text-red-500"
    },
    {
      icon: FaDonate,
      title: "Faça uma Doação",
      description: "Contribua com qualquer valor para apoiar nosso trabalho. Sua doação ajuda a manter e melhorar nossas ferramentas.",
      link: "#",
      linkText: "abnerss@outlook.com",
      colorClass: "text-green-500"
    },
    {
      icon: FaUsers,
      title: "Participe da Comunidade",
      description: "Junte-se ao nosso Discord e Clube no Strava. Compartilhe experiências, faça perguntas e conecte-se com outros corredores.",
      link: "https://discord.gg/pGcDZjhRry",
      linkText: "Entrar na Comunidade",
      colorClass: "text-purple-500"
    }
  ];

  return (
    <Layout>
      <Head>
        <title>Apoie o Magic Training - Transforme Sua Corrida</title>
        <meta 
          name="description" 
          content="Descubra como apoiar o Magic Training e faça parte de uma comunidade apaixonada por corrida. Sua contribuição ajuda a criar conteúdos e ferramentas de alta qualidade." 
        />
        <meta name="google-adsense-content" content="noads"/>
      </Head>

      <div className="mx-auto">
        <HeroLayout
          title="Apoie o Magic Training"
          description="Sua contribuição impulsiona nossa missão de transformar vidas através da corrida. 
            Ajude-nos a continuar oferecendo conteúdo de qualidade e ferramentas inovadoras 
            para a comunidade de corredores."
          
          info={
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <p className="text-sm text-primary/90">
                      Benefícios de apoiar o Magic Training
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
                      className="mt-4 space-y-2"
                    >
                      {benefits.map((benefit, index) => (
                        <Benefit key={index} text={benefit} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          }
        >
          <div className="space-y-6">
            {/* Community Section */}
            <Card className="bg-secondary/30">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Faça Parte da Nossa Comunidade</h2>
                  <p className="text-muted-foreground">
                    Junte-se a uma comunidade vibrante de corredores apaixonados. 
                    Compartilhe experiências, aprenda com outros atletas e cresça junto conosco.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button asChild variant="outline" className="gap-2">
                      <Link href="https://discord.gg/pGcDZjhRry" target="_blank">
                        <FaDiscord className="w-4 h-4" />
                        Discord
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link href="#" target="_blank">
                        <FaStrava className="w-4 h-4" />
                        Strava
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Options */}
            <div className="grid md:grid-cols-3 gap-6">
              {supportOptions.map((option, index) => (
                <SupportOption key={index} {...option} />
              ))}
            </div>

            {/* Call to Action */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold">Juntos, Vamos Mais Longe</h2>
                  <p className="text-primary-foreground/90">
                    Seu apoio é fundamental para continuarmos crescendo e impactando 
                    mais vidas através da corrida.
                  </p>
                  <Button 
                    asChild 
                    variant="secondary" 
                    size="lg"
                    className="mt-4"
                  >
                    <Link 
                      href="https://www.youtube.com/channel/UCKl5xev9VFkTV0YTHO74DIQ/join" 
                      target="_blank"
                    >
                      Apoiar Agora
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </HeroLayout>
      </div>
    </Layout>
  );
}