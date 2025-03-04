// src/types/trainers.ts

export interface SocialMedia {
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  }
  
  export interface BiographySection {
    title?: string;
    content: string;
  }
  
  export interface Trainer {
    id: string;
    name: string;
    fullName?: string;
    title: string;
    profileImage: string;
    biography: BiographySection[];
    socialMedia: SocialMedia;
  }
  
  export interface TrainersData {
    trainers: Trainer[];
  }