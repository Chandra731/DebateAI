import { logger } from '../utils/monitoring';
import { GroqCompletionResponse, ExerciseEvaluation, DebateCase } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

if (!GROQ_API_KEY) {
  console.warn(
    'Groq API key not found. AI features will be disabled. Please add VITE_GROQ_API_KEY to your .env file.'
  );
}

export class GroqService {
  static async getCompletion(
    prompt: string,
    systemPrompt?: string
  ): Promise<string | ExerciseEvaluation | DebateCase> {
    if (!GROQ_API_KEY) {
      logger.warn('Groq API key not available, using mock response.');
      return this.getMockCompletion(prompt);
    }

    const messages = [
      { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
      { role: 'user', content: prompt },
    ];

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Groq API request failed with status ${response.status}: ${errorBody}`
        );
      }

      const data: GroqCompletionResponse = await response.json();
      const content = data.choices[0].message.content;

      try {
        // Try to parse the content as JSON, in case it's an exercise evaluation or a debate case
        return JSON.parse(content);
      } catch (error) {
        // If it's not JSON, return the content as a string
        return content;
      }
    } catch (error) {
      logger.error(error as Error, {
        component: 'GroqService',
        action: 'getCompletion',
      });
      throw new Error('Failed to get completion from Groq API.');
    }
  }

  static getMockCompletion(
    prompt: string
  ): string | ExerciseEvaluation | DebateCase {
    console.log('getMockCompletion received prompt:', prompt);
    if (prompt.includes('evaluate the following exercise submission')) {
      console.log('getMockCompletion returning exercise submission mock.');
      return {
        verdict: 'partial',
        explanation:
          'This is a mock explanation. The user provided a reasonable answer, but it could be more detailed.',
        improvement_advice: [
          'Consider adding more specific examples.',
          'Review the lesson on logical fallacies.',
        ],
        skill_score: 75,
      } as ExerciseEvaluation;
    } else if (prompt.includes('Generate a debate case')) {
      console.log('getMockCompletion returning debate case mock.');
      return {
        framing: 'This is a mock framing for the debate case.',
        contentions: [
          {
            title: 'Mock Contention 1',
            description: 'This is a mock description for contention 1.',
            evidence: 'Mock evidence for contention 1.',
          },
          {
            title: 'Mock Contention 2',
            description: 'This is a mock description for contention 2.',
            evidence: 'Mock evidence for contention 2.',
          },
          {
            title: 'Mock Contention 3',
            description: 'This is a mock description for contention 3.',
            evidence: 'Mock evidence for contention 3.',
          },
        ],
        rebuttals: ['Mock rebuttal 1.', 'Mock rebuttal 2.'],
        examples: ['Mock example 1.', 'Mock example 2.'],
        burdenAnalysis: 'Mock burden analysis.',
        fallacyChecks: ['Mock fallacy check 1.', 'Mock fallacy check 2.'],
      } as DebateCase;
    }
    console.log('getMockCompletion returning generic mock.');
    return 'This is a mock response from the Groq service.';
  }
}
