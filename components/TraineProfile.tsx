// components/TrainerProfile.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FaInstagram, 
  FaYoutube, 
  FaLinkedin, 
  FaTwitter, 
  FaGlobe 
} from 'react-icons/fa';
import { Card, CardContent } from "@/components/ui/card";
import { Trainer } from '@/types/trainers';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

interface TrainerProfileProps {
  trainer: Trainer;
}

export function TrainerProfile({ trainer }: TrainerProfileProps) {
  const introSection = trainer.biography[0];

  return (
    <Card className="bg-secondary/20">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Imagem do Treinador */}
          <div className="shrink-0">
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden shadow-md">
              <Image
                src={trainer.profileImage}
                alt={trainer.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 192px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Informações do Treinador */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {trainer.fullName || trainer.name}
              </h1>
              <p className="text-xl text-muted-foreground">
                {trainer.title}
              </p>
            </div>

            {/* Biografia Resumida */}
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{introSection.content}</ReactMarkdown>
            </div>

            {/* Redes Sociais */}
            <div className="flex flex-wrap gap-3 pt-3">
              {trainer.socialMedia.instagram && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  asChild
                  className="bg-linear-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:text-white border-none"
                >
                  <Link href={trainer.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                    <FaInstagram className="h-5 w-5" />
                    <span className="sr-only">Instagram</span>
                  </Link>
                </Button>
              )}

              {trainer.socialMedia.youtube && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  asChild
                  className="bg-red-600 text-white hover:bg-red-700 hover:text-white border-none"
                >
                  <Link href={trainer.socialMedia.youtube} target="_blank" rel="noopener noreferrer">
                    <FaYoutube className="h-5 w-5" />
                    <span className="sr-only">YouTube</span>
                  </Link>
                </Button>
              )}

              {trainer.socialMedia.linkedin && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  asChild
                  className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white border-none"
                >
                  <Link href={trainer.socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                    <FaLinkedin className="h-5 w-5" />
                    <span className="sr-only">LinkedIn</span>
                  </Link>
                </Button>
              )}

              {trainer.socialMedia.twitter && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  asChild
                  className="bg-sky-500 text-white hover:bg-sky-600 hover:text-white border-none"
                >
                  <Link href={trainer.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                    <FaTwitter className="h-5 w-5" />
                    <span className="sr-only">Twitter</span>
                  </Link>
                </Button>
              )}

              {trainer.socialMedia.website && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  asChild
                >
                  <Link href={trainer.socialMedia.website} target="_blank" rel="noopener noreferrer">
                    <FaGlobe className="h-5 w-5" />
                    <span className="sr-only">Website</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}