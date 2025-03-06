"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { Menu, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

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
          </div>
        </div>
      </div>
    </header>
  );
}