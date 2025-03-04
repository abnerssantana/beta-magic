import React, { useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronUp, 
  ChevronDown, 
  Info, 
  ScrollText,
  Shield, 
  UserCog,
  Scale,
  GanttChartSquare,
  Medal
} from 'lucide-react';

const TermSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {children}
      </div>
    </CardContent>
  </Card>
);

const TermsOfUsePage: React.FC = () => {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  return (
    <Layout>
      <Head>
        <title>Termos de Uso - Magic Training</title>
        <meta 
          name="description" 
          content="Termos de Uso do Magic Training - Plataforma de treinamentos focada em corrida e fortalecimento." 
        />
      </Head>

      <div className="mx-auto">
        <HeroLayout
          title="Termos de Uso"
          description="Ao utilizar o Magic Training, você concorda com os seguintes termos e condições. 
            Leia atentamente para entender seus direitos e responsabilidades ao usar nossa plataforma."
          
          info={
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <p className="text-sm text-primary/90">
                      Pontos importantes sobre nossos termos
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
                        <li>Plataforma colaborativa e gratuita</li>
                        <li>Conteúdo de livre acesso</li>
                        <li>Requer consentimento para distribuição</li>
                        <li>Proibida a comercialização do conteúdo</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          }
        >
          <div className="space-y-6">
            <TermSection 
              title="Natureza da Plataforma" 
              icon={<Medal className="h-5 w-5 text-primary" />}
            >
              <p className="text-muted-foreground leading-relaxed">
                O Magic Training é uma plataforma que visa facilitar o acesso a treinamentos de alta qualidade, 
                focada principalmente em treinos de corrida e fortalecimento. Utilizamos uma calculadora 
                automatizada para determinar os ritmos de treinamento individuais. Nossos treinos são baseados 
                em metodologias de renomados treinadores e livros especializados em corrida.
              </p>
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                  Alerta: Embora nosso objetivo seja fornecer planos de treinamento de alta qualidade, 
                  sempre recomendamos o acompanhamento de um profissional qualificado para garantir que 
                  o treinamento seja adequado às suas necessidades e condições individuais.
                </p>
              </div>
            </TermSection>

            <TermSection 
              title="Uso da Plataforma" 
              icon={<GanttChartSquare className="h-5 w-5 text-primary" />}
            >
              <p className="text-muted-foreground leading-relaxed">
                Você concorda em usar o Magic Training apenas para fins lícitos e de maneira que não 
                infrinja os direitos de terceiros, nem restrinja ou iniba o uso e aproveitamento da 
                plataforma por qualquer outra pessoa.
              </p>
            </TermSection>

            <TermSection 
              title="Conteúdo e Propriedade Intelectual" 
              icon={<ScrollText className="h-5 w-5 text-primary" />}
            >
              <p className="text-muted-foreground leading-relaxed">
                O Magic Training é uma comunidade colaborativa onde construímos conteúdo em conjunto. 
                Todo o material disponível na plataforma é de acesso público, porém requer consentimento 
                para ser distribuído. É expressamente proibida a cobrança de qualquer valor pelo conteúdo 
                disponível no Magic Training.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Ao contribuir com conteúdo, você concede ao Magic Training uma licença não exclusiva 
                para usar, modificar, publicar e exibir esse conteúdo na plataforma.
              </p>
            </TermSection>

            <TermSection 
              title="Conduta do Usuário" 
              icon={<UserCog className="h-5 w-5 text-primary" />}
            >
              <p className="text-muted-foreground leading-relaxed mb-4">
                Você concorda em não:
              </p>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li>Publicar conteúdo ofensivo, abusivo ou que viole a legislação brasileira</li>
                <li>Assediar, ameaçar ou intimidar outros usuários</li>
                <li>Tentar acessar contas de outros usuários ou áreas restritas da plataforma</li>
                <li>Disseminar spam, vírus ou qualquer outro código malicioso</li>
                <li>Comercializar ou cobrar por qualquer conteúdo disponível no Magic Training</li>
              </ul>
            </TermSection>

            <TermSection 
              title="Limitação de Responsabilidade" 
              icon={<Shield className="h-5 w-5 text-primary" />}
            >
              <p className="text-muted-foreground leading-relaxed">
                O Magic Training não se responsabiliza por quaisquer danos diretos, indiretos, 
                incidentais ou consequentes resultantes do uso ou incapacidade de usar nossos serviços.
              </p>
            </TermSection>

            <TermSection 
              title="Modificações e Lei Aplicável" 
              icon={<Scale className="h-5 w-5 text-primary" />}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Modificações dos Termos</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
                    entrarão em vigor imediatamente após sua publicação na plataforma.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Lei Aplicável</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Estes termos são regidos e interpretados de acordo com as leis do Brasil. Qualquer 
                    disputa relacionada a estes termos será submetida à jurisdição exclusiva dos tribunais 
                    brasileiros.
                  </p>
                </div>
              </div>
            </TermSection>

            <div className="text-sm text-muted-foreground text-right">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
        </HeroLayout>
      </div>
    </Layout>
  );
};

export default TermsOfUsePage;