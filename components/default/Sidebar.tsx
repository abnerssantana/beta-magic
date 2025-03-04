"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { cn } from "@/lib/utils";
import {
  Calendar,
  Sun,
  Moon,
  Laptop,
  ChevronUp,
  ChevronDown,
  InfoIcon,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Importar a configuração do site
import { siteConfig, NavItem } from '@/lib/sidebar';

// Importar o componente NavUser
import { NavUser } from '@/components/default/NavUser';

interface SidebarProps {
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

export function Sidebar({ onScrollToToday }: SidebarProps) {
  const router = useRouter();
  const path = router.pathname;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const showTodayButton = path.includes('/plano/');
  const logoSrc = useLogoSrc();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavItemClick = (item: NavItem) => {
    if (item.submenu) {
      setOpenSubmenu(openSubmenu === item.title ? null : item.title);
    }
  };

  const isSubMenuActive = (item: NavItem) => {
    if (!item.submenu) return false;
    return item.submenu.some(submenuItem => path === submenuItem.href);
  };

  return (
    <aside className="h-[100dvh] border-r border-border/30 bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-muted/10 flex flex-col shadow-sm">
      {/* Logo Section */}
      <div className="h-16 flex items-center px-4 border-b border-border/20">
        <Link
          href="/"
          className="flex items-center gap-3 w-full group transition-all duration-300"
        >
          <div className="relative h-7 w-7 overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-105">
            <Image
              src={logoSrc}
              alt={`${siteConfig.name} Logo`}
              fill
              sizes="28px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-primary/70 transition-all duration-300">
            {siteConfig.name}
          </span>
        </Link>
      </div>

      {/* User Nav at Top */}
      <NavUser />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <nav className="space-y-1.5">
            {siteConfig.nav.map((item) => (
              <div key={item.title} className="group">
                {item.submenu ? (
                  <>
                    <Button
                      variant={isSubMenuActive(item) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-between rounded-lg text-sm font-medium transition-all duration-200",
                        isSubMenuActive(item) 
                          ? "bg-secondary shadow-sm" 
                          : "hover:bg-muted/50 group-hover:shadow-sm"
                      )}
                      onClick={() => handleNavItemClick(item)}
                    >
                      <span className="flex items-center gap-3">
                        <span className={cn(
                          "text-muted-foreground group-hover:text-primary transition-colors duration-200",
                          isSubMenuActive(item) && "text-primary"
                        )}>
                          {item.icon}
                        </span>
                        <span>{item.title}</span>
                      </span>
                      <span className="text-muted-foreground/70">
                        {openSubmenu === item.title ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    </Button>
                    {openSubmenu === item.title && (
                      <div className="pl-11 mt-1 space-y-1 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        {item.submenu.map((subItem) => (
                          <Link key={subItem.href} href={subItem.href}>
                            <Button
                              variant={path === subItem.href ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start text-xs rounded-lg py-1.5 h-auto",
                                path === subItem.href 
                                  ? "bg-secondary/70 font-medium" 
                                  : "hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {subItem.title}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.href}>
                    <Button
                      variant={path === item.href ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                        path === item.href 
                          ? "bg-secondary shadow-sm" 
                          : "hover:bg-muted/50 group-hover:shadow-sm"
                      )}
                    >
                      <span className={cn(
                        "text-muted-foreground group-hover:text-primary transition-colors duration-200",
                        path === item.href && "text-primary"
                      )}>
                        {item.icon}
                      </span>
                      <span>{item.title}</span>
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {showTodayButton && onScrollToToday && (
            <div className="mt-5 pt-2 border-t border-border/30">
              <Button
                variant="default"
                className="w-full justify-start gap-3 h-11 font-medium shadow-sm"
                onClick={onScrollToToday}
              >
                <Calendar className="h-5 w-5" />
                <span>Ir para hoje</span>
              </Button>
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div className="flex-none mb-1 px-2">
          {/* Theme Selector */}
          {mounted && (
            <div className="border-t border-border/20 bg-muted/10 rounded-lg mt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 px-3 text-sm h-10 text-muted-foreground hover:text-foreground rounded-lg mt-2"
                  >
                    {theme === 'dark' ? (
                      <Moon className="h-4 w-4" />
                    ) : theme === 'light' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Laptop className="h-4 w-4" />
                    )}
                    <span>Tema</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-lg">
                  <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                    <Laptop className="h-4 w-4" />
                    <span>Sistema</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Expandable Info Section */}
          <div className="bg-muted/10 border-t border-border/20 rounded-lg mb-3 mt-2">
            <Button
              variant="ghost"
              className="w-full justify-between px-3 text-sm h-10 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => setIsInfoOpen(!isInfoOpen)}
            >
              <span className="flex items-center gap-3">
                <InfoIcon className="h-4 w-4" />
                <span>Informações</span>
              </span>
              {isInfoOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isInfoOpen && (
              <div className="py-1 px-2 space-y-0.5 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                {siteConfig.footerItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-9 text-xs px-3 rounded-lg",
                        path === item.href 
                          ? "bg-muted text-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}