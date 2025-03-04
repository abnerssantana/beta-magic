import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

interface HeroLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  metadata?: React.ReactNode;
  info?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function HeroLayout({
  title,
  description,
  actions,
  metadata,
  info,
  children,
}: HeroLayoutProps) {
  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-2 space-y-4">
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90 flex items-center gap-2">
              {title}
            </h1>
            
            {metadata && (
              <div className="flex flex-wrap gap-3 text-sm">
                {metadata}
              </div>
            )}
          </div>

          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Description - Desktop */}
        {description && (
          <div className="hidden md:block">
            <CardDescription className="text-base text-muted-foreground/90 leading-relaxed">
              {description}
            </CardDescription>
          </div>
        )}

        {/* Info Section */}
        {info && (
          <div className="space-y-4">
            {info}
          </div>
        )}

        {/* Main Content */}
        {children && (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HeroLayout;