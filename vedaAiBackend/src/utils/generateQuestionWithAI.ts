import axios from "axios";
import { SARVAM_API_KEY } from "../config/dotenv.js";
import { logger } from "../config/logger.js";
import { AppError } from "./AppError.js";

export const generateQuestionWithAI = async (prompt: string) => {
    try {
        logger.info("[generateQuestionWithAI] Sending request to Sarvam AI");
        
        const response = await axios.post(
            "https://api.sarvam.ai/v1/chat/completions",
            {
                messages: [
                    {
                        content: "You are a JSON-only response API. You must respond with valid JSON and absolutely nothing else. No explanations, no markdown, no preamble.",
                        role: "system",
                    },
                    {
                        content: prompt,
                        role: "user",
                    },
                ],
                model: "sarvam-m",
                max_tokens: 8000,
            },
            {
                headers: {
                    "api-subscription-key": SARVAM_API_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 60000, 
            },
        );

        const rawContent = response.data?.choices?.[0]?.message?.content;
        
        if (!rawContent) {
            logger.error("[generateQuestionWithAI] No content in Sarvam response", {
                response: JSON.stringify(response.data, null, 2)
            });
            throw new Error("No content in Sarvam response");
        }

        logger.info("[generateQuestionWithAI] AI response received", {
            contentLength: rawContent.length,
            contentPreview: rawContent.substring(0, 200)
        });

        // 🔍 DEBUG: Log the complete raw response for debugging
        console.log("\n========== COMPLETE AI RESPONSE ==========");
        console.log(rawContent);
        console.log("========== END AI RESPONSE ==========\n");
        
        logger.info("[generateQuestionWithAI] Full AI response logged to console");

        return rawContent;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            logger.error("[generateQuestionWithAI] Axios error", {
                status: error.response?.status,
                data: JSON.stringify(error.response?.data, null, 2),
            });
        } else {
            logger.error("[generateQuestionWithAI] Error:", { error: String(error) });
        }

        throw new AppError(
            "Sarvam AI request failed. Check logs for details.",
            400,
        );
    }
};