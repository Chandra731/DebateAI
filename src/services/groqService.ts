import { logger } from '../utils/monitoring';
import { GroqCompletionResponse, ExerciseEvaluation, DebateCase, DebateEvaluationResult } from '../types';
import { Groq } from "groq-sdk";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export class GroqService {
  static async getCompletion(
    prompt: string,
    systemPrompt?: string
  ): Promise<string | ExerciseEvaluation | DebateCase> {
    logger.info('Attempting to get completion from Groq API.', { prompt, systemPrompt });
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
        logger.error(new Error(`Groq API request failed with status ${response.status}: ${errorBody}`), {
          component: 'GroqService',
          action: 'getCompletion',
          statusCode: response.status,
          errorBody,
        });
        throw new Error(
          `Groq API request failed with status ${response.status}: ${errorBody}`
        );
      }

      const data: GroqCompletionResponse = await response.json();
      console.log('Raw Groq API completion data:', data);
      logger.info('Successfully received Groq API completion.', { data });
      return data.choices[0].message.content;
    } catch (error) {
        logger.error(error as Error, {
          component: 'GroqService',
          action: 'getCompletion',
          originalError: error, // Log the original error object
        });
        throw new Error('Failed to get completion from Groq API.');
      }
  }

  static async streamCompletion(
    prompt: string,
    onChunk: (chunk: string) => void,
    maxTokens?: number, // Added maxTokens parameter
    systemPrompt?: string
  ): Promise<void> {
    logger.info('Attempting to stream completion from Groq API.', { prompt, systemPrompt, maxTokens });
    if (!GROQ_API_KEY) {
      logger.warn('Groq API key not available, using mock stream.');
      const mockResponse = this.getMockCompletion(prompt) as string;
      for (const word of mockResponse.split(' ')) {
        await new Promise(res => setTimeout(res, 50)); // Simulate streaming delay
        onChunk(word + ' ');
      }
      return;
    }

    const messages = [
      { role: 'system', content: systemPrompt || 'You are a helpful assistant for debate practice.' },
      { role: 'user', content: prompt },
    ];

    try {
      const stream = await groq.chat.completions.create({
        messages,
        model: 'llama3-8b-8192',
        temperature: 0.7,
        stream: true,
        max_tokens: maxTokens, // Pass maxTokens to the API
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    } catch (error) {
      logger.error(error as Error, {
        component: 'GroqService',
        action: 'streamCompletion',
        originalError: error,
      });
      throw new Error('Failed to stream completion from Groq API.');
    }
  }

  static async evaluateDebate(
    transcript: { speaker: string; text: string; timestamp: string }[],
    topic: string,
    userSide: 'pro' | 'con',
    aiSide: 'pro' | 'con'
  ): Promise<DebateEvaluationResult> {
    logger.info('Attempting to evaluate debate with Groq API.', { transcript, topic, userSide, aiSide });
    if (!GROQ_API_KEY) {
      logger.warn('Groq API key not available, using mock evaluation.');
      return this.getMockEvaluation();
    }

    const debateSummary = transcript.map(entry => `${entry.speaker} (${entry.timestamp}): ${entry.text}`).join('\n');

    const systemPrompt = `You are an impartial debate judge. Your task is to evaluate a debate between a user and an AI opponent. Provide scores for both participants (user and AI) based on Matter (content, arguments, evidence), Manner (delivery, clarity, tone), and Method (structure, strategy, time management). Each score should be out of 100. Also, provide overall feedback, including strengths and areas for improvement for the user, and identify the winner. The output MUST be a JSON object matching the DebateEvaluationResult interface.`;

    const prompt = `Debate Topic: "${topic}"
User's Side: ${userSide.toUpperCase()}
AI Opponent's Side: ${aiSide.toUpperCase()}

Debate Transcript:
${debateSummary}

Based on the transcript, provide a detailed evaluation in JSON format.`;

    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        model: 'llama3-8b-8192',
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("AI evaluation response was empty.");
      }
      const evaluation: DebateEvaluationResult = JSON.parse(content);
      logger.info('Successfully received debate evaluation.', { evaluation });
      return evaluation;
    } catch (error) {
      logger.error(error as Error, {
        component: 'GroqService',
        action: 'evaluateDebate',
        originalError: error,
      });
      throw new Error('Failed to evaluate debate with Groq API.');
    }
  }

  static getMockCompletion(
    prompt: string
  ): string | ExerciseEvaluation | DebateCase {
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
          { speaker: 'ai', text_snippet: 'However, your premise...', comment: 'AI effectively challenged the user\'s premise.', type: 'strength' },
          { speaker: 'user', text_snippet: 'I disagree because...', comment: 'User\'s rebuttal lacked specific evidence.', type: 'weakness' },
        ],
      },
      winner: 'ai',
      explanation: "The AI won due to more consistent argumentation and stronger evidence throughout the debate.",
    };
  }
}