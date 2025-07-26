/**
 * Netlify Function: groq-proxy
 * 
 * This function acts as a secure proxy for the Groq API. It handles three types of requests:
 * 1. 'getCompletion': For simple, non-streaming AI text responses.
 * 2. 'generateCase': For creating structured debate cases in a reliable JSON format.
 * 3. 'evaluateDebate': For analyzing a debate transcript and returning a structured JSON evaluation.
 * 
 * It ensures the Groq API key is never exposed to the client.
 */

import type { Handler } from "@netlify/functions";
import { Groq } from "groq-sdk";

// --- Utility function to create standardized responses ---
const respond = (statusCode: number, body: object) => {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
};

// --- Main handler ---
const handler: Handler = async (event) => {
  // 1. Check for POST method
  if (event.httpMethod !== "POST") {
    return respond(405, { message: "Method Not Allowed" });
  }

  // 2. Check for API Key
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    console.error("Groq API Key not configured.");
    return respond(500, { message: "Server configuration error: API key is missing." });
  }

  // 3. Initialize Groq client
  const groq = new Groq({ apiKey: GROQ_API_KEY });

  // 4. Parse request body
  const { type, payload } = JSON.parse(event.body || "{}");
  if (!type || !payload) {
    return respond(400, { message: "Invalid request body: 'type' and 'payload' are required." });
  }

  // 5. Handle request based on type
  try {
    switch (type) {
      
      // --- Case 1: Generate Debate Case (Reliable JSON) ---
      case "generateCase": {
        const { prompt, systemPrompt } = payload;

        const response = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          model: "llama3-70b-8192", // Use a powerful model for better JSON adherence
          temperature: 0.3,
          response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error("AI case generation response was empty.");
        }
        
        const caseData = JSON.parse(content);
        return respond(200, caseData);
      }

      // --- Case 2: Debate Evaluation (Reliable JSON) ---
      case "evaluateDebate": {
        const { transcript, topic, userSide, aiSide } = payload;
        const debateSummary = transcript.map((entry: any) => `${entry.speaker}: ${entry.text}`).join("\n");

        const systemPrompt = `
You are an expert debate judge. Your task is to evaluate a debate transcript and provide a detailed, impartial analysis.
The output MUST be a valid JSON object that strictly adheres to the following TypeScript interface definition.
Do NOT include any text outside of the JSON object. Do not wrap it in markdown.

interface DebateEvaluationResult {
  user_score: { matter: number; manner: number; method: number; overall: number; };
  ai_score: { matter: number; manner: number; method: number; overall: number; };
  feedback: {
    strengths: string;
    improvements: string;
    specific_examples: Array<{
      speaker: 'user' | 'ai';
      text_snippet: string;
      comment: string;
      type: 'strength' | 'weakness';
    }>;
  };
  winner: 'user' | 'ai' | 'tie';
  explanation: string;
}
        `.trim();

        const userPrompt = `
Please evaluate the following debate.
- Topic: "${topic}"
- User's Side: ${userSide.toUpperCase()}
- AI Opponent's Side: ${aiSide.toUpperCase()}

Debate Transcript:
---
${debateSummary}
---

Provide your evaluation as a raw JSON object.
        `.trim();

        const response = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "llama3-70b-8192",
          temperature: 0.2,
          response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error("AI evaluation response was empty.");
        }

        const evaluation = JSON.parse(content);
        return respond(200, evaluation);
      }
      
      // --- Case 3: Streaming / Simple Completion ---
      case "streamCompletion":
      case "getCompletion": {
        const { prompt, maxTokens, systemPrompt } = payload;
        
        const response = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt || "You are a helpful assistant for debate practice." },
            { role: "user", content: prompt },
          ],
          model: "llama3-8b-8192",
          temperature: 0.7,
          max_tokens: maxTokens || 500,
        });
        
        return respond(200, { response: response.choices[0].message.content });
      }

      // --- Default Case for Invalid Type ---
      default:
        return respond(400, { message: `Invalid request type: '${type}'` });
    }
  } catch (error: any) {
    console.error(`Error processing request type '${type}':`, error);
    return respond(500, { message: error.message || "An internal server error occurred." });
  }
};

export { handler };