
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient, UserRole as PrismaUserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

/**
 * Updates or adds key-value pairs in a .env file content string.
 * @param fileContent The current content of the .env file.
 * @param updates An object of key-value pairs to update.
 * @returns The updated .env file content.
 */
const updateEnvContent = (fileContent: string, updates: Record<string, string | undefined | null>): string => {
    let newContent = fileContent;
    for (const [key, value] of Object.entries(updates)) {
        // Ensure value is a string, or skip if it's null/undefined
        if (value === null || value === undefined) continue;
        
        const stringValue = String(value);
        // Regex to find the key, followed by an equals sign, and the rest of the line.
        // It handles cases where the value might be quoted or not.
        const keyRegex = new RegExp(`^${key}=.*$`, 'm');
        const newEntry = `${key}="${stringValue.replace(/"/g, '\"')}"`; // Ensure value is quoted and escaped

        if (keyRegex.test(newContent)) {
            // If the key exists, replace the entire line
            newContent = newContent.replace(keyRegex, newEntry);
        } else {
            // If the key doesn't exist, add it to the end
            newContent += `\n${newEntry}`;
        }
    }
    return newContent;
};


// The main handler for the POST /api/setup request
export async function POST(request: Request) {
    try {
        // 1. Verify that setup has not been completed yet
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            return new Response(JSON.stringify({ error: 'Setup already completed' }), {
                status: 409, // 409 Conflict
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 2. Parse incoming data
        const { admin, jwtSecret, smtp, ai } = await request.json();
        const { email, password } = admin || {};
        
        // 3. Validate essential data
        if (!email || !password || password.length < 8 || !jwtSecret || jwtSecret.length < 32) {
             return new Response(JSON.stringify({ error: 'Invalid or missing admin credentials or JWT secret' }), {
                status: 400, // 400 Bad Request
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- Critical Section: Perform database and file system writes ---

        // 4. Create the first admin user
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        await prisma.user.create({
            data: {
                email,
                name: 'Admin', // Set a default name for the first admin
                passwordHash,
                role: PrismaUserRole.ADMIN
            },
        });

        // 5. Securely update the .env file
        const envPath = path.resolve(process.cwd(), '.env');
        let envFileContent = '';
        try {
            envFileContent = await fs.readFile(envPath, 'utf-8');
        } catch (e) {
            // If .env file doesn't exist, create a base from existing environment variables
            envFileContent = `DATABASE_URL="${process.env.DATABASE_URL}"`;
        }

        const updatesToEnv = {
            JWT_SECRET: jwtSecret,
            ...(smtp && smtp.host && { // Only add SMTP if host is present
                SMTP_HOST: smtp.host,
                SMTP_PORT: smtp.port,
                SMTP_USER: smtp.user,
                SMTP_PASS: smtp.pass,
                SMTP_SECURE: String(smtp.secure),
            }),
            ...(ai && ai.apiKey && { // Only add AI if apiKey is present
                AI_PROVIDER: ai.provider,
                GEMINI_API_KEY: ai.apiKey,
                AI_MODEL: ai.model,
            }),
        };

        const newEnvContent = updateEnvContent(envFileContent, updatesToEnv);
        
        await fs.writeFile(envPath, newEnvContent.trim() + '\n');

        // --- End Critical Section ---

        // 6. Return a success response
        return new Response(JSON.stringify({ message: 'Setup completed successfully!' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('[API /api/setup] Critical Error:', error);
        // This is a critical error, so we should return a generic server error
        // to avoid leaking any sensitive information.
        return new Response(JSON.stringify({ error: 'An unexpected error occurred during setup.' }), {
            status: 500, // 500 Internal Server Error
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
