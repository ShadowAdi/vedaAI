import { createUploadthing, type FileRouter } from "uploadthing/express";
import { logger } from "./logger.js";

const f = createUploadthing();

/**
 * UploadThing file router for Express
 * Supports PDF and text files for assignment uploads
 */
export const uploadRouter: FileRouter = {
    assignmentFile: f({
        pdf: { maxFileSize: "8MB", maxFileCount: 1 },
        text: { maxFileSize: "2MB", maxFileCount: 1 },
    })
        .onUploadComplete(async ({ file }) => {
            const fileUrl = (file as any).ufsUrl || file.ufsUrl;

            logger.info("Assignment file uploaded", {
                url: fileUrl,
                key: file.key,
                name: file.name,
                size: file.size,
            });

            return { fileUrl, fileName: file.name };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;