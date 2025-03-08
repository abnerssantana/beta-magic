import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

enum StravaConnectionStatus {
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

const StravaCallback: React.FC = () => {
  const router = useRouter();
  const [status, setStatus] = useState<StravaConnectionStatus>(StravaConnectionStatus.PROCESSING);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  const connectStrava = async (code: string) => {
    try {
      setStatus(StravaConnectionStatus.PROCESSING);
      const response = await fetch('/api/strava/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to connect Strava');
      }

      setStatus(StravaConnectionStatus.SUCCESS);
      
      // Redirecionar após um breve atraso
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Error connecting Strava:', error);
      setStatus(StravaConnectionStatus.ERROR);
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
      setIsRetrying(false);
    }
  };

  // Função para tentar novamente
  const retryConnection = () => {
    const { code } = router.query;
    if (code && typeof code === 'string') {
      setIsRetrying(true);
      connectStrava(code);
    } else {
      // Se não tiver código, voltar para o dashboard
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    const { code, error } = router.query;

    if (error) {
      setStatus(StravaConnectionStatus.ERROR);
      setErrorMessage(typeof error === 'string' ? error : 'Autorização rejeitada');
      return;
    }

    if (!code || typeof code !== 'string') return;

    connectStrava(code);
  }, [router.query]);

  return (
    <Layout>
      <Head>
        <title>Conectando ao Strava - Magic Training</title>
        <meta
          name="description"
          content="Conectando sua conta do Strava ao Magic Training"
        />
      </Head>

      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            {status === StravaConnectionStatus.PROCESSING && (
              <>
                <Loader2 className="h-16 w-16 text-[#FC4C02] animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Conectando ao Strava</h2>
                <p className="text-muted-foreground mb-4">
                  Estamos vinculando sua conta do Strava ao Magic Training. Aguarde um momento...
                </p>
              </>
            )}

            {status === StravaConnectionStatus.SUCCESS && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Conectado com Sucesso!</h2>
                <p className="text-muted-foreground mb-4">
                  Sua conta do Strava foi conectada ao Magic Training. Você será redirecionado em instantes.
                </p>
              </>
            )}

            {status === StravaConnectionStatus.ERROR && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Erro ao Conectar</h2>
                <p className="text-muted-foreground mb-4">
                  Não foi possível conectar sua conta do Strava: {errorMessage}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => router.push('/dashboard')} variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                  
                  <Button 
                    onClick={retryConnection} 
                    disabled={isRetrying}
                    className="gap-2"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Tentando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Tentar Novamente
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          
          {status === StravaConnectionStatus.SUCCESS && (
            <CardFooter className="justify-center">
              <Button onClick={() => router.push('/dashboard')}>
                Voltar ao Dashboard
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default StravaCallback;