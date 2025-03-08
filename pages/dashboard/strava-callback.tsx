import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

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

  useEffect(() => {
    const { code, error } = router.query;

    if (error) {
      setStatus(StravaConnectionStatus.ERROR);
      setErrorMessage(typeof error === 'string' ? error : 'Autorização rejeitada');
      return;
    }

    if (!code) return;

    const connectStrava = async () => {
      try {
        const response = await fetch('/api/strava/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to connect Strava');
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
      }
    };

    if (code) {
      connectStrava();
    }
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
                <Button onClick={() => router.push('/dashboard')}>
                  Voltar ao Dashboard
                </Button>
              </>
            )}

            {status === StravaConnectionStatus.ERROR && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Erro ao Conectar</h2>
                <p className="text-muted-foreground mb-4">
                  Não foi possível conectar sua conta do Strava: {errorMessage}
                </p>
                <Button onClick={() => router.push('/dashboard')} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StravaCallback;