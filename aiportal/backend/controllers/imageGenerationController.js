import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash-preview-image-generation";
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("GEMINI_API_KEY environment variable is not set. Image generation will fail.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "DEFAULT_KEY_FOR_INITIALIZATION_ONLY"); // SDK might require a key at init
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
  temperature: 0.8,
  topK: 32,
  topP: 1,
  maxOutputTokens: 8192, // Max for some Gemini models, check if relevant for image generation specifically
  // For image generation, specific config for how images are returned might be needed here
  // e.g., responseMimeType if the API supports it for images, or number of images, size etc.
  // The Python example used: response_modalities=["TEXT", "IMAGE"]
  // The Node.js SDK equivalent needs to be confirmed.
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

async function generateImageFunc(req, res) { // Renamed to avoid conflict with export name if it were default
  if (!API_KEY) {
    // This check is now at the top, but good to have it per-request too if key could change
    return res.status(500).json({ error: "API Key for image generation service is not configured." });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required and must be a non-empty string." });
  }

  try {
    console.log(`Image generation request for: "${prompt}"`);

    // The prompt structure for image generation models is usually direct text.
    const parts = [{ text: prompt }];

    // IMPORTANT: The method to get an image response from gemini-2.0-flash-preview-image-generation
    // using the Node.js SDK needs to be verified.
    // The Python SDK uses `response_modalities=["TEXT", "IMAGE"]`.
    // We are assuming the Node.js SDK will populate `response.candidates[0].content.parts`
    // with an image part (e.g., `inlineData` or `fileData`).
    // This is a critical point for the user to verify with official documentation.

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });
    
    const response = result.response;

    if (!response || !response.candidates || !response.candidates.length || 
        !response.candidates[0].content || !response.candidates[0].content.parts) {
      console.error("Unexpected response structure from Gemini API:", JSON.stringify(response, null, 2));
      return res.status(500).json({ error: "Failed to generate image or unexpected API response structure." });
    }

    // Look for an image part in the response.
    // This part is speculative and needs to be confirmed with Node.js SDK documentation for image models.
    const imagePart = response.candidates[0].content.parts.find(part => part.inlineData && part.inlineData.data);

    if (imagePart && imagePart.inlineData) {
      console.log("Image generated successfully (inlineData found).");
      res.json({
        // Constructing a data URI for the image
        imageData: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      });
    } else {
      // Log detailed information if an image part isn't found as expected.
      let textResponseContent = "No text() method or content.";
      try {
        if (response.text) {
             textResponseContent = response.text();
        } else if (response.candidates[0].content.parts.find(p => p.text)) {
            textResponseContent = response.candidates[0].content.parts.find(p => p.text).text;
        }
      } catch (e) {
        textResponseContent = "Error extracting text content: " + e.message;
      }
      console.error("No image data (inlineData) found in Gemini API response parts.");
      console.error("Text content from response (if any):", textResponseContent);
      console.error("Full response candidates:", JSON.stringify(response.candidates, null, 2));
      
      return res.status(500).json({ 
        error: "No image data found in the generated response.",
        details: "The model may have returned text or an unexpected format. Check backend logs.",
        responseText: textResponseContent
      });
    }

  } catch (error) {
    console.error("Error in generateImage controller:", error);
    let errorMessage = "Failed to generate image due to an internal server error.";
    let errorDetails = error.message;

    if (error.toString().includes("FETCH_ERROR") || error.message.includes("Request failed")) {
        errorMessage = "Network error or issue reaching the Gemini API.";
    } else if (error.message.includes("API key not valid")) {
        errorMessage = "Invalid API Key for Gemini API.";
    } else if (error.message.includes("safety ratings")) {
        errorMessage = "Image generation request blocked due to safety settings.";
        errorDetails = "The prompt or generated image may have violated safety policies.";
    }
    
    // If the error object has more specific info from the API (e.g. status code or message)
    if (error.status && error.message) { // Some SDK errors might have these
        errorDetails = `API Error: ${error.message} (Status: ${error.status})`;
    }


    console.error(`Responding with error: ${errorMessage}`, errorDetails);
    res.status(500).json({ error: errorMessage, details: errorDetails });
  }
}

export { generateImageFunc as generateImage }; // Exporting with the original name 'generateImage' 