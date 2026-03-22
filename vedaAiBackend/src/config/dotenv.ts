import { configDotenv } from "dotenv";

configDotenv()

export const PORT = process.env.PORT
export const DB_URL = process.env.DB_URL
export const REDIS_URL = process.env.REDIS_URL
export const CLIENT_URL = process.env.CLIENT_URL
export const NODE_ENV = process.env.NODE_ENV
export const UPLOADTHING_API_KEY = process.env.UPLOADTHING_API_KEY
export const UPLOADTHING_TOKEN = process.env.UPLOADTHING_TOKEN

export const SARVAM_API_KEY= process.env.SARVAM_API_KEY

// New exports for the variables you mentioned
export const MONGO_ROOT_USER = process.env.MONGO_ROOT_USER
export const MONGO_ROOT_PASS = process.env.MONGO_ROOT_PASS
export const MONGO_DB = process.env.MONGO_DB
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD