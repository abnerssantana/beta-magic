import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'next-themes';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { TooltipProvider } from '@/components/ui/tooltip';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import type { ReactElement, ReactNode } from 'react';
import '../app/globals.css';

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function Magic({ Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout): ReactNode {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (window.gtag) {
        window.gtag('config', 'G-4H63PT4LXH', {
          page_path: url,
        });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Use o layout definido na página ou o layout padrão
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <ThemeProvider attribute="class">
      <TooltipProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <GoogleAnalytics gaId="G-4H63PT4LXH" />
        <SpeedInsights />
        <SessionProvider session={session}>
          {getLayout(<Component {...pageProps} />)}
        </SessionProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default Magic;