"use client"
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { Sun, Moon, Laptop } from 'lucide-react';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fechar menu quando clicar fora
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen && 
        buttonRef.current && 
        menuRef.current && 
        !buttonRef.current.contains(event.target as Node) && 
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  if (!mounted) return null;

  const currentIcon = theme === 'dark' ? 
    <Moon className="h-4 w-4" /> : 
    theme === 'light' ? 
      <Sun className="h-4 w-4" /> : 
      <Laptop className="h-4 w-4" />;

  return (
    <div className="relative">
      <Button 
        ref={buttonRef}
        variant="ghost" 
        className="w-full justify-start gap-3 px-3 text-sm h-10 text-muted-foreground hover:text-foreground rounded-lg mt-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentIcon}
        <span>Tema</span>
      </Button>

      {/* Menu de temas customizado */}
      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute z-50 w-40 bg-background border border-border rounded-lg shadow-lg"
          style={{
            top: 'auto',
            bottom: '100%',
            right: '0',
            marginBottom: '4px'
          }}
        >
          <div className="py-1">
            <button 
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-foreground"
              onClick={() => handleThemeChange('light')}
            >
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </button>
            <button 
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-foreground"
              onClick={() => handleThemeChange('dark')}
            >
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </button>
            <button 
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-foreground"
              onClick={() => handleThemeChange('system')}
            >
              <Laptop className="h-4 w-4" />
              <span>Sistema</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}