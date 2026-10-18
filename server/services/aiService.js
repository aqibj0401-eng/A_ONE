const { GoogleGenAI } = require('@google/genai');

// Check if API key is provided, if not, we rely purely on the fallback
const ai = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) 
  : null;

const MODEL_CANDIDATES = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];

/**
 * Helper to call Gemini with model fallback
 */
async function callGemini(prompt) {
  if (!ai) {
    throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in server/.env.");
  }

  let lastError = null;
  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      const text = (typeof response.text === 'function' ? response.text() : response.text);
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err) {
      console.warn(`[AI Service] Model '${model}' failed:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error("An error occurred while communicating with the Gemini AI service.");
}

/**
 * Fallback keyword-based sentiment analysis
 * Used if AI API is down, missing key, or during massive demo seed generation.
 */
const fallbackSentiment = (text) => {
  const lowerText = text.toLowerCase();
  
  const positiveWords = ['good', 'excellent', 'amazing', 'great', 'love', 'perfect', 'nice', 'awesome'];
  const negativeWords = ['bad', 'poor', 'slow', 'expensive', 'terrible', 'worst', 'awful', 'hate', 'broken'];
  
  let posCount = 0;
  let negCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) posCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negCount++;
  });

  if (posCount > negCount) return { sentiment: 'Positive', sentimentScore: 0.8, confidence: 0.9 };
  if (negCount > posCount) return { sentiment: 'Negative', sentimentScore: 0.2, confidence: 0.9 };
  return { sentiment: 'Neutral', sentimentScore: 0.5, confidence: 0.5 };
};

/**
 * Analyzes customer feedback to determine sentiment
 * Returns: { sentiment: String, sentimentScore: Number, confidence: Number }
 */
const analyzeSentiment = async (feedbackText) => {
  if (!ai) {
    console.warn("Gemini API key missing. Using keyword fallback for sentiment.");
    return fallbackSentiment(feedbackText);
  }

  try {
    const prompt = `Analyze the sentiment of the following customer feedback. 
    Respond ONLY with a JSON object in this exact format, with no markdown formatting or extra text: 
    {"sentiment": "Positive" | "Negative" | "Neutral", "sentimentScore": number between 0 and 1, "confidence": number between 0 and 1}. 
    
    Feedback: "${feedbackText}"`;

    const resultText = await callGemini(prompt);
    // Safely strip any potential markdown blocks the model might incorrectly return
    const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini API Error during sentiment analysis, falling back to keywords:", error.message);
    return fallbackSentiment(feedbackText);
  }
};

/**
 * Generates an executive summary of multiple feedback records
 */
const generateSummary = async (feedbacks) => {
  if (!feedbacks || feedbacks.length === 0) {
    return "No feedback records found to analyze.";
  }

  const sample = feedbacks.slice(0, 30);
  const comments = sample.map(f => `- [${f.sentiment || 'Feedback'}] ${f.comment}`).join('\n');
  const prompt = `You are an executive business analyst. Read the following recent customer feedback comments and write a concise, high-impact 3-4 sentence executive summary highlighting key customer sentiment themes, what customers love, and the main pain points to address. Keep it professional and actionable.
    
Feedback:
${comments}`;

  return await callGemini(prompt);
};

/**
 * Generates actionable recommendations based on analytics and feedback data
 */
const generateRecommendations = async (stats, feedbacks) => {
  if (!feedbacks || feedbacks.length === 0) {
    return "No feedback records found to generate recommendations.";
  }

  const sample = feedbacks.slice(0, 30);
  const comments = sample.map(f => `- [${f.category || 'General'}]: ${f.comment}`).join('\n');
  const prompt = `You are a strategic business consultant. Based on the following business stats and customer feedback, provide 3 highly actionable, specific recommendations for the business to improve customer satisfaction and conversion rates.
    
Stats: ${JSON.stringify(stats)}
    
Recent Customer Feedback:
${comments}
    
Format your response as a professional markdown list.`;

  return await callGemini(prompt);
};

/**
 * Generates correlation insights based on behavior and feedback data
 */
const generateCorrelationInsights = async (behaviorFeedbackSummaries) => {
  const prompt = `You are a data analyst correlating customer browsing behavior with feedback sentiment. Below are customer records showing their browsing behavior followed by their feedback. Identify 3-5 specific correlation patterns — e.g. 'Customers who spent over 5 minutes on the checkout page before leaving feedback were more likely to complain about price or shipping' or 'Users who viewed a product 3+ times before adding to cart tended to leave positive reviews about product quality.' Only state patterns you can see evidence for in the data below. Format as a clean markdown list with actionable insights and supporting evidence.
    
Data: 
${behaviorFeedbackSummaries}`;

  return await callGemini(prompt);
};

module.exports = {
  analyzeSentiment,
  generateSummary,
  generateRecommendations,
  generateCorrelationInsights,
  fallbackSentiment // Exported for the seed script later
};
