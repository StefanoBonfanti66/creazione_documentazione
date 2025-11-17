
import { GoogleGenAI, Type } from "@google/genai";

const PROMPT_TEMPLATE = `
You are an expert technical writer specializing in creating clear, concise, and professional business process documentation. 
Your task is to transform a user's raw, unstructured description of their desktop operations, along with any provided screenshots for visual context, into a well-structured, step-by-step guide.

Follow these rules:
1.  **Language:** Generate the final documentation in {language}.
2.  **Analyze the Input:** Carefully read the user's description and review the screenshots to understand the sequence of actions and the goal of the process.
3.  **Create a Clear Title:** Generate a concise and descriptive title for the process, in the requested language.
4.  **Structure the Steps:** Organize the actions into a numbered list in Markdown. Each step should represent a single, clear action.
5.  **Use Action-Oriented Language:** Begin each step with a strong verb (e.g., "Navigate," "Click," "Enter," "Select").
6.  **Incorporate Screenshot Context:** Use the visual information from the screenshots to add specific details, like application names, button labels, or field values.
7.  **Format for Readability:** Use Markdown for formatting. Use bold text for UI elements like button names or menu items (e.g., "**File > Save As...**").
8.  **Maintain a Professional Tone:** The final document should be easy for anyone in a business setting to follow.
9.  **Output JSON:** Respond ONLY with a valid JSON object following the specified schema.

Here is the user's raw description:
---
{description}
---

Now, generate the professional documentation based on this input and the attached images.
`;

export const generateDocumentation = async (description: string, images: string[], language: 'it' | 'en'): Promise<{title: string, documentation: string}> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const languageName = language === 'it' ? 'Italian' : 'English';
  const prompt = PROMPT_TEMPLATE.replace('{description}', description).replace('{language}', languageName);

  const imageParts = images.map(imgDataURL => {
    const [header, base64Data] = imgDataURL.split(',');
    const mimeType = header.match(/data:([^;]+);/)?.[1] || 'image/png';
    return {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }, ...imageParts] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { 
              type: Type.STRING,
              description: 'A concise and descriptive title for the process'
            },
            documentation: { 
              type: Type.STRING,
              description: 'The step-by-step guide in Markdown format.'
            }
          },
          required: ['title', 'documentation']
        }
      }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the AI model.");
  }
};
