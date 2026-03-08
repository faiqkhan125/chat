import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseAutomationScript(script: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following user request for a messaging automation task. 
      Extract the target user name, the message content, and the scheduled time.
      Current time is: ${new Date().toISOString()}.
      
      Request: "${script}"
      
      Return a JSON object with:
      - targetName: string
      - message: string
      - scheduledTime: ISO string
      - type: "scheduled_message" | "reminder" | "auto_reply"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetName: { type: Type.STRING },
            message: { type: Type.STRING },
            scheduledTime: { type: Type.STRING },
            type: { type: Type.STRING }
          },
          required: ["targetName", "message", "scheduledTime", "type"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      console.error("AI returned empty response");
      return null;
    }

    // Clean up potential markdown formatting if any
    const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Parsing Error:", error);
    return null;
  }
}
