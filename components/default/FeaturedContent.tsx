import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, ArrowRight, Calculator, BookOpen, TrendingUp, Heart, Compass, HeartHandshake } from 'lucide-react';
import { FaDiscord, FaStrava, FaHeart } from 'react-icons/fa';

interface Video {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    url: string;
}

const getLevelBadgeStyles = (level: string) => {
    switch (level?.toLowerCase()) {
        case 'iniciante': return 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30';
        case 'intermediário': return 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30';
        case 'avançado': return 'text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30';
        case 'elite': return 'text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30';
        default: return '';    }
};

const featuredVideos: Video[] = [
    {
        id: 1,
        title: "Ritmo de Limiar: Guia Definitivo",
        description: "Ideal para corredores de todos os níveis que buscam sustentar velocidades mais altas por períodos mais longos.",
        thumbnail: "/img/videos/limiar.jpg",
        url: "https://youtu.be/7Iyy9Uq4YZk"
    },
    {
        id: 2,
        title: "Magic Training: Seu Plano de Corrida Personalizado",
        description: "Guia completo sobre como funciona o Magic Training e como escolher o plano ideal.",
        thumbnail: "/img/videos/magic.webp",
        url: "https://youtu.be/QUpv5zuDQK4"
    },
    {
        id: 3,
        title: "Treino Intervalado de Alta Intensidade",
        description: "Prepare-se para sair da zona de conforto e descobrir um novo patamar de performance com os treinos de alta intensidade!",
        thumbnail: "/img/videos/velocidade.webp",
        url: "https://youtu.be/Uuv2waG18e8"
    }
];

interface VideoCardProps {
    video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
    >
        <Card className="overflow-hidden h-full">
            <div className="relative">
                <div className="aspect-video relative">
                    <Image
                        src={video.thumbnail}
                        alt={video.title}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Youtube className="w-12 h-12 text-white" />
                </div>
            </div>
            <CardContent className="p-4">
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                    {video.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {video.description}
                </p>
            </CardContent>
        </Card>
    </motion.div>
);

// Component to display training resources
const TrainingResources = () => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Recursos para Treinamento
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/calculadora" className="block">
                    <Card className="group bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer h-full">
                        <CardContent className="p-6">
                            <Calculator className="h-10 w-10 mb-3 text-primary/70 group-hover:text-primary transition-colors" />
                            <h3 className="font-semibold text-lg">Calculadora de Ritmos</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Calcule seus ritmos ideais baseados no seu tempo alvo de prova
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/planejador" className="block">
                    <Card className="group bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer h-full">
                        <CardContent className="p-6">
                            <TrendingUp className="h-10 w-10 mb-3 text-primary/70 group-hover:text-primary transition-colors" />
                            <h3 className="font-semibold text-lg">Planejador de Prova</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Crie estratégias para cada trecho da sua corrida
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/legendas" className="block">
                    <Card className="group bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer h-full">
                        <CardContent className="p-6">
                            <Heart className="h-10 w-10 mb-3 text-primary/70 group-hover:text-primary transition-colors" />
                            <h3 className="font-semibold text-lg">Guia de Ritmos</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Entenda os diferentes ritmos de treino e como aplicá-los
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </CardContent>
    </Card>
);

const FeaturedContent: React.FC = () => {
    return (
        <div className="space-y-8 mb-20">
            {/* Find Plan Section */}
            <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Encontre seu Plano Ideal</h2>
                            <p className="text-primary-foreground/90">
                                Descubra o plano perfeito para seus objetivos, experiência e disponibilidade
                            </p>
                        </div>
                        <Button variant="secondary" size="lg" asChild>
                            <Link href="/encontrar-plano" className="gap-2">
                                <Compass className="h-5 w-5" />
                                Fazer Teste
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Training Resources */}
            <TrainingResources />

            {/* Featured Videos Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Youtube className="h-5 w-5 text-primary" />
                        Vídeos em Destaque
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {featuredVideos.map((video) => (
                                <Link key={video.id} href={video.url} target="_blank" rel="noopener noreferrer">
                                    <VideoCard video={video} />
                                </Link>
                            ))}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>

             {/* Comunidade */}
             <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Comunidade Magic Training</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                    <Link href="https://www.youtube.com/@abnerssantana" target="_blank" rel="noopener noreferrer" className="block">
                        <Card className="bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer">
                            <CardContent className="p-6 flex items-center gap-4">
                                <Youtube className="h-8 w-8 text-red-500" />
                                <div>
                                    <h4 className="font-medium">YouTube</h4>
                                    <p className="text-xs text-muted-foreground">@abnerssantana</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="https://discord.com/invite/pGcDZjhRry" target="_blank" rel="noopener noreferrer" className="block">
                        <Card className="bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors cursor-pointer">
                            <CardContent className="p-6 flex items-center gap-4">
                                <FaDiscord className="h-8 w-8 text-indigo-500" />
                                <div>
                                    <h4 className="font-medium">Discord</h4>
                                    <p className="text-xs text-muted-foreground">Magic Training</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="https://www.strava.com/clubs/magic-training-1176851" target="_blank" rel="noopener noreferrer" className="block">
                        <Card className="bg-orange-500/10 hover:bg-orange-500/20 transition-colors cursor-pointer">
                            <CardContent className="p-6 flex items-center gap-4">
                                <FaStrava className="h-8 w-8 text-orange-500" />
                                <div>
                                    <h4 className="font-medium">Strava</h4>
                                    <p className="text-xs text-muted-foreground">Magic Training</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </CardContent>
            </Card>

            {/* Apoiar o Projeto */}
            <Card className="bg-emerald-500/10 border-emerald-500/20">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <FaHeart className="text-red-500" />
                                Apoie o Projeto
                            </h2>
                            <p className="text-foreground/90">
                                Ajude a manter o Magic Training funcionando e cresça com a comunidade
                            </p>
                        </div>
                        <Button variant="default" size="lg" asChild>
                            <Link href="/apoiar" className="gap-2">
                                <HeartHandshake className="h-5 w-5" />
                                Saiba Como Apoiar
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export { getLevelBadgeStyles };
export default FeaturedContent;