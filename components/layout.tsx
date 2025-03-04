import React from 'react';
import { Sidebar } from '@/components/default/Sidebar';
import { MobileHeader } from '@/components/default/MobileHeader';
import { useSession } from 'next-auth/react';
import { Toaster } from 'sonner'; // Importando o Toaster para notificações

interface LayoutProps {
  children: React.ReactNode;
  showMobileHeader?: boolean;
}

export function Layout({ children, showMobileHeader = true }: LayoutProps) {
  // Verificando a sessão do usuário (não bloqueia renderização)
  useSession();

  return (
    <div className="min-h-screen bg-background">
      {/* Toaster para exibir notificações */}
      <Toaster position="top-right" expand={false} richColors />
      
      {/* Mobile Header */}
      {showMobileHeader && (
        <div className="md:hidden">
          <MobileHeader />
        </div>
      )}

      {/* Main Layout Container - ajustado para considerar o header móvel */}
      <div className="flex md:h-screen h-[calc(100vh-3.5rem)] mt-0">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-52 shrink-0">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;