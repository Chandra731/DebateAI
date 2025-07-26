import { logger } from '../utils/monitoring';
import { ExerciseEvaluation, DebateCase, DebateEvaluationResult } from '../types';

const NETLIFY_FUNCTION_URL = '/.netlify/functions/groq-proxy';

export class GroqService {
  static async getCompletion(
    prompt: string,
    systemPrompt?: string
  ): Promise<string | ExerciseEvaluation | DebateCase> {
    logger.info('Attempting to get completion via Netlify function.', { prompt, systemPrompt });

    try {
      const response = await fetch(NETLIFY_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'getCompletion',
          payload: { prompt, systemPrompt },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(new Error(`Netlify function request failed with status ${response.status}: ${errorBody}`), {
          component: 'GroqService',
          action: 'getCompletion',
          statusCode: response.status,
          errorBody,
        });
        throw new Error(
          `Netlify function request failed with status ${response.status}: ${errorBody}`
        );
      }

      const data = await response.json();
      logger.info('Successfully received completion from Netlify function.', { data });
      return data.response;
    } catch (error) {
      logger.error(error as Error, {
        component: 'GroqService',
        action: 'getCompletion',
        originalError: error,
      });
      throw new Error('Failed to get completion via Netlify function.');
    }
  }

  static async streamCompletion(
    prompt: string,
    onChunk: (chunk: string) => void,
    maxTokens?: number,
    systemPrompt?: string
  ): Promise<void> {
    logger.info('Attempting to stream completion via Netlify function.', { prompt, systemPrompt, maxTokens });

    try {
      const response = await fetch(NETLIFY_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'streamCompletion',
          payload: { prompt, maxTokens, systemPrompt },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(new Error(`Netlify function stream request failed with status ${response.status}: ${errorBody}`), {
          component: 'GroqService',
          action: 'streamCompletion',
          statusCode: response.status,
          errorBody,
        });
        throw new Error(
          `Netlify function stream request failed with status ${response.status}: ${errorBody}`
        );
      }

      // Since Netlify Functions don't stream directly to the client, we get the full response
      const data = await response.json();
      if (data.response) {
        onChunk(data.response); // Pass the entire accumulated response as one chunk
      }
      logger.info('Successfully received streamed completion from Netlify function.', { data });
    } catch (error) {
      logger.error(error as Error, {
        component: 'GroqService',
        action: 'streamCompletion',
        originalError: error,
      });
      throw new Error('Failed to stream completion via Netlify function.');
    }
  }

  static async generateCase(
    prompt: string,
    systemPrompt?: string
  ): Promise<DebateCase> {
    logger.info('Attempting to generate case via Netlify function.', { prompt, systemPrompt });

    try {
      const response = await fetch(NETLIFY_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'generateCase',
          payload: { prompt, systemPrompt },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(new Error(`Netlify function request failed with status ${response.status}: ${errorBody}`), {
          component: 'GroqService',
          action: 'generateCase',
          statusCode: response.status,
          errorBody,
        });
        throw new Error(
          `Netlify function request failed with status ${response.status}: ${errorBody}`
        );
      }

      const data: DebateCase = await response.json();
      logger.info('Successfully received case from Netlify function.', { data });
      return data;
    } catch (error) {
      logger.error(error as Error, {
        component: 'GroqService',
        action: 'generateCase',
        originalError: error,
      });
      throw new Error('Failed to generate case via Netlify function.');
    }
  }

  static async evaluateDebate(
    transcript: { speaker: string; text: string; timestamp: string }[],
    topic: string,
    userSide: 'pro' | 'con',
    aiSide: 'pro' | 'con'
  ): Promise<DebateEvaluationResult> {
    logger.info('Attempting to evaluate debate via Netlify function.', { transcript, topic, userSide, aiSide });

    try {
      const response = await fetch(NETLIFY_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'evaluateDebate',
          payload: { transcript, topic, userSide, aiSide },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(new Error(`Netlify function evaluation request failed with status ${response.status}: ${errorBody}`), {
          component: 'GroqService',
          action: 'evaluateDebate',
          statusCode: response.status,
          errorBody,
        });
        throw new Error(
          `Netlify function evaluation request failed with status ${response.status}: ${errorBody}`
        );
      }

      const evaluation: DebateEvaluationResult = await response.json();
      logger.info('Successfully received debate evaluation from Netlify function.', { evaluation });
      return evaluation;
    } catch (error) {
      logger.error(error as Error, {
        component: 'GroqService',
        action: 'evaluateDebate',
        originalError: error,
      });
      throw new Error('Failed to evaluate debate via Netlify function.');
    }
  }

  // Mock implementations (can be removed once Netlify functions are fully reliable)
  static getMockCompletion(
    prompt: string
  ): string | ExerciseEvaluation | DebateCase {
    // ... (your existing mock completion logic)
    if (prompt.includes('evaluate the following exercise submission')) {
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
        ],
        rebuttals: ['Mock rebuttal 1.', 'Mock rebuttal 2.'],
        examples: ['Mock example 1.', 'Mock example 2.'],
        burdenAnalysis: 'Mock burden analysis.',
        fallacyChecks: ['Mock fallacy check 1.', 'Mock fallacy check 2.'],
      } as DebateCase;
    }
    return 'This is a mock response from the Groq service for your debate prompt.';
  }

  static getMockEvaluation(): DebateEvaluationResult {
    return {
      user_score: { matter: 70, manner: 80, method: 75, overall: 75 },
      ai_score: { matter: 85, manner: 75, method: 80, overall: 80 },
      feedback: {
        strengths: "User demonstrated good clarity and a strong opening statement.",
        improvements: "User could provide more specific evidence and directly address AI's rebuttals.",
        specific_examples: [
          { speaker: 'user', text_snippet: 'My first point is...', comment: 'Good clear opening.', type: 'strength' },
          { speaker: 'ai', text_snippet: 'However, your premise...', comment: 'AI effectively challenged the users premise.', type: 'strength' },
          { speaker: 'user', text_snippet: 'I disagree because...', comment: 'Users rebuttal lacked specific evidence.', type: 'weakness' },
        ],
      },
      winner: 'ai',
      explanation: "The AI won due to more consistent argumentation and stronger evidence throughout the debate.",
    };
  }
}
