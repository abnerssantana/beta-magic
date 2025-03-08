import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Download
} from "lucide-react";
import { toast } from 'sonner';

interface StravaConnectProps {
  onActivitiesImported?: () => void;
}

export const StravaConnect: React.FC<StravaConnectProps> = ({ onActivitiesImported }) => {
  const { data: session } = useSession();
  const [stravaStatus, setStravaStatus] = useState<{
    connected: boolean;
    validToken: boolean;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Verifica o status da conexão com o Strava
  const checkStravaStatus = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/strava/status');
      
      if (!response.ok) {
        throw new Error('Failed to check Strava status');
      }
      
      const data = await response.json();
      setStravaStatus(data);
    } catch (error) {
      console.error('Error checking Strava status:', error);
      toast.error('Erro ao verificar conexão com o Strava');
    } finally {
      setIsLoading(false);
    }
  };

  // Inicia a conexão com o Strava
  const connectStrava = () => {
    if (!session?.user?.id) return;

    setIsConnecting(true);
    
    // URL de autorização do Strava
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/dashboard/strava-callback`;
    const scope = 'read,activity:read_all';
    
    // Redirecionar para a página de autorização do Strava
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
  };

  // Importa atividades do Strava
  const importActivities = async (days: number = 30) => {
    if (!session?.user?.id || !stravaStatus?.connected || !stravaStatus?.validToken) return;

    try {
      setIsImporting(true);
      const response = await fetch('/api/strava/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to import activities');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${data.imported} atividades importadas com sucesso!`);
        if (onActivitiesImported) onActivitiesImported();
      } else {
        toast.info(data.message || 'Nenhuma atividade nova encontrada');
      }
    } catch (error) {
      console.error('Error importing activities:', error);
      toast.error('Erro ao importar atividades do Strava');
    } finally {
      setIsImporting(false);
    }
  };

  // Verifica o status ao carregar o componente
  useEffect(() => {
    if (session?.user?.id) {
      checkStravaStatus();
    }
  }, [session?.user?.id]);

  // Se estiver carregando, mostrar indicador
  if (isLoading) {
    return (
      <Card className="border-orange-500/20">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-orange-500 animate-spin mr-2" />
          <p className="text-sm text-muted-foreground">Verificando conexão com o Strava...</p>
        </CardContent>
      </Card>
    );
  }

  // Se não estiver conectado
  if (!stravaStatus?.connected) {
    return (
      <Card className="border-orange-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <img 
              src="/strava-logo.svg"
              alt="Strava"
              className="h-5"
            />
            Conectar com Strava
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-4">
            Conecte sua conta do Strava para importar suas atividades automaticamente.
          </div>
          <Button 
            variant="default" 
            onClick={connectStrava}
            disabled={isConnecting}
            className="w-full bg-[#FC4C02] hover:bg-[#e34500] text-white"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <img 
                  src="/strava-logo-white.svg"
                  alt="Strava"
                  className="h-4 mr-2"
                />
                Conectar com Strava
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Se estiver conectado
  return (
    <Card className="border-[#FC4C02]/20">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center gap-2">
            <img 
              src="/strava-logo.svg"
              alt="Strava"
              className="h-5"
            />
            Strava
          </CardTitle>
          <Badge 
            variant={stravaStatus.validToken ? "outline" : "destructive"}
            className={stravaStatus.validToken 
              ? "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30" 
              : ""}
          >
            {stravaStatus.validToken ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Conectado
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Token Inválido
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="text-sm text-muted-foreground">
          {stravaStatus.validToken 
            ? 'Importe suas atividades do Strava para vincular ao seu plano de treino.'
            : 'Sua conexão com o Strava expirou. Reconecte sua conta.'}
        </div>
        <div className="flex flex-col space-y-2">
          <Button
            variant="default"
            onClick={() => importActivities(30)}
            disabled={isImporting || !stravaStatus.validToken}
            className="w-full bg-[#FC4C02] hover:bg-[#e34500] text-white"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando atividades...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Importar últimos 30 dias
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => importActivities(7)}
              disabled={isImporting || !stravaStatus.validToken}
              className="flex-1"
            >
              Últimos 7 dias
            </Button>
            <Button
              variant="outline"
              onClick={() => importActivities(90)}
              disabled={isImporting || !stravaStatus.validToken}
              className="flex-1"
            >
              Últimos 90 dias
            </Button>
          </div>
          {!stravaStatus.validToken && (
            <Button 
              variant="outline" 
              onClick={connectStrava}
              className="w-full mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reconectar com Strava
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground flex justify-between">
        <span>Atividades importadas serão vinculadas ao plano ativo</span>
        <a 
          href="https://strava.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center hover:text-primary transition-colors"
        >
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </CardFooter>
    </Card>
  );
};

export default StravaConnect;