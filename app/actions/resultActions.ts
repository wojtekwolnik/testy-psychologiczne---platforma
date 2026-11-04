'use server';

import { prisma } from '@/lib/prisma';
import type { TestResult, Test, Scale, Question, ClientAnswer, ScoringRule, PdfTemplate } from '@/components/types';
import { revalidatePath } from 'next/cache';
import { evaluate } from 'mathjs';
import { checkAuth, requireAuth } from './authActions';

// Helper for formula evaluation (supports any alphanumeric scale ID, with or without hyphens)
const evaluateFormula = (formula: string, availableScores: Record<string, number>): number => {
    const populatedFormula = formula.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_match, scaleId) => {
        return availableScores[scaleId]?.toString() || '0';
    });

    try {
        const result = evaluate(populatedFormula);

        if (typeof result !== 'number' || !isFinite(result) || isNaN(result)) {
            return 0;
        }
        return result;
    } catch (error) {
        console.error(`[Formula Error] Could not evaluate: "${populatedFormula}"`, error);
        return 0;
    }
};

const RETENTION_DAYS = 60;

/**
 * Automatically purges test results older than 60 days (matching the 60-day countdown in the UI)
 * as well as expired unused access codes and old used access codes.
 */
async function cleanupExpiredData(): Promise<void> {
    try {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

        await Promise.all([
            prisma.testResult.deleteMany({
                where: { completedAt: { lt: cutoffDate } }
            }),
            prisma.accessCode.deleteMany({
                where: {
                    OR: [
                        { isUsed: false, expiresAt: { lt: now } },
                        { isUsed: true, createdAt: { lt: cutoffDate } }
                    ]
                }
            })
        ]);
    } catch (error) {
        console.error('[Retention Cleanup] Failed to purge expired records:', error);
    }
}

