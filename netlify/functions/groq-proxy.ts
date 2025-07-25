import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Groq } from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

console.log("Netlify Function: GROQ_API_KEY is", GROQ_API_KEY ? "set" : "NOT set");

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  if (!GROQ_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Groq API Key not configured." }),
    };
  }

  const { type, payload } = JSON.parse(event.body || "{}");

  try {
    if (type === "streamCompletion") {
      const { prompt, maxTokens, systemPrompt } = payload;

      const messages: any[] = [
        { role: "system", content: systemPrompt || "You are a helpful assistant for debate practice." },
        { role: "user", content: prompt },
      ];

      const stream = await groq.chat.completions.create({
        messages,
        model: "llama3-8b-8192",
        temperature: 0.7,
        stream: true,
        max_tokens: maxTokens,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        fullResponse += chunk.choices[0]?.delta?.content || "";
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: fullResponse }),
      };

    } else if (type === "evaluateDebate") {
      const { transcript, topic, userSide, aiSide } = payload;

      const debateSummary = transcript.map((entry: any) => `${entry.speaker} (${entry.timestamp}): ${entry.text}`).join("\n");

      const systemPrompt = `You are an impartial debate judge. Your task is to evaluate a debate between a user and an AI opponent. Provide scores for both participants (user and AI) based on Matter (content, arguments, evidence), Manner (delivery, clarity, tone), and Method (structure, strategy, time management). Each score should be out of 100. Also, provide overall feedback, including strengths and areas for improvement for the user, and identify the winner. The output MUST be a JSON object matching the DebateEvaluationResult interface.`;

      const prompt = `Debate Topic: "${topic}"\nUser's Side: ${userSide.toUpperCase()}\nAI Opponent's Side: ${aiSide.toUpperCase()}\n\nDebate Transcript:\n${debateSummary}\n\nBased on the transcript, provide a detailed evaluation in JSON format.`;

      const response = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        model: "llama3-8b-8192",
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("AI evaluation response was empty.");
      }
      const evaluation = JSON.parse(content);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluation),
      };
    } else if (type === "getCompletion") { // Added support for getCompletion
      const { prompt, systemPrompt } = payload;

      const messages: any[] = [
        { role: "system", content: systemPrompt || "You are a helpful assistant." },
        { role: "user", content: prompt },
      ];

      const response = await groq.chat.completions.create({
        messages,
        model: "llama3-8b-8192",
        temperature: 0.7,
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: response.choices[0].message.content }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid request type" }),
      };
    }
  } catch (error: any) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || "Internal Server Error" }),
    };
  }
};

export { handler };