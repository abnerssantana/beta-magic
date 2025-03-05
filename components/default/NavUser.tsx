// Versão alternativa simplificada do NavUser
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronsUpDown, User, Shield, Settings, LogOut } from 'lucide-react';

export function NavUser() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // Se o usuário não estiver autenticado, exibir botão de login
  if (status !== 'authenticated' || !session) {
    return (
      <div className="px-3 py-4 mt-2">
        <Button 
          variant="outline"
          className="w-full justify-between text-sm h-10 rounded-lg border-dashed border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 text-muted-foreground hover:text-primary"
          onClick={() => router.push('/auth/signin')}
        >
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Entrar</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </div>
    );
  }

  // Obter iniciais para o avatar fallback
  const getInitials = () => {
    if (!session.user?.name) return '?';
    return session.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Verificar se o usuário é administrador
  const isAdmin = session.user?.email?.endsWith('@magictraining.run') || 
                session.user?.email === 'admin@example.com';

  return (
    <div className="px-3 py-4 mt-2 relative">
      <Button
        variant="outline"
        size="lg"
        className="w-full h-auto justify-between py-2 px-3 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage 
            src={session.user?.image || ""} 
            alt={session.user?.name || "User"} 
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm ml-3">
          <span className="truncate font-semibold">{session.user?.name}</span>
          <span className="truncate text-xs text-muted-foreground">{session.user?.email}</span>
        </div>
        <ChevronsUpDown className="ml-auto h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-3 right-3 mt-2 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="p-2 flex flex-col space-y-1">
            <Link href="/admin/perfil" className="flex items-center p-2 rounded-md hover:bg-muted">
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </Link>
            
            {isAdmin && (
              <Link href="/admin" className="flex items-center p-2 rounded-md hover:bg-muted">
                <Shield className="mr-2 h-4 w-4" />
                <span>Painel Admin</span>
              </Link>
            )}
            
            <Link href="/admin/configuracoes" className="flex items-center p-2 rounded-md hover:bg-muted">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </Link>
            
            <hr className="my-1 border-border/50" />
            
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center p-2 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}