import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __fileURLToPath = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__fileURLToPath);

const debugDir = path.join(__dirname, "../../debug");

// Ensure debug directory exists
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir, { recursive: true });
}

export const writeDebugLog = (filename: string, content: string) => {
  const timestamp = new Date().toISOString();
  const logPath = path.join(debugDir, `${filename}.txt`);
  fs.appendFileSync(logPath, `\n\n========== ${timestamp} ==========\n${content}`);
};
