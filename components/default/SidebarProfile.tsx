import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import {
  Settings,
  User,
  LogOut,
  Shield,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SidebarProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Se o usuário não estiver autenticado, exibir botão de login
  if (status !== 'authenticated' || !session) {
    return (
      <div className="px-1 py-3">
        <Button 
          variant="outline"
          className="w-full justify-between text-sm h-10 rounded-lg border-dashed border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 text-muted-foreground hover:text-primary"
          onClick={() => router.push('/auth/signin')}
        >
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Entrar</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </div>
    );
  }

  // Verificar se o usuário é administrador
  const isAdmin = session.user?.email?.endsWith('@magictraining.run') || 
                session.user?.email === 'admin@example.com';

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

  return (
    <div className="py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline"
            className="w-full justify-between p-2 pl-3 rounded-lg border-border/40 bg-muted/10 hover:bg-muted/30 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm group-hover:ring-primary/10 transition-all duration-200">
                <AvatarImage 
                  src={session.user?.image || ""} 
                  alt={session.user?.name || "User"} 
                  className="object-cover"
                />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium line-clamp-1 text-foreground group-hover:text-primary transition-colors duration-200">
                  {session.user?.name}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {session.user?.email}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary/70 transition-colors duration-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-60 p-2 rounded-lg" 
          align="end" 
          alignOffset={-8}
          forceMount
        >
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-xs font-medium text-muted-foreground">
              Conectado como
            </p>
            <p className="text-sm font-semibold">{session.user?.name}</p>
            <p className="text-xs text-muted-foreground">{session.user?.email}</p>
          </div>
          
          <DropdownMenuSeparator className="my-1" />
          
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="rounded-md cursor-pointer">
              <Link href="/admin/perfil" className="flex items-center p-2 gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Meu Perfil</span>
              </Link>
            </DropdownMenuItem>
            
            {isAdmin && (
              <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                <Link href="/admin" className="flex items-center p-2 gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Painel Admin</span>
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    Admin
                  </span>
                </Link>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem asChild className="rounded-md cursor-pointer">
              <Link href="/admin/configuracoes" className="flex items-center p-2 gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="my-1" />
          
          <DropdownMenuItem 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="rounded-md cursor-pointer text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 focus:text-red-600 dark:focus:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <div className="flex items-center p-2 gap-2">
              <LogOut className="h-4 w-4" />
              <span>Sair da conta</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-70" />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}