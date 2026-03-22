import { logger } from "../config/logger.js";
import { IQuestionPaper } from "../interface/assignment.interface.js";
import { AppError } from "./AppError.js";
import { writeDebugLog } from "./debugLogger.js";

const findValidJson = (text: string): string | null => {
    let depth = 0;
    let end = -1;

    for (let i = text.length - 1; i >= 0; i--) {
        if (text[i] === '}') {
            if (depth === 0) end = i;
            depth++;
        } else if (text[i] === '{') {
            depth--;
            if (depth === 0 && end !== -1) {
                const candidate = text.substring(i, end + 1);
                try {
                    JSON.parse(candidate);
                    return candidate;
                } catch {
                    end = -1;
                }
            }
        }
    }
    return null;
};

export const parseAIResponse = (rawResponse: string): Partial<IQuestionPaper> => {
    try {
        writeDebugLog("ai_responses", `Raw Response:\n${rawResponse}`);

        logger.info("[parseAIResponse] Attempting to parse AI response", {
            length: rawResponse.length,
            preview: rawResponse.substring(0, 300)
        });

        let jsonString = rawResponse.trim();

        // Step 1: Strip <think>...</think> reasoning blocks (sarvam-m is a reasoning model)
        if (jsonString.includes('<think>')) {
            jsonString = jsonString.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            logger.info("[parseAIResponse] Stripped <think> reasoning block");
        }

        // Step 2: Strip markdown fences
        jsonString = jsonString
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '');

        // Step 3: Strip XML-style tags
        jsonString = jsonString
            .replace(/<json>/gi, '')
            .replace(/<\/json>/gi, '');

        // Step 4: Strip JS comments
        jsonString = jsonString
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');

        jsonString = jsonString.trim();

        // Step 5: Find the last valid JSON block
        let parsed: any;
        const extracted = findValidJson(jsonString);

        if (extracted) {
            logger.info("[parseAIResponse] Extracted valid JSON block via backwards scan");
            jsonString = extracted;
        } else {
            // Fallback: naive first { to last }
            const start = jsonString.indexOf('{');
            const end = jsonString.lastIndexOf('}');
            if (start !== -1 && end !== -1 && start < end) {
                jsonString = jsonString.substring(start, end + 1);
                logger.info("[parseAIResponse] Extracted JSON via naive slice", { start, end });
            }
        }

        // Step 6: Parse
        try {
            parsed = JSON.parse(jsonString);
        } catch (parseError) {
            logger.error("[parseAIResponse] JSON parse failed", {
                error: String(parseError),
                attemptedJson: jsonString.substring(0, 1000),
                jsonLength: jsonString.length
            });
            throw parseError;
        }

        // Step 7: Validate structure
        if (!parsed.sections || !Array.isArray(parsed.sections)) {
            logger.error("[parseAIResponse] Invalid response structure", {
                keys: Object.keys(parsed)
            });
            throw new AppError('Invalid response structure - missing sections array', 500);
        }

        if (parsed.sections.length === 0) {
            throw new AppError('Invalid response structure - sections array is empty', 500);
        }

        logger.info("[parseAIResponse] Found sections in response", {
            sectionCount: parsed.sections.length
        });

        const sections: any[] = parsed.sections.map((section: any, idx: number) => {
            if (!section.title || !section.instruction || !section.questions) {
                logger.error(`[parseAIResponse] Invalid section #${idx} structure`, {
                    hasTitle: !!section.title,
                    hasInstruction: !!section.instruction,
                    hasQuestions: !!section.questions,
                    sectionKeys: Object.keys(section)
                });
                throw new AppError('Invalid section structure - missing required fields (title, instruction, or questions)', 500);
            }

            if (!Array.isArray(section.questions)) {
                throw new AppError(`Invalid section structure - questions must be an array at section ${idx}`, 500);
            }

            if (section.questions.length === 0) {
                throw new AppError(`Invalid section structure - section ${idx} has no questions`, 500);
            }

            const questions: any[] = section.questions.map((q: any, qIdx: number) => {
                if (!q.text || !q.difficulty || q.marks === undefined || q.marks === null) {
                    logger.error(`[parseAIResponse] Invalid question at section ${idx}, question ${qIdx}`, {
                        hasText: !!q.text,
                        hasDifficulty: !!q.difficulty,
                        hasMarks: q.marks !== undefined && q.marks !== null,
                        marks: q.marks
                    });
                    throw new AppError(`Invalid question structure at section ${idx}, question ${qIdx} - missing text, difficulty, or marks`, 500);
                }

                const difficulty = String(q.difficulty).toLowerCase();

                if (!['easy', 'medium', 'hard'].includes(difficulty)) {
                    logger.warn(`[parseAIResponse] Invalid difficulty at section ${idx}, question ${qIdx}: "${q.difficulty}" — defaulting to "medium"`);
                }

                return {
                    text: String(q.text).trim(),
                    difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
                    marks: Number(q.marks),
                };
            });

            return {
                title: String(section.title).trim(),
                instruction: String(section.instruction).trim(),
                questions,
            };
        });

        const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);

        logger.info("[parseAIResponse] Successfully parsed response", {
            sectionCount: sections.length,
            totalQuestions
        });

        return { sections };

    } catch (error) {
        logger.error('[parseAIResponse] Failed to parse AI response', {
            error: String(error),
            rawResponse: rawResponse.substring(0, 500)
        });
        throw error instanceof AppError
            ? error
            : new AppError('Failed to parse AI response into valid format', 500);
    }
};