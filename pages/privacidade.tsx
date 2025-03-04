import React, { useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Info, Shield, Lock, Cookie, Globe } from 'lucide-react';

const PolicySection: React.FC<{
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

const PrivacyPolicyPage: React.FC = () => {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  return (
    <Layout>
      <Head>
        <title>Política de Privacidade - Magic Training</title>
        <meta 
          name="description" 
          content="Política de Privacidade do Magic Training - Saiba como tratamos seus dados ao usar nossa plataforma de treinamentos focada em corrida e fortalecimento." 
        />
      </Head>

      <div className="mx-auto">
        <HeroLayout
          title="Política de Privacidade"
          description="Esta política explica como tratamos as informações quando você utiliza nossa plataforma. Valorizamos sua privacidade e nos comprometemos com a transparência no tratamento dos seus dados."
          
          info={
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <p className="text-sm text-primary/90">
                      Pontos importantes sobre nossa política de privacidade
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
                        <li>Dados processados localmente no seu navegador</li>
                        <li>Não coletamos informações pessoais</li>
                        <li>Cookies utilizados apenas para melhorar a experiência</li>
                        <li>Análises anônimas para aprimoramento da plataforma</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          }
        >
          <div className="space-y-6">
            <PolicySection 
              title="Coleta e Armazenamento de Informações" 
              icon={<Shield className="h-5 w-5 text-primary" />}
            >
              <p className="text-muted-foreground leading-relaxed">
                O Magic Training opera principalmente no lado do cliente, o que significa que a maioria 
                das informações e cálculos são processados diretamente no seu navegador. Não coletamos 
                ou armazenamos informações pessoais como nome, e-mail ou dados de perfil em nossos servidores.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Quaisquer dados inseridos por você na plataforma (como tempos de corrida ou planos de 
                treinamento) são armazenados localmente no seu dispositivo através do armazenamento 
                local do navegador (localStorage). Esses dados não são transmitidos ou armazenados em 
                nossos servidores.
              </p>
            </PolicySection>

            <PolicySection 
              title="Uso de Cookies e Tecnologias Similares" 
              icon={<Cookie className="h-5 w-5 text-primary" />}
            >
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies e tecnologias similares para melhorar a experiência do usuário e 
                analisar o uso da plataforma. Isso inclui:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Cookies funcionais para lembrar suas preferências (como o tema escuro/claro)</li>
                <li>Cookies analíticos para entender como a plataforma é utilizada</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
              </p>
            </PolicySection>

            <PolicySection 
              title="Análise e Monitoramento" 
              icon={<Globe className="h-5 w-5 text-primary" />}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Google Analytics</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Utilizamos o Google Analytics para analisar o uso de nossa plataforma. O Google Analytics 
                    usa cookies para coletar informações sobre como você interage com o Magic Training. 
                    Essas informações são utilizadas para gerar relatórios e nos ajudar a melhorar a 
                    plataforma. O Google Analytics coleta informações de forma anônima, sem identificar 
                    usuários individuais.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Vercel Analytics</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Nossa plataforma é hospedada na Vercel, que fornece análises de desempenho e uso. 
                    A Vercel pode coletar informações como endereços IP, tipo de navegador, e páginas 
                    visitadas para fornecer esses insights. Essas informações são processadas de forma 
                    agregada e não identificam usuários individuais.
                  </p>
                </div>
              </div>
            </PolicySection>

            <PolicySection 
              title="Segurança e Seus Direitos" 
              icon={<Lock className="h-5 w-5 text-primary" />}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Segurança</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Embora a maioria dos dados seja processada localmente, tomamos medidas para proteger 
                    nossa plataforma contra acesso não autorizado ou alterações. No entanto, lembre-se 
                    de que nenhum método de transmissão pela internet ou método de armazenamento 
                    eletrônico é 100% seguro.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Seus Direitos</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Como a maioria dos dados é armazenada localmente em seu dispositivo, você tem 
                    controle direto sobre eles. Você pode limpar esses dados a qualquer momento 
                    através das configurações do seu navegador.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Contato</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Se você tiver dúvidas sobre esta política de privacidade ou sobre como tratamos 
                    suas informações, entre em contato conosco através do e-mail: privacy@magictraining.run
                  </p>
                </div>
              </div>
            </PolicySection>

            <div className="text-sm text-muted-foreground text-right">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
        </HeroLayout>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;