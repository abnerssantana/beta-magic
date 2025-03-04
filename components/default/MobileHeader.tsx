"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import { Menu, Calendar, User, Shield, Settings, LogOut, ChevronsUpDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileHeaderProps {
  onScrollToToday?: () => void;
}

const useLogoSrc = () => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return '/logodark.svg';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  return effectiveTheme === 'dark' ? '/logo.svg' : '/logodark.svg';
};

export function MobileHeader({ onScrollToToday }: MobileHeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const showTodayButton = router.pathname.includes('/plano/');
  const logoSrc = useLogoSrc();
  const { data: session, status } = useSession();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Obter iniciais para o avatar fallback
  const getInitials = () => {
    if (!session?.user?.name) return '?';
    return session.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Verificar se o usuário é administrador
  const isAdmin = session?.user?.email?.endsWith('@magictraining.run') || 
                 session?.user?.email === 'admin@example.com';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden rounded-lg hover:bg-muted/50"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 rounded-r-lg">
                <Sidebar onScrollToToday={onScrollToToday} />
              </SheetContent>
            </Sheet>

            {mounted && (
              <Link
                href="/"
                className="flex items-center gap-2 group transition-all duration-300"
              >
                <div className="relative w-6 h-6 overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-110 group-hover:shadow-sm">
                  <Image
                    src={logoSrc}
                    alt="Logo"
                    fill
                    sizes="24px"
                    priority
                    className="object-contain"
                  />
                </div>
                <span className="font-semibold text-base bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-primary/70 transition-all duration-300">
                  Magic Training
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showTodayButton && onScrollToToday && (
              <Button
                variant="default"
                size="sm"
                className="gap-2 rounded-lg shadow-sm h-9"
                onClick={onScrollToToday}
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Ir para hoje</span>
              </Button>
            )}

            {/* Login Button - visible when not logged in */}
            {status !== 'authenticated' && (
              <Button 
                variant="outline"
                size="sm"
                className="rounded-lg h-9 border-border/40 bg-muted/10 hover:bg-muted/30"
                onClick={() => router.push('/auth/signin')}
              >
                <User className="h-4 w-4 mr-2" />
                <span>Entrar</span>
              </Button>
            )}

            {/* Profile Menu - visible only when logged in */}
            {status === 'authenticated' && session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-lg h-9 pl-2.5 pr-3 gap-2 border-border/40 bg-muted/10 hover:bg-muted/30"
                  >
                    <Avatar className="h-6 w-6 rounded-md">
                      <AvatarImage 
                        src={session.user?.image || ""} 
                        alt={session.user?.name || "User"} 
                        className="object-cover rounded-md"
                      />
                      <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xs font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
                      {session.user?.name}
                    </span>
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 p-2 rounded-lg" 
                  align="end" 
                  forceMount
                >
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Conectado como
                    </p>
                    <p className="text-sm font-semibold truncate">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                  </div>
                  
                  <DropdownMenuSeparator className="my-1" />
                  
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                      <Link href="/admin/perfil" className="flex items-center p-2 gap-2">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Meu Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {isAdmin && (
                      <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                        <Link href="/admin" className="flex items-center p-2 gap-2">
                          <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Painel Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                      <Link href="/admin/configuracoes" className="flex items-center p-2 gap-2">
                        <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Configurações</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                      <Link href="/apoiar" className="flex items-center p-2 gap-2">
                        <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Upgrade Premium</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator className="my-1" />
                  
                  <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="rounded-md cursor-pointer text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 focus:text-red-600 dark:focus:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <div className="flex items-center p-2 gap-2">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair da conta</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}