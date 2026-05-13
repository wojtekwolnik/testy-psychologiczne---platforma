import { describe, it, expect, vi, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createNewTest } from './testActions';
import { generateAccessCode } from './accessCodeActions';
import { submitTest } from './resultActions';
import bcrypt from 'bcryptjs';

// Mock checkAuth since it requires next/headers
vi.mock('./authActions', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./authActions')>();
    return {
        ...actual,
        checkAuth: vi.fn(async () => {
            return await prisma.user.findFirst({ where: { role: 'therapist' } });
        }),
    };
});

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

describe('Core Workflow Integration', () => {
    let therapistId: string;
    let createdTestId: string;
    let accessCodeValue: string;

    beforeAll(async () => {
        // Create a test user for relations
        const hash = await bcrypt.hash('test', 10);
        const user = await prisma.user.upsert({
            where: { email: 'test-therapist@workflow.com' },
            update: {},
            create: {
                email: 'test-therapist@workflow.com',
                password: hash,
                role: 'therapist'
            }
        });
        therapistId = user.id;
    });

    it('creates a test', async () => {
        const uniqueId = crypto.randomUUID();
        const newTest = await createNewTest({
            id: uniqueId,
            title: 'Integration Test Profile',
            description: 'A test created during integration testing.',
            instructions: 'Answer carefully.',
            status: 'PUBLISHED',
            sections: [
                {
                    id: crypto.randomUUID(),
                    title: 'Section 1',
                    questions: [
                        {
                            id: crypto.randomUUID(),
                            text: 'How do you feel?',
                            type: 'multiple-choice',
                            options: [
                                { id: crypto.randomUUID(), text: 'Good' },
                                { id: crypto.randomUUID(), text: 'Bad' }
                            ],
                            scoring: {},
                            isReversed: false
                        }
                    ]
                }
            ],
            scales: [],
            defaultTemplateId: null,
            createdAt: new Date().toISOString(),
            canonicalId: uniqueId,
            version: 1,
            questionsPerPage: 1
        });
        
        expect(newTest).toBeDefined();
        expect(newTest.title).toBe('Integration Test Profile');
        createdTestId = newTest.id;
    });

    it('generates an access code', async () => {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        const code = await generateAccessCode(createdTestId, expiresAt, therapistId);
        expect(code).toBeDefined();
        expect(code.code).toHaveLength(9);
        expect(code.code.startsWith('AC-')).toBe(true);
        expect(code.testId).toBe(createdTestId);
        expect(code.therapistId).toBe(therapistId);
        
        accessCodeValue = code.code;
    });

    it('submits a test result using the code', async () => {
        // Verify the code exists in DB before submitting
        const codeRec = await prisma.accessCode.findUnique({ where: { code: accessCodeValue } });
        expect(codeRec).toBeDefined();

        const result = await submitTest(createdTestId, { 'q1': ['o1'] }, accessCodeValue);
        expect(result).toBeDefined();
        expect(result.testId).toBe(createdTestId);
        expect(result.answers['q1']).toEqual(['o1']);
        expect(result.therapistId).toBe(therapistId);
        
        // Verify that the code was marked as used
        const usedCode = await prisma.accessCode.findUnique({ where: { code: accessCodeValue } });
        expect(usedCode?.isUsed).toBe(true);
    });
});
