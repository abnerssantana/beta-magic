import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import {
  Clock,
  Ruler,
  Calendar,
  User2,
  TrendingUp,
  BarChart2,
  CalendarDays,
  Share2,
  ArrowRightLeft,
  Repeat2,
  Youtube,
  X,
  Info
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import VO2maxIndicator from '@/components/plan/VO2maxIndicator';

interface Plan {
  name: string;
  coach: string;
  nivel: string;
  volume?: string;
  duration: string;
  info?: string;
  videoUrl?: string;
  trainingPeaksUrl?: string;
}

interface PlanHeaderProps {
  plan: Plan;
  startDate: string;
  endDate: string;
  selectedDistance: string;
  selectedTime: string;
  handleDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEndDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDistanceChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  handleTimeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  params: number | null;
  percentage: number;
}

export function PlanHeader({
  plan,
  startDate,
  selectedDistance,
  selectedTime,
  handleDateChange,
  handleDistanceChange,
  handleTimeChange,
  params,
  percentage,
  endDate,
  handleEndDateChange,
}: PlanHeaderProps) {
  const [dateMode, setDateMode] = useState<'start' | 'target'>('start');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const trainerSlug = plan.coach.toLowerCase().replace(/\s+/g, '-');

  const handleShare = async () => {
    try {
      const shareData = {
        title: `Plano de Treino: ${plan.name}`,
        text: `Confira este plano de treino por ${plan.coach} no Magic Training!`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setNotificationMessage('Link copiado para a área de transferência!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleVideoClick = () => {
    if (plan.videoUrl) {
      window.open(plan.videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // TrainingPeaks link configuration
  const TrainingPeaksLink = () => {
    if (plan.trainingPeaksUrl) {
      // Purchase link - opens in new tab
      return (
        <Link
          href={plan.trainingPeaksUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center justify-center",
            "bg-green-600 hover:bg-green-700",
            "transition-all duration-300",
            "rounded-md text-sm font-bold h-10 px-4 py-2",
            "text-white"
          )}
        >
          <Repeat2 className="mr-2 h-4 w-4" />
          Comprar e Sincronizar
        </Link>
      );
    }

    // Request link - internal navigation
    return (
      <Link
        href="/contato-trainingpeaks"
        className={cn(
          "inline-flex items-center justify-center",
          "bg-blue-500 hover:bg-blue-600",
          "text-white",
          "ring-1 ring-emerald-600/20",
          "transition-colors duration-200",
          "rounded-md text-sm font-medium h-10 px-4 py-2"
        )}
      >
        <Repeat2 className="mr-2 h-4 w-4" />
        Solicitar no TrainingPeaks
      </Link>
    );
  };

  return (
    <Card className="border-none shadow-none pb-0">
      <CardContent className="mt-3 p-2 space-y-3">
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90">
              {plan.name}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={`/treinadores/${trainerSlug}`}
                className="flex items-center text-primary/80 hover:text-primary transition-colors"
              >
                <User2 className="mr-1.5 h-4 w-4" />
                {plan.coach}
              </Link>
              <div className="flex items-center text-muted-foreground/90">
                <TrendingUp className="mr-1.5 h-4 w-4" />
                {plan.nivel}
              </div>
              <div className="flex items-center text-muted-foreground/90">
                <CalendarDays className="mr-1.5 h-4 w-4" />
                {plan.duration}
              </div>
              <div className="flex items-center text-muted-foreground/90">
                <BarChart2 className="mr-1.5 h-4 w-4" />
                {plan.volume} km/sem
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {plan.videoUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVideoClick}
                className="text-red-500 hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-950/50 ring-1 ring-red-200 dark:ring-red-800"
              >
                <Youtube className="h-5 w-5" />
                <span className="sr-only">Ver vídeo do plano</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground ring-1 ring-border"
            >
              <Share2 className="h-5 w-5" />
              <span className="sr-only">Compartilhar plano</span>
            </Button>
          </div>
        </div>

        {/* Plan Description - Desktop */}
        <div className="hidden md:block">
          <CardDescription className="text-base text-muted-foreground/90 leading-relaxed">
            {plan.info}
          </CardDescription>
        </div>

        {/* Plan Description - Mobile Dialog */}
        <div className="md:hidden">
          <Dialog>
            <DialogTrigger>
              <Button
                variant="outline"
                className="w-full justify-between text-left font-normal ring-1 ring-border"
              >
                <span className="line-clamp-1 flex-1 text-muted-foreground">
                  {plan.info}
                </span>
                <Info className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold mb-2">
                  Sobre o plano
                </DialogTitle>
                <DialogDescription className="text-base text-foreground">
                  {plan.info}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between h-6">
              <label className="text-sm font-medium">
                {dateMode === 'start' ? 'Data inicial:' : 'Data da prova:'}
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateMode(prev => prev === 'start' ? 'target' : 'start')}
                className="h-6 px-2 text-xs hover:bg-secondary/80"
              >
                <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                <span className="text-xs">
                  {dateMode === 'start' ? 'Data da prova' : 'Data inicial'}
                </span>
              </Button>
            </div>
            <div className="relative">
              <Input
                type="date"
                value={dateMode === 'start' ? startDate : endDate}
                onChange={dateMode === 'start' ? handleDateChange : handleEndDateChange}
                className="pl-10 ring-1 ring-border"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Distance Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium block h-6 leading-6">Distância:</label>
            <div className="relative">
              <Select
                value={selectedDistance}
                onValueChange={(value: string) => handleDistanceChange({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger className="pl-10 ring-1 ring-border">
                  <SelectValue placeholder="Selecione a distância" />
                </SelectTrigger>
                <SelectContent>
                  {['1500m', '1600m', '3km', '3200m', '5km', '10km', '15km', '21km', '42km'].map((distance) => (
                    <SelectItem key={distance} value={distance}>{distance}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Time Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium block h-6 leading-6">Tempo:</label>
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                pattern="\d{2}:\d{2}:\d{2}"
                placeholder="hh:mm:ss"
                value={selectedTime}
                onChange={handleTimeChange}
                className="pl-10 ring-1 ring-border"
              />
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* VO2max Indicator */}
          <div className="space-y-2">
            {params !== null && <VO2maxIndicator params={params} percentage={percentage} />}
          </div>
        </div>
        <Separator />
        {/* TrainingPeaks Section */}
        <Card className="bg-secondary/30 ring-1 ring-border">
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground/90">
                  {plan.trainingPeaksUrl ?
                    'Compre este plano no TrainingPeaks' :
                    'Quer este plano no TrainingPeaks?'
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.trainingPeaksUrl ?
                    'Após a compra, seu plano será sincronizado automaticamente com seu relógio GPS e apps favoritos.' :
                    'Entre em contato para solicitar este plano no TrainingPeaks para sincronização automática.'
                  }
                </p>
              </div>

              <TrainingPeaksLink />
            </div>
          </CardContent>
        </Card>

        {/* Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-4 right-4 z-50"
            >
              <Alert variant="default" className="bg-emerald-500 text-white border-none ring-1 ring-emerald-600/20">
                <AlertDescription className="flex items-center">
                  {notificationMessage}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 h-4 w-4 p-0 hover:bg-white/10 text-white"
                    onClick={() => setShowNotification(false)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Fechar notificação</span>
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default PlanHeader;