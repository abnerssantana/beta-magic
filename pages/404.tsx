import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Home,
  Calculator,
  Activity,
  Users
} from 'lucide-react';

const navLinks = [
  {
    href: '/',
    icon: <Home className="h-5 w-5" />,
    label: 'Dashboard',
    description: 'Voltar para página inicial'
  },
  {
    href: '/calculadora',
    icon: <Calculator className="h-5 w-5" />,
    label: 'Calculadora',
    description: 'Calcule seus ritmos de treino'
  },
  {
    href: '/progresso',
    icon: <Activity className="h-5 w-5" />,
    label: 'Progresso',
    description: 'Acompanhe sua evolução'
  },
  {
    href: '/comunidade',
    icon: <Users className="h-5 w-5" />,
    label: 'Comunidade',
    description: 'Conecte-se com outros corredores'
  }
];

const Custom404 = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Head>
        <title>404 - Página Não Encontrada | Magic Training</title>
        <meta 
          name="description" 
          content="Oops! A página que você está procurando não foi encontrada. Explore outras áreas do Magic Training." 
        />
      </Head>

      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center space-y-8">
          {/* Error Message */}
          <div className="space-y-4">
            <h1 className="text-8xl md:text-9xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/60">
              404
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-4">
              Oops! Você saiu da pista!
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Parece que essa página deu uma escapada mais rápida que você em dia de treino.
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className={cn(
                  "transition-all duration-200 hover:shadow-md border-border/40",
                  "hover:border-primary/50 group"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {link.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {link.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {link.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <Button asChild variant="outline" size="lg" className="ring-1 ring-border">
              <Link href="/" className="gap-2">
                <Home className="h-4 w-4" />
                Voltar para Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Custom404;