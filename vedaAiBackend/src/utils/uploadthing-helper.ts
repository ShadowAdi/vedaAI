import { UTApi } from "uploadthing/server";
import { UPLOADTHING_API_KEY, UPLOADTHING_TOKEN } from "../config/dotenv.js";
import { logger } from "../config/logger.js";
import { AppError } from "./AppError.js";

const utapi = new UTApi({
  token: UPLOADTHING_TOKEN,
});

/**
 * Uploads a file buffer to UploadThing and returns the public URL
 * @param file - Buffer containing file data
 * @param fileName - Original filename with extension
 * @param fileType - MIME type (optional, auto-detected if not provided)
 * @returns Public URL of uploaded file
 */
export async function uploadFileToUploadThing(
  file: Buffer,
  fileName: string,
  fileType?: string
): Promise<string> {
  try {
    if (!UPLOADTHING_API_KEY) {
      logger.error("UploadThing API key not configured");
      throw new AppError("UploadThing API key not configured", 500);
    }

    if (!file || file.length === 0) {
      throw new AppError("Invalid file buffer", 400);
    }

    const blob = new Blob([new Uint8Array(file)], { type: fileType || "application/octet-stream" });
    const fileToUpload = new File([blob], fileName, { type: fileType || blob.type });

    const result = await utapi.uploadFiles([fileToUpload]);

    if (!result?.[0] || result[0].error) {
      logger.error("UploadThing upload failed:", result?.[0]?.error);
      throw new AppError("Failed to upload file to storage", 500);
    }

    const uploadedFile = result[0];
    logger.info(`File uploaded successfully: ${uploadedFile.data.name}`, {
      url: uploadedFile.data.ufsUrl,
      key: uploadedFile.data.key,
    });

    return uploadedFile.data.ufsUrl;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error(`UploadThing upload error: ${error}`);
    throw new AppError("File upload failed", 500);
  }
}