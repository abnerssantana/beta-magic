// pages/auth/signin.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn, getCsrfToken, getProviders } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FcGoogle } from 'react-icons/fc';
import { AlertCircle, Loader2 } from 'lucide-react';

interface SignInProps {
  csrfToken: string;
  providers: Record<string, {
    id: string;
    name: string;
    type: string;
    signinUrl: string;
    callbackUrl: string;
  }> | null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const csrfToken = await getCsrfToken(context);
  const providers = await getProviders();
  
  return {
    props: {
      csrfToken: csrfToken || '',
      providers: providers || {},
    },
  };
};

const SignIn: React.FC<SignInProps> = ({ csrfToken, providers }) => {
  const router = useRouter();
  const [email, setEmail] = useState('admin@magictraining.run');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { callbackUrl, error: queryError } = router.query;
  
  // Exibir erro da query se houver
  React.useEffect(() => {
    if (queryError) {
      setError(
        typeof queryError === 'string' 
          ? queryError === 'CredentialsSignin' 
            ? 'Email ou senha incorretos' 
            : queryError
          : 'Ocorreu um erro ao fazer login'
      );
    }
  }, [queryError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: callbackUrl as string || '/admin',
      });
      
      if (result?.error) {
        setError(result.error === 'CredentialsSignin' ? 'Email ou senha incorretos' : result.error);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <Head>
        <title>Login | Magic Training</title>
        <meta name="description" content="Faça login no painel administrativo do Magic Training" />
      </Head>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logodark.svg"
              alt="Magic Training"
              width={48}
              height={48}
              className="dark:hidden"
            />
            <Image
              src="/logo.svg"
              alt="Magic Training"
              width={48}
              height={48}
              className="hidden dark:block"
            />
          </div>
          <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
          <CardDescription>
            Faça login no painel administrativo do Magic Training
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@magictraining.run"
                required
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <a
                  href="#"
                  className="text-xs text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Por favor, contate o administrador para redefinir sua senha.');
                  }}
                >
                  Esqueceu a senha?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>
          
          {/* Botões de provedores */}
          <div className="space-y-2">
            {providers?.google && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn('google', { callbackUrl: callbackUrl as string || '/admin' })}
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Entrar com Google
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
          <p className="w-full">
            Acesso apenas para administradores autorizados
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignIn;