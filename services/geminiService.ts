import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateInsights = async (contextData: string): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are Cénit, an intelligent restaurant manager AI. 
      Analyze the following restaurant data and provide a concise, strategic insight or prediction (max 3 sentences).
      Focus on efficiency, revenue opportunities, or inventory alerts.
      
      Data Context:
      ${contextData}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return response.text || "No insights available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI service temporarily unavailable.";
  }
};

export const generateMarketingCampaign = async (segment: string, customerData: string): Promise<string> => {
    if (!apiKey) return "API Key not configured.";
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a short, engaging email marketing copy for a restaurant targeting the "${segment}" customer segment.
        
        Customer Profile details: ${customerData}
        
        Keep it warm, professional, and include a clear call to action. Max 100 words.`,
      });
      return response.text || "Could not generate campaign.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "AI service temporarily unavailable.";
    }
  };

export const generateInventoryInsight = async (inventoryContext: string): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert restaurant inventory manager.
      Analyze this stock data and upcoming demand (weekend rush expected).
      Provide 3 specific, actionable restocking or utilization recommendations in a list format.
      
      Stock Data:
      ${inventoryContext}`,
       config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return response.text || "No insights available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI service temporarily unavailable.";
  }
};

export const generateRestockPlan = async (inventoryContext: string): Promise<any[]> => {
  if (!apiKey) return [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an intelligent purchasing manager for a restaurant.
      Analyze the provided inventory data.
      Context: The restaurant expects HIGH demand this upcoming weekend.
      
      Inventory Data (Name | Qty | Min Threshold | Status):
      ${inventoryContext}
      
      Identify items that need restocking. Consider the High Demand prediction.
      Return a list of items to order.
      Prioritize items with 'Critical' or 'Low' status, but also consider items near threshold due to high demand.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              currentQty: { type: Type.NUMBER },
              suggestedQty: { type: Type.NUMBER },
              priority: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const generateStaffingInsight = async (scheduleContext: string): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert HR and staffing manager for a busy restaurant.
      Analyze the current roster and predicted demand (High occupancy Friday/Saturday).
      Provide 3 actionable recommendations to optimize the schedule, reduce overtime, or improve service coverage.
      
      Staffing Context:
      ${scheduleContext}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "No staffing insights available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI service temporarily unavailable.";
  }
};

export const verifyAddress = async (address: string, userLocation?: {lat: number, lng: number}): Promise<{text: string, mapUri?: string}> => {
  if (!apiKey) return { text: "API Key not configured." };

  try {
    // Construct config with tools
    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    // Add retrievalConfig if userLocation is provided
    if (userLocation) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: userLocation.lat,
                    longitude: userLocation.lng
                }
            }
        };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Verify this address for delivery purposes. Provide a brief confirmation of the location or suggest a correction. Address: ${address}`,
      config: config
    });

    const text = response.text || "No details found.";
    
    // Extract map URI from grounding chunks
    let mapUri = undefined;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
        for (const chunk of chunks) {
            // Check for maps grounding chunk
            // @ts-ignore
            if (chunk.maps?.uri) {
                // @ts-ignore
                mapUri = chunk.maps.uri;
                break;
            }
        }
    }

    return { text, mapUri };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Address verification unavailable." };
  }
};