// components/TrainerBiography.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BiographySection } from '@/types/trainers';
import ReactMarkdown from 'react-markdown';

interface TrainerBiographyProps {
  biography: BiographySection[];
}

export function TrainerBiography({ biography }: TrainerBiographyProps) {
  // Skip the first section as it's already displayed in the profile header
  const bioSections = biography.slice(1);
  
  if (bioSections.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biografia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {bioSections.map((section, index) => (
          <div key={index} className="space-y-2">
            {section.title && (
              <h3 className="text-lg font-semibold text-foreground">
                {section.title}
              </h3>
            )}
            <div className="text-muted-foreground prose dark:prose-invert max-w-none">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}