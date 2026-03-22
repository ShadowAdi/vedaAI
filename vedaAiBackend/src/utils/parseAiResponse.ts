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

const extractJsonWithFallback = (text: string): string | null => {
    const start = text.indexOf('{');
    if (start === -1) return null;

    const closingPositions: number[] = [];
    for (let i = text.length - 1; i > start; i--) {
        if (text[i] === '}') {
            closingPositions.push(i);
        }
    }

    for (const end of closingPositions) {
        const candidate = text.substring(start, end + 1);
        try {
            JSON.parse(candidate);
            console.log(`[findValidJson] ✅ Found valid JSON at end position ${end}`);
            return candidate;
        } catch {
        }
    }

    return null;
};

const autoCloseJson = (text: string): string | null => {
    const start = text.indexOf('{');
    if (start === -1) return null;

    let candidate = text.substring(start);

    for (let closeCount = 0; closeCount <= 10; closeCount++) {
        const attempt = candidate + '}'.repeat(closeCount);
        try {
            JSON.parse(attempt);
            console.log(`[findValidJson] ✅ Auto-closed JSON with ${closeCount} braces`);
            return attempt;
        } catch {
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

        console.log("\n========== PARSE: RAW INPUT ==========");
        console.log("Length:", rawResponse.length);
        console.log("Content:", rawResponse);
        console.log("========== END RAW INPUT ==========\n");

        let jsonString = rawResponse.trim();

        if (jsonString.includes('<think>')) {
            console.log("[PARSE STEP 1] Found <think> blocks, stripping...");

            jsonString = jsonString.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

            if (jsonString.includes('<think>')) {
                const thinkStart = jsonString.indexOf('<think>');
                jsonString = jsonString.substring(0, thinkStart).trim();
                logger.warn("[parseAIResponse] Found unclosed <think> block — truncated at think start");
            }

            logger.info("[parseAIResponse] Stripped <think> reasoning block");
        }

        if (jsonString.trim().length < 10 || !jsonString.includes('{')) {
            logger.error("[parseAIResponse] Response is empty or has no JSON after stripping think blocks");
            throw new AppError('AI model returned only reasoning with no JSON output — increase max_tokens', 500);
        }

        const beforeMarkdownStrip = jsonString;
        jsonString = jsonString
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '');

        if (beforeMarkdownStrip !== jsonString) {
            console.log("[PARSE STEP 2] Stripped markdown fences");
            console.log("[PARSE STEP 2] After stripping markdown:", jsonString.substring(0, 300));
        }

        const beforeXmlStrip = jsonString;
        jsonString = jsonString
            .replace(/<json>/gi, '')
            .replace(/<\/json>/gi, '');

        if (beforeXmlStrip !== jsonString) {
            console.log("[PARSE STEP 3] Stripped XML-style tags");
            console.log("[PARSE STEP 3] After stripping XML:", jsonString.substring(0, 300));
        }

        const beforeCommentStrip = jsonString;
        jsonString = jsonString
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');

        if (beforeCommentStrip !== jsonString) {
            console.log("[PARSE STEP 4] Stripped JS comments");
            console.log("[PARSE STEP 4] After stripping comments:", jsonString.substring(0, 300));
        }

        jsonString = jsonString.trim();

        console.log("\n[PARSE STEP 5] JSON string after all cleaning:");
        console.log("Length:", jsonString.length);
        console.log("First 500 chars:", jsonString.substring(0, 500));
        console.log("Last 200 chars:", jsonString.substring(Math.max(0, jsonString.length - 200)));

        // Step 5: Find the last valid JSON block
        let parsed: any;
        let extracted = findValidJson(jsonString);

        if (extracted) {
            console.log("[PARSE STEP 5] ✅ Extracted valid JSON block via backwards scan");
            console.log("[PARSE STEP 5] Extracted JSON length:", extracted.length);
            jsonString = extracted;
        } else {
            console.log("[PARSE STEP 5] ⚠️ No valid JSON found via backwards scan, trying multi-position fallback");
            extracted = extractJsonWithFallback(jsonString);

            if (extracted) {
                console.log("[PARSE STEP 5] ✅ Found valid JSON via multi-position fallback");
                jsonString = extracted;
            } else {
                console.log("[PARSE STEP 5] ⚠️ Multi-position fallback failed, trying auto-close");
                extracted = autoCloseJson(jsonString);

                if (extracted) {
                    console.log("[PARSE STEP 5] ✅ Successfully auto-closed incomplete JSON");
                    jsonString = extracted;
                } else {
                    console.log("[PARSE STEP 5] ❌ All extraction methods failed");
                    const start = jsonString.indexOf('{');
                    const end = jsonString.lastIndexOf('}');
                    console.log("[PARSE STEP 5] Naive fallback: first { at", start, "last } at", end);

                    if (start !== -1 && end !== -1 && start < end) {
                        jsonString = jsonString.substring(start, end + 1);
                        console.log("[PARSE STEP 5] Used naive slice, length:", jsonString.length);
                    } else {
                        console.log("[PARSE STEP 5] ❌ Could not find valid JSON structure");
                    }
                }
            }
        }

        // Step 6: Parse
        let parseError: any = null;
        try {
            console.log("\n[PARSE STEP 6] Attempting JSON.parse...");
            parsed = JSON.parse(jsonString);
            console.log("[PARSE STEP 6] ✅ JSON.parse successful");
            console.log("[PARSE STEP 6] Parsed object keys:", Object.keys(parsed));
        } catch (error) {
            parseError = error;
            console.log("[PARSE STEP 6] ❌ JSON.parse failed");
            console.log("[PARSE STEP 6] Error:", String(error));
            console.log("[PARSE STEP 6] Attempted JSON:", jsonString.substring(0, 1000));

            logger.error("[parseAIResponse] JSON parse failed", {
                error: String(error),
                attemptedJson: jsonString.substring(0, 1000),
                jsonLength: jsonString.length
            });
            throw error;
        }

        // Step 7: Validate structure
        console.log("\n[PARSE STEP 7] Validating structure...");
        console.log("[PARSE STEP 7] Parsed object:", JSON.stringify(parsed, null, 2).substring(0, 500));

        if (!parsed.sections) {
            console.log("[PARSE STEP 7] ❌ ERROR: parsed.sections is undefined");
            console.log("[PARSE STEP 7] Available keys:", Object.keys(parsed));

            logger.error("[parseAIResponse] Invalid response structure", {
                keys: Object.keys(parsed),
                parsed: JSON.stringify(parsed, null, 2).substring(0, 1000)
            });
            throw new AppError('Invalid response structure - missing sections array', 500);
        }

        if (!Array.isArray(parsed.sections)) {
            console.log("[PARSE STEP 7] ❌ ERROR: sections is not an array");
            console.log("[PARSE STEP 7] sections type:", typeof parsed.sections);
            console.log("[PARSE STEP 7] sections value:", parsed.sections);

            throw new AppError('Invalid response structure - sections must be an array', 500);
        }

        if (parsed.sections.length === 0) {
            console.log("[PARSE STEP 7] ❌ ERROR: sections array is empty");
            throw new AppError('Invalid response structure - sections array is empty', 500);
        }

        console.log("[PARSE STEP 7] ✅ sections array found with", parsed.sections.length, "sections");

        logger.info("[parseAIResponse] Found sections in response", {
            sectionCount: parsed.sections.length
        });

        const sections: any[] = parsed.sections.map((section: any, idx: number) => {
            console.log(`\n[PARSE STEP 7] Processing section ${idx}...`);
            console.log(`[PARSE STEP 7] Section ${idx} keys:`, Object.keys(section));

            if (!section.title || !section.instruction || !section.questions) {
                console.log(`[PARSE STEP 7] ❌ ERROR: Section ${idx} missing required fields`);
                console.log(`[PARSE STEP 7] - hasTitle: ${!!section.title}`);
                console.log(`[PARSE STEP 7] - hasInstruction: ${!!section.instruction}`);
                console.log(`[PARSE STEP 7] - hasQuestions: ${!!section.questions}`);

                logger.error(`[parseAIResponse] Invalid section #${idx} structure`, {
                    hasTitle: !!section.title,
                    hasInstruction: !!section.instruction,
                    hasQuestions: !!section.questions,
                    sectionKeys: Object.keys(section)
                });
                throw new AppError('Invalid section structure - missing required fields (title, instruction, or questions)', 500);
            }

            if (!Array.isArray(section.questions)) {
                console.log(`[PARSE STEP 7] ❌ ERROR: Section ${idx} questions is not array, it's:`, typeof section.questions);
                throw new AppError(`Invalid section structure - questions must be an array at section ${idx}`, 500);
            }

            if (section.questions.length === 0) {
                console.log(`[PARSE STEP 7] ❌ ERROR: Section ${idx} has no questions`);
                throw new AppError(`Invalid section structure - section ${idx} has no questions`, 500);
            }

            console.log(`[PARSE STEP 7] ✅ Section ${idx} has ${section.questions.length} questions`);

            const questions: any[] = section.questions.map((q: any, qIdx: number) => {
                if (!q.text || !q.difficulty || q.marks === undefined || q.marks === null) {
                    console.log(`[PARSE STEP 7] ❌ ERROR: Question ${idx}.${qIdx} missing required fields`);
                    console.log(`[PARSE STEP 7] - hasText: ${!!q.text}`);
                    console.log(`[PARSE STEP 7] - hasDifficulty: ${!!q.difficulty}`);
                    console.log(`[PARSE STEP 7] - hasMarks: ${q.marks !== undefined && q.marks !== null}`);
                    console.log(`[PARSE STEP 7] - marks value:`, q.marks);
                    console.log(`[PARSE STEP 7] - Question object:`, JSON.stringify(q, null, 2));

                    logger.error(`[parseAIResponse] Invalid question at section ${idx}, question ${qIdx}`, {
                        hasText: !!q.text,
                        hasDifficulty: !!q.difficulty,
                        hasMarks: q.marks !== undefined && q.marks !== null,
                        marks: q.marks,
                        question: JSON.stringify(q)
                    });
                    throw new AppError(`Invalid question structure at section ${idx}, question ${qIdx} - missing text, difficulty, or marks`, 500);
                }

                const difficulty = String(q.difficulty).toLowerCase();

                if (!['easy', 'medium', 'hard'].includes(difficulty)) {
                    console.log(`[PARSE STEP 7] ⚠️ WARNING: Question ${idx}.${qIdx} invalid difficulty: "${q.difficulty}" — defaulting to "medium"`);
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

        console.log("\n[PARSE FINAL] ✅ Successfully parsed response");
        console.log("[PARSE FINAL] Section count:", sections.length);
        console.log("[PARSE FINAL] Total questions:", totalQuestions);

        logger.info("[parseAIResponse] Successfully parsed response", {
            sectionCount: sections.length,
            totalQuestions
        });

        return { sections };

    } catch (error) {
        console.log("\n[PARSE ERROR] ❌ FAILED TO PARSE");
        console.log("[PARSE ERROR] Error:", String(error));
        console.log("[PARSE ERROR] Error stack:", error instanceof Error ? error.stack : "N/A");

        logger.error('[parseAIResponse] Failed to parse AI response', {
            error: String(error),
            rawResponse: rawResponse.substring(0, 500)
        });
        throw error instanceof AppError
            ? error
            : new AppError('Failed to parse AI response into valid format', 500);
    }
};