export async function submitTest(testId: string, answers: Record<string, string[]>, clientIdentifier: string): Promise<TestResult> {
    const trimmedCode = (clientIdentifier || '').trim().toUpperCase();
    if (!trimmedCode) {
        throw new Error("Kod dostępu jest wymagany do zapisania wyniku testu.");
    }

    // 1. Fetch Test Data
    const test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
            scales: true,
            sections: {
                include: {
                    questions: true
                }
            }
        }
    });

    if (!test) throw new Error("Test not found");
    if (test.status !== 'PUBLISHED') {
        throw new Error("Ten test nie jest obecnie opublikowany.");
    }

    const processedTest = {
        ...test,
        scales: test.scales.map(s => ({ ...s, maxScore: s.maxScore ?? undefined, formula: s.formula ?? undefined })),
        sections: test.sections.map(sec => ({
            ...sec,
            questions: sec.questions.map(q => ({
                ...q,
                options: JSON.parse(q.options as string),
                scoring: JSON.parse(q.scoring as string) as Record<string, ScoringRule[]>
            }))
        }))
    };

    const standardScores: Record<string, number> = {};
    const standardScales = processedTest.scales.filter(s => s.type === 'standard');

    // Phase 1: Validate all questions are answered & Calculate Standard Scores
    for (const scale of standardScales) {
        standardScores[scale.id] = 0;
    }

    for (const section of processedTest.sections) {
        for (const question of section.questions) {
            const givenAnswer = answers[question.id];
            const answerIds = Array.isArray(givenAnswer) ? givenAnswer : (givenAnswer ? [givenAnswer] : []);
            if (answerIds.length === 0) {
                throw new Error("Proszę odpowiedzieć na wszystkie pytania przed zakończeniem testu.");
            }

            for (const answerId of answerIds) {
                const scoringRules = question.scoring[answerId];
                if (scoringRules) {
                    for (const rule of scoringRules) {
                        if (standardScores[rule.scaleId] !== undefined) {
                            standardScores[rule.scaleId] += rule.points;
                        }
                    }
                }
            }
        }
    }

    // Phase 2: Calculate Calculated Scores
    const calculatedScores: Record<string, number> = {};
    const calculatedScales = processedTest.scales.filter(s => s.type === 'calculated');
    calculatedScales.forEach(s => calculatedScores[s.id] = 0);

    let iterations = 0;
    let scoresChanged = true;
    const maxIterations = 10;
    const currentAllScores: Record<string, number> = { ...standardScores, ...calculatedScores };

    while (scoresChanged && iterations < maxIterations) {
        scoresChanged = false;
        iterations++;

        for (const scale of calculatedScales) {
            if (scale.type === 'calculated' && scale.formula) {
                const oldValue = calculatedScores[scale.id];
                const newValue = evaluateFormula(scale.formula, currentAllScores);

                if (newValue !== oldValue) {
                    calculatedScores[scale.id] = newValue;
                    currentAllScores[scale.id] = newValue;
                    scoresChanged = true;
                }
            }
        }
    }

    const finalScores = { ...standardScores, ...calculatedScores };
    const dbAnswers = JSON.stringify(answers);
    const dbScores = JSON.stringify(finalScores);

    // 3. Atomic verification of access code + creation of TestResult + in-app Notification
    const { result, therapistId } = await prisma.$transaction(async (tx) => {
        const codeRecord = await tx.accessCode.findUnique({ where: { code: trimmedCode } });
        if (!codeRecord) {
            throw new Error("Nieprawidłowy kod dostępu.");
        }
        if (codeRecord.isUsed) {
            throw new Error("Ten kod dostępu został już wykorzystany.");
        }
        if (new Date() > codeRecord.expiresAt) {
            throw new Error("Ten kod dostępu wygasł.");
        }
        if (codeRecord.testId !== test.id) {
            throw new Error("Ten kod dostępu jest przypisany do innego testu.");
        }

        const resolvedTherapistId = codeRecord.therapistId;
        await tx.accessCode.update({
            where: { code: trimmedCode },
            data: { isUsed: true }
        });

        const therapist = await tx.user.findUnique({ where: { id: resolvedTherapistId } });
        if (!therapist) {
            await tx.user.create({
                data: {
                    id: resolvedTherapistId,
                    email: 'default@example.com',
                    username: 'Default Therapist',
                    role: 'therapist'
                }
            });
        }

        const createdResult = await tx.testResult.create({
            data: {
                testId: test.id,
                therapistId: resolvedTherapistId,
                clientIdentifier: trimmedCode,
                scores: dbScores,
                answers: dbAnswers,
                completedAt: new Date()
            }
        });

        await tx.notification.create({
            data: {
                userId: resolvedTherapistId,
                message: `Nowy ukończony test "${test.title}" (kod: ${trimmedCode})`,
                context: JSON.stringify({ view: 'ReportView', params: { resultId: createdResult.id } })
            }
        });

        return { result: createdResult, therapistId: resolvedTherapistId };
    });

    // Trigger background retention cleanup
    await cleanupExpiredData();

    // Send Notification Email
    try {
        const therapistUser = await prisma.user.findUnique({ where: { id: therapistId } });
        if (therapistUser && therapistUser.email) {
            const { sendTherapistNotification } = await import('../services/emailService');
            const reportLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/report/${result.id}`;

            await sendTherapistNotification(
                therapistUser.email,
                therapistUser.username || 'Terapeuta',
                trimmedCode || clientIdentifier,
                test.title,
                reportLink
            );
        }
    } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
    }

    revalidatePath('/therapist/dashboard');

    return {
        ...result,
        testTitle: test.title,
        testVersion: test.version,
        completedAt: result.completedAt.toISOString(),
        scores: JSON.parse(result.scores as string),
        answers: JSON.parse(result.answers as string)
    };
}

export async function saveAnalysis(resultId: string, analysis: string): Promise<void> {
    const user = await requireAuth();
    const existing = await prisma.testResult.findUnique({ where: { id: resultId } });
    if (!existing) throw new Error('Result not found');
    if (user.role !== 'admin' && existing.therapistId !== user.id) {
        throw new Error('Brak uprawnień do edycji tego raportu.');
    }

    await prisma.testResult.update({
        where: { id: resultId },
        data: { analysis } as any
    });
    revalidatePath('/therapist/dashboard');
}

export async function triggerAnalysis(resultId: string): Promise<string | null> {
    const user = await requireAuth();
    const existing = await prisma.testResult.findUnique({ where: { id: resultId } });
    if (!existing) throw new Error('Result not found');
    if (user.role !== 'admin' && existing.therapistId !== user.id) {
        throw new Error('Brak uprawnień.');
    }

    const { generateAnalysis } = await import('../services/aiService');
    const analysis = await generateAnalysis(resultId);
    if (analysis) {
        await saveAnalysis(resultId, analysis);
    }
    return analysis;
}

export async function fetchResults(): Promise<TestResult[]> {
    const user = await checkAuth();
    if (!user) return [];

    await cleanupExpiredData();

    const where: any = {};
    if (user.role !== 'admin') {
        where.therapistId = user.id;
    }

    const results = await prisma.testResult.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        include: { test: true }
    });

    return results.map(r => ({
        ...r,
        testTitle: r.test.title,
        testVersion: r.test.version,
        completedAt: r.completedAt.toISOString(),
        scores: JSON.parse(r.scores as string),
        answers: JSON.parse(r.answers as string)
    }));
}

export async function deleteResult(resultId: string): Promise<void> {
    const user = await requireAuth();
    const existing = await prisma.testResult.findUnique({ where: { id: resultId } });
    if (!existing) throw new Error('Result not found');
    if (user.role !== 'admin' && existing.therapistId !== user.id) {
        throw new Error('Brak uprawnień do usunięcia tego wyniku.');
    }

    await prisma.testResult.delete({
        where: { id: resultId }
    });
    revalidatePath('/therapist/dashboard');
}

export async function fetchResultById(resultId: string): Promise<TestResult | null> {
    const user = await requireAuth();
    const result = await prisma.testResult.findUnique({
        where: { id: resultId },
        include: { test: true }
    });

    if (!result) return null;
    if (user.role !== 'admin' && result.therapistId !== user.id) {
        throw new Error('Brak uprawnień do odczytu tego wyniku.');
    }

    return {
        ...result,
        testTitle: result.test.title,
        testVersion: result.test.version,
        completedAt: result.completedAt.toISOString(),
        scores: JSON.parse(result.scores as string),
        answers: JSON.parse(result.answers as string)
    };
}

/**
 * Single server-side parallel loader for ReportView (eliminates 3-step client waterfall).
 */
export async function fetchReportBundle(resultId: string): Promise<{
    result: TestResult;
    test: Test;
    templates: PdfTemplate[];
} | null> {
    const user = await requireAuth();
    const resultRecord = await prisma.testResult.findUnique({
        where: { id: resultId },
        include: {
            test: {
                include: {
                    scales: true,
                    sections: {
                        include: { questions: true }
                    }
                }
            }
        }
    });

    if (!resultRecord) return null;
    if (user.role !== 'admin' && resultRecord.therapistId !== user.id) {
        throw new Error('Brak uprawnień do tego raportu.');
    }

    const rawTemplates = await prisma.pdfTemplate.findMany({
        where: { test: { canonicalId: resultRecord.test.canonicalId } },
        include: { test: { select: { canonicalId: true } } }
    });

    const t = resultRecord.test;
    const serializedTest: Test = {
        ...t,
        status: (t.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
        createdAt: t.createdAt.toISOString(),
        scales: t.scales.map(s => ({
            ...s,
            type: s.type as Scale['type'],
            description: s.description || '',
            maxScore: s.maxScore ?? undefined,
            formula: s.formula ?? undefined,
            levels: s.levels ? JSON.parse(s.levels) : undefined,
        })),
        sections: t.sections.map(sec => ({
            ...sec,
            questions: sec.questions.map(q => ({
                ...q,
                type: q.type as Question['type'],
                options: JSON.parse(q.options),
                scoring: JSON.parse(q.scoring),
            })),
        })),
    };

    const serializedResult: TestResult = {
        ...resultRecord,
        analysis: resultRecord.analysis ?? undefined,
        testTitle: t.title,
        testVersion: t.version,
        completedAt: resultRecord.completedAt.toISOString(),
        scores: JSON.parse(resultRecord.scores as string),
        answers: JSON.parse(resultRecord.answers as string),
    };

    const serializedTemplates: PdfTemplate[] = rawTemplates.map(tpl => ({
        ...tpl,
        testCanonicalId: tpl.test.canonicalId,
        components: JSON.parse(tpl.components as string),
    }));

    return {
        result: serializedResult,
        test: serializedTest,
        templates: serializedTemplates,
    };
}
