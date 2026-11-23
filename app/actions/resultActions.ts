'use server';

import { prisma } from '@/lib/prisma';
import type { TestResult, Test, Scale, Question, ScoringRule, PdfTemplate } from '@/components/types';
import { revalidatePath } from 'next/cache';
import { checkAuth, requireAuth } from './authActions';
import { buildKeyInterpretation, getNormalizedBigFiveScaleData } from '@/lib/interpretationBuilder';
import { calculateTestScores } from '@/lib/scoring/scoreCalculator';
import { ensureBigFiveTestUpgraded } from '@/lib/bigFiveSync';
import { cleanupExpiredData } from '@/app/services/retentionService';

export async function submitTest(testId: string, answers: Record<string, string[]>, clientIdentifier: string): Promise<TestResult> {
    const trimmedCode = (clientIdentifier || '').trim().toUpperCase();
    if (!trimmedCode) {
        throw new Error("Kod dostępu jest wymagany do zapisania wyniku testu.");
    }

    // 1. Fetch Test Data
    const rawTest = await prisma.test.findUnique({
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

    if (!rawTest) throw new Error("Test not found");
    if (rawTest.status !== 'PUBLISHED') {
        throw new Error("Ten test nie jest obecnie opublikowany.");
    }

    const test = await ensureBigFiveTestUpgraded(prisma, rawTest);
    const isBigFive = test.canonicalId === 'big-five-johnson-120';
    const processedTest = {
        ...test,
        scales: test.scales.map(s => {
            let parsedLevels = s.levels ? JSON.parse(s.levels) : undefined;
            let description = s.description || '';
            if (isBigFive) {
                const normalized = getNormalizedBigFiveScaleData({
                    id: s.id,
                    name: s.name,
                    description,
                    levels: parsedLevels,
                });
                if (normalized) {
                    description = normalized.description;
                    parsedLevels = normalized.levels;
                }
            }
            return {
                ...s,
                type: s.type as Scale['type'],
                description,
                maxScore: s.maxScore ?? undefined,
                formula: s.formula ?? undefined,
                levels: parsedLevels,
            };
        }),
        sections: test.sections.map(sec => ({
            ...sec,
            questions: sec.questions.map(q => ({
                ...q,
                options: JSON.parse(q.options as string),
                scoring: JSON.parse(q.scoring as string) as Record<string, ScoringRule[]>
            }))
        }))
    };

    const finalScores = calculateTestScores(processedTest, answers);
    const dbAnswers = JSON.stringify(answers);
    const dbScores = JSON.stringify(finalScores);
    const initialKeyAnalysis = buildKeyInterpretation(
        { title: test.title, scales: processedTest.scales },
        finalScores
    );

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
                analysis: initialKeyAnalysis || null,
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

    const t = await ensureBigFiveTestUpgraded(prisma, resultRecord.test);
    const isBigFive = t.canonicalId === 'big-five-johnson-120';

    const serializedTest: Test = {
        ...t,
        status: (t.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
        createdAt: t.createdAt.toISOString(),
        scales: t.scales.map((s: any) => {
            let parsedLevels = s.levels ? JSON.parse(s.levels) : undefined;
            let description = s.description || '';

            if (isBigFive) {
                const normalized = getNormalizedBigFiveScaleData({
                    id: s.id,
                    name: s.name,
                    description,
                    levels: parsedLevels,
                });
                if (normalized) {
                    description = normalized.description;
                    parsedLevels = normalized.levels;
                    if (normalized.needsUpdate) {
                        prisma.scale
                            .update({
                                where: { id: s.id },
                                data: {
                                    description: normalized.description,
                                    levels: JSON.stringify(normalized.levels),
                                },
                            })
                            .catch(err => console.error('Non-fatal Big Five scale auto-migration error:', err));
                    }
                }
            }

            return {
                ...s,
                type: s.type as Scale['type'],
                description,
                maxScore: s.maxScore ?? undefined,
                formula: s.formula ?? undefined,
                levels: parsedLevels,
            };
        }),
        sections: t.sections.map((sec: any) => ({
            ...sec,
            questions: sec.questions.map((q: any) => ({
                ...q,
                isReversed: Boolean(q.isReversed),
                type: q.type as Question['type'],
                options: JSON.parse(q.options),
                scoring: JSON.parse(q.scoring),
            })),
        })),
    };

    const parsedScores = JSON.parse(resultRecord.scores as string) as Record<string, number>;
    const parsedAnswers = JSON.parse(resultRecord.answers as string) as Record<string, any>;

    // If a Big Five result was saved before facet subscales were added, compute the missing facet scores from answers
    if (isBigFive && Object.keys(parsedScores).length < serializedTest.scales.length && parsedAnswers) {
        try {
            const recomputed = calculateTestScores(serializedTest, parsedAnswers);
            const nonZeroCount = Object.values(recomputed).filter(v => v > 0).length;
            if (nonZeroCount >= 5) {
                Object.assign(parsedScores, recomputed);
                prisma.testResult
                    .update({
                        where: { id: resultRecord.id },
                        data: { scores: JSON.stringify(parsedScores) },
                    })
                    .catch(err => console.error('Non-fatal error saving recomputed Big Five facet scores:', err));
            }
        } catch {
            // Ignore if legacy answers were incomplete
        }
    }

    const resolvedAnalysis =
        resultRecord.analysis && resultRecord.analysis.trim()
            ? resultRecord.analysis
            : buildKeyInterpretation(serializedTest, parsedScores);

    const serializedResult: TestResult = {
        ...resultRecord,
        analysis: resolvedAnalysis || undefined,
        testTitle: t.title,
        testVersion: t.version,
        completedAt: resultRecord.completedAt.toISOString(),
        scores: parsedScores,
        answers: parsedAnswers,
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
