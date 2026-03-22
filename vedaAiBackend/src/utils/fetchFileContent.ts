import axios from "axios";
import { logger } from "../config/logger.js";
import { PDFParse } from "pdf-parse";

export const extractFileContent = async (fileURL: string): Promise<string> => {
    try {
        const response = await axios.get<ArrayBuffer>(fileURL, {
            responseType: "arraybuffer",
            timeout: 15000,
        });

        const buffer = Buffer.from(response.data);
        const contentType = (response.headers["content-type"] as string) ?? "";

        const isPDF =
            contentType.includes("application/pdf") ||
            contentType.includes("pdf") ||
            buffer.subarray(0, 5).toString("ascii") === "%PDF-";

        if (isPDF) {
            logger.info(`[extractFileContent] Detected PDF, extracting text...`);

            try {
                const pdfParser = new PDFParse({ data: buffer });
                
                const result = await pdfParser.getText();

                if (!result.text || !result.text.trim()) {
                    throw new Error(
                        "PDF appears to be scanned/image-based — no extractable text found"
                    );
                }

                const text = result.text.trim();

                logger.info(
                    `[extractFileContent] PDF extracted: ${text.length} chars`
                );

                await pdfParser.destroy();
                return text;
            } catch (pdfError: any) {
                logger.error(`[extractFileContent] PDF parsing error: ${pdfError.message}`);
                logger.info(`[extractFileContent] Falling back to text extraction for PDF...`);
                const textContent = buffer.toString("utf-8").trim();
                if (textContent) {
                    logger.info(`[extractFileContent] Fallback text extracted: ${textContent.length} chars`);
                    return textContent;
                }
                throw pdfError;
            }
        }

        // fallback for non-PDF
        const textContent = buffer.toString("utf-8").trim();
        
        if (!textContent) {
            throw new Error("Extracted file content is empty");
        }

        logger.info(`[extractFileContent] Text file extracted: ${textContent.length} chars`);
        return textContent;

    } catch (error: any) {
        logger.error(`[extractFileContent] Error: ${error.message}`);
        throw error;
    }
};