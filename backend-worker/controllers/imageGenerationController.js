import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash-preview-image-generation";

const generationConfig = {
  temperature: 0.8,
  topK: 32,
  topP: 1,
  maxOutputTokens: 8192,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function generateImage(request, env) {
  const API_KEY = env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API Key for image generation service is not configured." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { prompt } = body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === "") {
      return new Response(JSON.stringify({ error: "Prompt is required and must be a non-empty string." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Image generation request for: "${prompt}"`);
    const parts = [{ text: prompt }];

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        ...generationConfig,
        responseModalities: ["TEXT", "IMAGE"]
      },
      safetySettings,
    });
    
    const response = result.response;
    const imagePart = response.candidates[0].content.parts.find(part => part.inlineData && part.inlineData.data);

    if (imagePart && imagePart.inlineData) {
      return new Response(JSON.stringify({
        imageData: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: "No image data found in the generated response.",
        details: "The model may have returned text or an unexpected format."
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Error in generateImage controller:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to generate image due to an internal server error.",
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 