// lib/sidebar.ts
import { ReactNode } from 'react';
import {
  Home,
  BarChart2,
  Calculator,
  Activity,
  Heart,
  HelpCircle,
  Shield,
  Scroll,
  FileText,
  Route,
  Compass,
  Users,
  Notebook
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
  submenu?: {
    title: string;
    href: string;
  }[];
}

interface FooterItem {
  title: string;
  href: string;
  icon: ReactNode;
}

interface SiteConfig {
  name: string;
  nav: NavItem[];
  footerItems: FooterItem[];
}

export const siteConfig: SiteConfig = {
  name: "Magic Training",
  nav: [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Encontrar Plano",
      href: "/encontrar-plano",
      icon: <Compass className="h-5 w-5" />,
    },
    {
      title: "Distâncias",
      href: "#",
      icon: <Route className="h-5 w-5" />,
      submenu: [
        { title: "5 km", href: "/5km" },
        { title: "10 km", href: "/10km" },
        { title: "Meia Maratona", href: "/meiamaratona" },
        { title: "Maratona", href: "/maratona" },
        { title: "Ultramaratona", href: "/ultramaratona" },
      ],
    },
    {
      title: "Calculadora",
      href: "/calculadora",
      icon: <Calculator className="h-5 w-5" />,
    },
    {
      title: "Planejador",
      href: "/planejador",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      title: "Estatísticas",
      href: "/estatisticas",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      title: "Planos Personalizados",
      href: "/contato-trainingpeaks",
      icon: <Notebook className="h-5 w-5" />,
    },
    {
      title: "Comunidade",
      href: "#",
      icon: <Users className="h-5 w-5" />,
      submenu: [
        { title: "YouTube", href: "https://youtube.com/@abnerssantana" },
        { title: "Strava", href: "https://www.strava.com/clubs/vivendoacorrida" },
        { title: "Discord", href: "https://discord.gg/pGcDZjhRry" },
      ],
    },
    {
      title: "Apoiar",
      href: "/apoiar",
      icon: <Heart className="h-5 w-5" />,
    },
  ],
  footerItems: [
    {
      title: "Sobre",
      href: "/sobre",
      icon: <HelpCircle className="h-4 w-4" />,
    },
    {
      title: "Legendas",
      href: "/legendas",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: "Termos",
      href: "/termos",
      icon: <Scroll className="h-4 w-4" />,
    },
    {
      title: "Privacidade",
      href: "/privacidade",
      icon: <Shield className="h-4 w-4" />,
    },
  ]
};