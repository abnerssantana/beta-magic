// pages/admin/configuracoes.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useSession, getSession } from 'next-auth/react';
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Info, 
  BellRing, 
  Globe, 
  Lock,
  Loader2, 
  Bell, 
  BadgeAlert,
  MailCheck,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

// Verification of authentication on the server
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/configuracoes',
        permanent: false,
      },
    };
  }

  return {
    props: {}, // No need to pass session data, we'll get it from useSession
  };
};

const SettingsPage = () => {
  const { status } = useSession();
  
  // States for settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [language, setLanguage] = useState('pt-BR');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check session loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handler for saving settings
  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      toast.success('Configurações salvas com sucesso!');
    } catch {
      // Removed the unused error parameter
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Configurações - Magic Training</title>
        <meta name="description" content="Gerencie suas configurações e preferências" />
      </Head>

      <HeroLayout
        title="Configurações"
        description="Personalize sua experiência com o Magic Training"
        info={
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <p className="text-sm text-primary/90">
                  Configure suas preferências de notificação, idioma e outras opções.
                </p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div className="mx-auto space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <MailCheck className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Email</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações por email sobre treinos, atualizações e eventos
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Notificações no site</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações no site sobre atualizações de planos e eventos
                  </p>
                </div>
                <Switch
                  checked={appNotifications}
                  onCheckedChange={setAppNotifications}
                />
              </div>

              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <BadgeAlert className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Marketing</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receba newsletters e atualizações sobre novos recursos e planos
                  </p>
                </div>
                <Switch
                  checked={marketing}
                  onCheckedChange={setMarketing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location and Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Localização e Preferências
              </CardTitle>
              <CardDescription>
                Configure o idioma e fuso-horário da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/Lisbon">Lisboa (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Dispositivos Conectados
              </CardTitle>
              <CardDescription>
                Dispositivos conectados à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Smartphone className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Navegador atual</p>
                      <p className="text-sm text-muted-foreground">
                        Última atividade: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Lock className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </div>
      </HeroLayout>
    </Layout>
  );
};

export default SettingsPage;