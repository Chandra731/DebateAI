export interface AiOpponentProfile {
  level: string;
  specialization: string;
  winRate: string;
  argumentStrength: string;
  responseSpeed: string;
}

export const AI_OPPONENT_PROFILES: Record<string, AiOpponentProfile> = {
  BEGINNER: {
    level: 'Level 1',
    specialization: 'Basic Argumentation',
    winRate: '30%',
    argumentStrength: 'Novice',
    responseSpeed: 'Moderate',
  },
  INTERMEDIATE: {
    level: 'Level 3',
    specialization: 'Structured Debates',
    winRate: '60%',
    argumentStrength: 'Competent',
    responseSpeed: 'Fast',
  },
  ADVANCED: {
    level: 'Level 5',
    specialization: 'Educational Policy Debates',
    winRate: '78%',
    argumentStrength: 'Expert',
    responseSpeed: 'Fast',
  },
};

export const getAiOpponentProfile = (userLevel: number): AiOpponentProfile => {
  if (userLevel < 2) {
    return AI_OPPONENT_PROFILES.BEGINNER;
  } else if (userLevel < 4) {
    return AI_OPPONENT_PROFILES.INTERMEDIATE;
  } else {
    return AI_OPPONENT_PROFILES.ADVANCED;
  }
};