import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  FaCalendarAlt,
  FaSync,
  FaClipboardList,
  FaEnvelope,
  FaCheckCircle,
  FaInstagram,
  FaDiscord,
  FaArrowRight,
  FaUserCog,
  FaChartLine,
  FaComments
} from 'react-icons/fa';
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface ContactOptionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  linkText: string;
  colorClass: string;
}

const ContactOption: React.FC<ContactOptionProps> = ({
  icon: Icon,
  title,
  description,
  link,
  linkText,
  colorClass
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xs border border-border"
  >
    <Icon className={`w-8 h-8 ${colorClass} mb-4`} />
    <h3 className="text-xl font-semibold mb-4 text-foreground">
      {title}
    </h3>
    <p className="text-muted-foreground mb-4">
      {description}
    </p>
    <Button
      variant="link"
      asChild
      className={`${colorClass} p-0 hover:no-underline`}
    >
      <Link
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center"
      >
        {linkText}
        <FaArrowRight className="ml-2" />
      </Link>
    </Button>
  </motion.div>
);

const TrainingPeaksContactPage: React.FC = () => {

  const contactOptions: ContactOptionProps[] = [
    {
      icon: FaInstagram,
      title: "Instagram",
      description: "Me siga no Instagram e entre em contato por DM para mais informações.",
      link: "https://instagram.com/abnerssantana",
      linkText: "@abnerssantana",
      colorClass: "text-pink-500 hover:text-pink-600"
    },
    {
      icon: FaDiscord,
      title: "Discord",
      description: "Me envie uma mensagem direta no Discord para conversarmos.",
      link: "https://discord.com/users/abnerssantana",
      linkText: "@abnerssantana",
      colorClass: "text-indigo-500 hover:text-indigo-600"
    },
    {
      icon: FaEnvelope,
      title: "E-mail",
      description: "Envie um e-mail detalhando seus objetivos e necessidades.",
      link: "mailto:abnerss@outlook.com",
      linkText: "abnerss@outlook.com",
      colorClass: "text-blue-500 hover:text-blue-600"
    }
  ];

  const personalFeatures = [
    {
      icon: FaChartLine,
      title: "Análise Inicial do Corredor",
      description: "Avaliação completa do seu histórico de corrida, pace atual, objetivos e necessidades específicas para criar um plano sob medida."
    },
    {
      icon: FaCalendarAlt,
      title: "Periodização Científica",
      description: "Planejamento estruturado considerando suas provas de corrida, eventos importantes e adaptação progressiva."
    },
    {
      icon: FaClipboardList,
      title: "Acompanhamento Semanal",
      description: "Análise dos treinos realizados, ajuste de ritmos e volumes conforme sua evolução na corrida."
    },
    {
      icon: FaComments,
      title: "Suporte Contínuo",
      description: "Comunicação direta para dúvidas sobre treinos, ajustes de pace e orientações técnicas de corrida."
    }
  ];

  return (
    <Layout>
      <Head>
        <title>Treinamento Personalizado de Corrida de Rua - Magic Training</title>
        <meta
          name="description"
          content="Alcance seus objetivos na corrida de rua com planos personalizados. Periodização científica, análise detalhada e suporte contínuo."
        />
      </Head>

      <HeroLayout
        title="Treinamento Personalizado e TrainingPeaks"
        description="Eleve seu treino ao próximo nível. Escolha entre solicitar qualquer plano do Magic Training no TrainingPeaks ou opte por um acompanhamento totalmente personalizado com suporte contínuo."
      >
        <div className="space-y-6">
          {/* TrainingPeaks Section */}
          <Card className="border-green-500 border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <FaSync className="w-10 h-10 text-green-500" />
                <h2 className="text-2xl font-bold text-foreground">
                  Magic Training no TrainingPeaks
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Todos os planos disponíveis no Magic Training também podem ser acessados diretamente no TrainingPeaks.
                Confira meu perfil de treinador para encontrar o plano ideal para você, com todas as
                métricas calculadas automaticamente e sincronização com seu dispositivo.
              </p>
              <p className="text-foreground mb-4 font-semibold">
              Caso o plano ainda não esteja disponível, entre em contato para solicitar este plano no TrainingPeaks para sincronização automática.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  {[
                    "Sincronização automática com relógios GPS (Garmin, Polar, Coros)",
                    "Zonas de intensidade calculadas automaticamente",
                    "Métricas detalhadas e análise de cada treino"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  variant="default"
                  className="bg-green-500 hover:bg-green-600 text-white mt-4"
                >
                  <Link
                    href="https://www.trainingpeaks.com/coach/abner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Ver Planos Disponiveis no TrainingPeaks
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Training Section */}
          <Card className="border-blue-500 border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <FaUserCog className="w-10 h-10 text-blue-500" />
                <h2 className="text-2xl font-bold text-foreground">
                  Treinamento Personalizado
                </h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Receba um acompanhamento completo com plano personalizado, análises semanais
                e suporte contínuo para alcançar seus objetivos.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {personalFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-secondary/30 p-4 rounded-lg"
                  >
                    <feature.icon className="w-8 h-8 text-blue-500 mb-3" />
                    <h3 className="font-semibold mb-2 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Options */}
          <div className="grid md:grid-cols-3 gap-4">
            {contactOptions.map((option, index) => (
              <ContactOption key={index} {...option} />
            ))}
          </div>
        </div>
      </HeroLayout>
    </Layout>
  );
};

export default TrainingPeaksContactPage;