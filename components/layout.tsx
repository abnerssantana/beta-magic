import React from 'react';
import { Sidebar } from '@/components/default/Sidebar';
import { MobileHeader } from '@/components/default/MobileHeader';
import { useSession } from 'next-auth/react';
import { Toaster } from 'sonner';

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
      <div className="flex min-h-[calc(100vh-3.5rem)] md:min-h-screen md:h-screen mt-0">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-60 shrink-0 h-screen">
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