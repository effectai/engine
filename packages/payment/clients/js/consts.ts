import dotenv from "dotenv";
dotenv.config();

export const BATCH_SIZE = process.env.PAYMENT_BATCH_SIZE || 10;
