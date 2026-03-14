import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateFlashcardsFromText(text: string, topic: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a flashcard generator. Extract or generate flashcards from the following text about the topic "${topic}".
      If the text contains explicitly formatted flashcards (e.g., "Front: ... Back: ..." or "Flashcard 1 Front ... Back ..."), parse them exactly as provided.
      Otherwise, generate a mix of 'qa' (Question/Answer) and 'fill-blank' cards based on the text content.
      Return a JSON array of objects, where each object has: 'type' ('qa' or 'fill-blank'), 'question' (string), and 'answer' (string).
      
      Text:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['qa', 'fill-blank'] },
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ["type", "question", "answer"],
          },
        },
      },
    });

    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating flashcards from text:", error);
    throw error;
  }
}
export async function generatePlanFromPdf(base64Data: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this lecture/syllabus document. Extract the main subjects or skills that need to be learned. Return a JSON array of objects, where each object has: 'name' (string), 'description' (string, brief), 'category' (string), 'difficulty' (number 1-10), and 'masteryGoal' (number 10-100).",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the skill or subject" },
              description: { type: Type.STRING, description: "Brief description of the skill" },
              category: { type: Type.STRING, description: "Category of the skill" },
              difficulty: { type: Type.INTEGER, description: "Difficulty level from 1 to 10" },
              masteryGoal: { type: Type.INTEGER, description: "Mastery goal level, typically 10 to 100" },
            },
            required: ["name", "description", "category", "difficulty", "masteryGoal"],
          },
        },
      },
    });

    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating plan from PDF:", error);
    throw error;
  }
}

export async function generateDeliberatePracticeProblem(topic: string, contextFlashcards: { question: string, answer: string }[]) {
  try {
    const flashcardsContext = contextFlashcards.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are an expert tutor. Create a deliberate practice problem for the topic "${topic}".
      Use the following flashcards as context to understand what the student has been learning:
      
      ${flashcardsContext}
      
      The problem should be challenging and require applying the concepts from the flashcards.
      It should NOT just be a simple recall question.
      
      Return a JSON object with:
      - 'question' (string): The problem statement.
      - 'hints' (array of strings): 3 progressive hints to help the student if they get stuck.
      - 'solution' (string): A detailed, step-by-step solution.
      - 'difficulty' (number): Estimated difficulty from 1 to 5.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            hints: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            solution: { type: Type.STRING },
            difficulty: { type: Type.INTEGER }
          },
          required: ["question", "hints", "solution", "difficulty"]
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating practice problem:", error);
    throw error;
  }
}
