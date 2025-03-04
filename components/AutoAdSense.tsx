import { useEffect } from 'react';
import { useRouter } from 'next/router';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const AutoAdSense = () => {
  const router = useRouter();

  useEffect(() => {
    try {
      // Função para notificar o AdSense sobre mudanças de página
      const updateAds = () => {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          window.adsbygoogle.push({
            google_ad_client: "ca-pub-3219622306351483",
            enable_page_level_ads: true
          });
        }
      };

      // Atualiza anúncios em mudanças de rota
      const handleRouteChange = () => {
        setTimeout(updateAds, 100); // Pequeno delay para garantir que o DOM foi atualizado
      };

      // Inscreve no evento de mudança de rota
      router.events.on('routeChangeComplete', handleRouteChange);

      // Limpa o listener quando o componente é desmontado
      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    } catch (error) {
      console.error('Erro ao inicializar AdSense:', error);
    }
  }, [router.events]);

  // Não renderiza nada visualmente
  return null;
};

export default AutoAdSense;