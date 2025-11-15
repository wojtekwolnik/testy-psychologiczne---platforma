
import { PrismaClient, UserRole as PrismaUserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { 
    User, Test, TestResult, AccessCode, Notification, 
    PdfTemplate, AppSettings, ClientAnswer, CalculatedScaleScore,
    BrandingSettings, AiSettings, EmailSettings, UserRole
} from '../components/types';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// --- Utility Functions ---
const isValidAppSettings = (settings: any): settings is AppSettings => {
    return settings && typeof settings.content === 'object';
};

// --- Setup and Status ---

export const getSetupStatus = async (): Promise<{ needsSetup: boolean }> => {
    const userCount = await prisma.user.count();
    return { needsSetup: userCount === 0 };
};

export const createFirstAdminUser = async (email: string, password: string, setupKey: string): Promise<User> => {
    // 1. Verify that no other users exist
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        throw new Error("An admin account already exists. Setup cannot proceed.");
    }

    // 2. Verify the setup key from environment variables
    const serverSetupKey = process.env.SETUP_KEY;
    if (!serverSetupKey || setupKey !== serverSetupKey) {
        throw new Error("Invalid setup key.");
    }

    // 3. Hash the password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Create the new admin user
    const newUser = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: PrismaUserRole.ADMIN, 
            isActive: true,
        },
    });

    return {
        ...newUser,
        role: UserRole.Admin, // Convert to application enum
    };
};


// --- User Management ---
export const findUserByEmail = async (email: string): Promise<User | null> => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { ...user, role: user.role === 'ADMIN' ? UserRole.Admin : UserRole.Therapist };
};

// ... (rest of the user management functions)


// --- Authentication ---
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return null;

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return null;

    return { ...user, role: user.role === 'ADMIN' ? UserRole.Admin : UserRole.Therapist };
};

// ... (all other existing functions like getTestById, createTestResult, etc.)

// The following are the rest of the functions from the original file, adapted slightly for consistency

export const getUserById = async (id: string): Promise<User | null> => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return { ...user, role: user.role === 'ADMIN' ? UserRole.Admin : UserRole.Therapist };
};

export const getAllUsers = async (): Promise<User[]> => {
    const users = await prisma.user.findMany();
    return users.map(user => ({
        ...user,
        role: user.role === 'ADMIN' ? UserRole.Admin : UserRole.Therapist,
    }));
};

export const getTestById = async (id: string): Promise<Test | null> => {
    const test = await prisma.test.findUnique({ where: { id } });
    if (!test) return null;
    return { ...test, createdAt: new Date(test.createdAt), scales: test.scales as any, sections: test.sections as any };
};

export const getTestByCanonicalId = async (canonicalId: string): Promise<Test | null> => {
    const test = await prisma.test.findFirst({ where: { canonicalId }, orderBy: { version: 'desc' } });
    if (!test) return null;
    return { ...test, createdAt: new Date(test.createdAt), scales: test.scales as any, sections: test.sections as any };
};

export const createTestResult = async (resultData: Omit<TestResult, 'id'>): Promise<TestResult> => {
    const result = await prisma.testResult.create({
        data: { ...resultData, answers: resultData.answers as any, scores: resultData.scores as any },
    });
    return { ...result, completedAt: new Date(result.completedAt), answers: result.answers as any, scores: result.scores as any };
};

export const getTestResultById = async (id: string): Promise<TestResult | null> => {
    const result = await prisma.testResult.findUnique({ where: { id } });
    if (!result) return null;
    return { ...result, completedAt: new Date(result.completedAt), answers: result.answers as any, scores: result.scores as any };
};

export const getAccessCode = async (code: string): Promise<AccessCode | null> => {
    return prisma.accessCode.findUnique({ where: { code } });
};

export const createAccessCode = async (codeData: Omit<AccessCode, 'createdAt' | 'isUsed'>): Promise<AccessCode> => {
    return prisma.accessCode.create({ data: codeData });
};

export const markAccessCodeAsUsed = async (code: string): Promise<AccessCode> => {
    return prisma.accessCode.update({ where: { code }, data: { isUsed: true } });
};

export const getNotificationsForUser = async (userId: string): Promise<Notification[]> => {
    const notifications = await prisma.notification.findMany({ where: { userId } });
    return notifications.map(n => ({ ...n, createdAt: new Date(n.createdAt), context: n.context as any }));
};

export const getAllPdfTemplates = async (): Promise<PdfTemplate[]> => {
    return prisma.pdfTemplate.findMany();
};

export const getAppSettings = async (): Promise<AppSettings | null> => {
    const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });
    if (settings && isValidAppSettings(settings)) {
        return settings as AppSettings;
    }
    return null;
};

export const updateAppSettings = async (newSettings: AppSettings): Promise<AppSettings> => {
    const result = await prisma.appSettings.upsert({
        where: { id: 'singleton' },
        update: { content: newSettings.content as any },
        create: { id: 'singleton', content: newSettings.content as any },
    });
    return result as AppSettings;
};

export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
    return getNotificationsForUser(userId);
};

