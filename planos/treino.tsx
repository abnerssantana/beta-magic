export interface TrainingPlan {
  name: string;
  nivel: 'iniciante' | 'intermediário' | 'avançado' | 'elite';
  coach: string;
  info: string;
  path: string;
  duration: string;
  activities: string[];
  img?: string;
  isNew?: boolean;
  distances?: string[];
  volume?: string;
  trainingPeaksUrl?: string;
  videoUrl?: string;
}

const treinoPlans: TrainingPlan[] = [
  {
    name: 'Mobilidade para Corredores',
    nivel: 'intermediário',
    coach: 'Abner Santana',
    info: 'O plano é dividido em uma semana, com exercícios específicos para cada dia, focando em diferentes áreas do corpo. Inclui tanto dias dedicados para mobilidade, quanto dias de corrida do seu treinamento principal.',
    path: 'mobilidade-corredores',
    duration: '4x por semana',
    activities: ['mobilidade'],
    img: '/img/planos/hmjdelite.jpg',
    isNew: false,
  },
  {
    name: 'Mobilidade e estabilidade para Corredores',
    nivel: 'intermediário',
    coach: 'Abner Santana',
    info: 'Este plano de mobilidade é projetado para corredores, focando em melhorar a flexibilidade, estabilidade e amplitude de movimento. Combina exercícios de mobilidade geral e específica, além de ativação, para melhorar o desempenho na corrida e reduzir o risco de lesões.',
    path: 'mobilidade-estabilidade-corredores',
    duration: '4x por semana',
    activities: ['mobilidade'],
    isNew: true,
  },
  {
    name: 'Mobilidade e Fotalecimento para Corredores',
    nivel: 'avançado',
    coach: 'Abner Santana',
    info: 'Este plano de treinamento é projetado para corredores e inclui uma combinação abrangente de exercícios de mobilidade, ativação, força e pliométricos. Cada sessão visa melhorar a flexibilidade, estabilidade, força muscular e potência, contribuindo para um desempenho mais eficiente e seguro na corrida.',
    path: 'mobilidade-forca-corredores',
    duration: '2x por semana',
    activities: ['mobilidade', 'força'],
  },
  {
    name: 'Fortalecimento para Corredores',
    nivel: 'intermediário',
    coach: 'Abner Santana',
    info: 'Investir no fortalecimento muscular deve ser prioridade pra todo mundo que pratica corrida. Pernas mais fortes dão mais energia durante a atividade, enquanto os tendões e ligamentos ficam menos expostos a lesões.',
    path: 'fortalecimento-corredores',
    duration: '2x por semana',
    activities: ['força'],
  },
  {
    name: 'Fortalecimento Avançado para Corredores',
    nivel: 'avançado',
    coach: 'Abner Santana',
    info: 'Investir no fortalecimento muscular deve ser prioridade pra todo mundo que pratica corrida. Pernas mais fortes dão mais energia durante a atividade, enquanto os tendões e ligamentos ficam menos expostos a lesões.',
    path: 'fortalecimento-corredores-avancado',
    duration: '4x por semana',
    activities: ['força'],
  },
  {
    name: 'Educativos de Corrida',
    nivel: 'intermediário',
    coach: 'Josiah Middaughs',
    info: 'Os educativos de corrida ajudam os corredores a aprimorar sua postura, biomecânica e movimentos específicos relacionados à corrida, como a passada, a cadência e a posição do tronco. Isso pode levar a uma corrida mais eficiente e reduzir o risco de lesões.',
    path: 'educativos-corrida',
    duration: 'pré treino',
    activities: ['educativos'],
  }
];

export default treinoPlans;