// components/TrainerCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trainer } from '@/types/trainers';
import { cn } from '@/lib/utils';

interface TrainerCardProps {
  trainer: Trainer;
  planCount: number;
  className?: string;
}

export function TrainerCard({ trainer, planCount, className }: TrainerCardProps) {
  return (
    <Link href={`/treinadores/${trainer.id}`} className="block h-full">
      <Card 
        className={cn(
          "group relative h-full overflow-hidden hover:shadow-md transition-all duration-300",
          "bg-white dark:bg-muted/30 border-border/40 hover:border-border/90",
          className
        )}
      >
        <CardContent className="p-5 flex flex-col items-center h-full space-y-4">
          <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-md">
            <Image
              src={trainer.profileImage}
              alt={trainer.name}
              fill
              sizes="(max-width: 768px) 100vw, 192px"
              priority
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          <div className="text-center mt-2 space-y-2">
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {trainer.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {trainer.title}
            </p>
            <Badge variant="secondary" className="mt-2">
              {planCount} plano{planCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}