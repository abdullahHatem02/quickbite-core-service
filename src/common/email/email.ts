import { logger } from "../logger/logger.ts";

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
    logger.info("Email sent (dummy)", { to, subject, body });
}
