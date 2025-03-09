import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle,
  Link2
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
  const [error, setError] = useState<string | null>(null);
  const [lastImportStats, setLastImportStats] = useState<{
    imported: number;
    matched: number;
    timestamp: Date;
  } | null>(null);

  // Verifica o status da conexão com o Strava
  const checkStravaStatus = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/strava/status');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check Strava status');
      }
      
      const data = await response.json();
      setStravaStatus(data);
    } catch (error) {
      console.error('Error checking Strava status:', error);
      setError('Não foi possível verificar o status da conexão com o Strava');
      toast.error('Erro ao verificar conexão com o Strava');
    } finally {
      setIsLoading(false);
    }
  };

  // Inicia a conexão com o Strava
  const connectStrava = () => {
    if (!session?.user?.id) return;

    setIsConnecting(true);
    
    try {
      // URL de autorização do Strava
      const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
      const redirectUri = `${window.location.origin}/dashboard/strava-callback`;
      const scope = 'read,activity:read_all';
      
      if (!clientId) {
        throw new Error('Strava Client ID não configurado');
      }
      
      // Redirecionar para a página de autorização do Strava
      window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      setIsConnecting(false);
      setError('Erro ao conectar com o Strava. Tente novamente mais tarde.');
      toast.error('Erro ao iniciar conexão com o Strava');
    }
  };

  // Importa atividades do Strava
  const importActivities = async (days: number = 30) => {
    if (!session?.user?.id || !stravaStatus?.connected || !stravaStatus?.validToken) return;

    try {
      setIsImporting(true);
      setError(null);
      const response = await fetch('/api/strava/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import activities');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Salvar estatísticas da importação
        setLastImportStats({
          imported: data.imported,
          matched: data.matched || 0,
          timestamp: new Date()
        });
        
        if (data.imported > 0) {
          // Mostrar feedback específico sobre atividades vinculadas ao plano
          if (data.matched > 0) {
            toast.success(`${data.imported} atividades importadas! ${data.matched} foram vinculadas ao seu plano ativo.`);
          } else {
            toast.success(`${data.imported} atividades importadas com sucesso!`);
          }
          
          if (onActivitiesImported) onActivitiesImported();
        } else {
          toast.info(data.message || 'Nenhuma atividade nova encontrada');
        }
      } else {
        toast.info(data.message || 'Nenhuma atividade nova encontrada');
      }
    } catch (error) {
      console.error('Error importing activities:', error);
      setError('Erro ao importar atividades do Strava');
      toast.error('Erro ao importar atividades do Strava');
    } finally {
      setIsImporting(false);
    }
  };

  // Tenta novamente verificar o status após um erro
  const retryConnection = () => {
    setError(null);
    checkStravaStatus();
  };

  // Verifica o status ao carregar o componente
  useEffect(() => {
    if (session?.user?.id) {
      checkStravaStatus();
    }
  }, [session?.user?.id]);

  // Se houver um erro, mostrar mensagem
  if (error) {
    return (
      <Card className="border-red-500/20">
        <CardContent className="p-4 flex flex-col items-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-2 mt-4" />
          <p className="text-sm text-center mb-3">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={retryConnection}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Se estiver carregando, mostrar indicador
  if (isLoading) {
    return (
      <Card className="border-orange-500/20">
        <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-2" />
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
              src="/strava-logo.png"
              alt="Strava"
              className="h-5"
            />
            Conectar com Strava
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-4">
            Conecte sua conta do Strava para importar suas atividades automaticamente e visualizar seus treinos no Magic Training.
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
                  src="/strava-logo-white.png"
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
              src="/strava-logo.png"
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
            ? 'Importe suas atividades do Strava para vincular ao seu plano de treino atual.'
            : 'Sua conexão com o Strava expirou. Reconecte sua conta para continuar importando atividades.'}
        </div>
        
        {/* Mostrar estatísticas da última importação */}
        {lastImportStats && (
          <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Link2 className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Última importação</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {lastImportStats.imported} atividades importadas
                  {lastImportStats.matched > 0 && <span className="font-medium text-primary"> ({lastImportStats.matched} vinculadas ao plano)</span>}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Separator />
        
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