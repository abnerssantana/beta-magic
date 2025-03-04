import React from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

const OAuthErrorPage: React.FC = () => {
  const router = useRouter();
  const { error } = router.query;

  const errorMessages = {
    'OAuthAccountNotLinked': 
      'Este email já está cadastrado. Por favor, faça login com suas credenciais ou entre em contato com o suporte.',
    'default': 'Ocorreu um erro durante o login. Por favor, tente novamente.'
  };

  const getMessage = () => {
    if (error && errorMessages[error as keyof typeof errorMessages]) {
      return errorMessages[error as keyof typeof errorMessages];
    }
    return errorMessages.default;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            Erro de Autenticação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {getMessage()}
          </p>
          
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/auth/signin')}
              className="w-full"
            >
              Voltar para Login
            </Button>
            
            <Button 
              onClick={() => router.push('/contato')}
              className="w-full"
            >
              Contatar Suporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthErrorPage;