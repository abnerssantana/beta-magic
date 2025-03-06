"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  User,
  Shield,
  Settings,
  LogOut,
  ChevronsUpDown,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function NavUser() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fechar o dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Fechar o dropdown na mudança de rota
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
  
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
    <div className="px-3 py-4 mt-2 relative" ref={dropdownRef}>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="lg"
        className="w-full h-auto justify-between py-2 px-3 rounded-lg border-border/40 bg-muted/10 hover:bg-muted/30 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage 
            src={session.user?.image || ""} 
            alt={session.user?.name || "User"} 
            className="object-cover rounded-lg"
          />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight ml-3">
          <span className="truncate font-semibold text-foreground">{session.user?.name}</span>
          <span className="truncate text-xs text-muted-foreground">{session.user?.email}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
      </Button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full left-3 right-3 mt-1 bg-background border border-border rounded-lg shadow-lg">
          {/* Menu Header */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage 
                  src={session.user?.image || ""} 
                  alt={session.user?.name || "User"} 
                  className="object-cover rounded-lg"
                />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">{session.user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">{session.user?.email}</span>
              </div>
            </div>
          </div>

          {/* Dashboard Link */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 p-2.5 text-sm hover:bg-muted rounded-md mx-1 my-1"
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <span>Dashboard</span>
          </Link>
          
          <div className="border-t border-border my-1"></div>
          
          {/* Upgrade Section */}
          <Link 
            href="/apoiar" 
            className="flex items-center gap-2 p-2.5 text-sm hover:bg-muted rounded-md mx-1 my-1"
          >
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span>Upgrade Premium</span>
          </Link>
          
          <div className="border-t border-border my-1"></div>
          
          {/* User Options */}
          <Link 
            href="/admin/perfil" 
            className="flex items-center gap-2 p-2.5 text-sm hover:bg-muted rounded-md mx-1 my-1"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Meu Perfil</span>
          </Link>
          
          {isAdmin && (
            <Link 
              href="/admin" 
              className="flex items-center gap-2 p-2.5 text-sm hover:bg-muted rounded-md mx-1 my-1"
            >
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>Painel Admin</span>
            </Link>
          )}
          
          <Link 
            href="/admin/configuracoes" 
            className="flex items-center gap-2 p-2.5 text-sm hover:bg-muted rounded-md mx-1 my-1"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Configurações</span>
          </Link>
          
          <div className="border-t border-border my-1"></div>
          
          {/* Logout */}
          <button 
            className="flex w-full items-center gap-2 p-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-md mx-1 my-1"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="h-4 w-4" />
            <span>Sair da conta</span>
          </button>
        </div>
      )}
    </div>
  );
}