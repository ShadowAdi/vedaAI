import multer, { StorageEngine } from "multer";
import { AppError } from "../utils/AppError.js";

// Store files in memory as Buffer for UploadThing upload
const storage: StorageEngine = multer.memoryStorage();

// File filter for PDF and text
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["application/pdf", "text/plain", "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only PDF, TXT, and DOCX files are allowed", 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});