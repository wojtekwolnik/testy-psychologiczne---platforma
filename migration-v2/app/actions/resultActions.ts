'use server';

import { prisma } from '@/lib/prisma';
import type { TestResult, Test, Scale, Question, ClientAnswer, ScoringRule } from '@/components/types';
import { revalidatePath } from 'next/cache';
import { generateUniqueId } from '@/utils/idUtils'; // We might need to handle this or let Prisma UUID handle it. 
// Prisma schema uses String @id @default(cuid()) or similar usually. 
// Let's check schema.

// Helper for formula evaluation
const evaluateFormula = (formula: string, availableScores: Record<string, number>): number => {
    const populatedFormula = formula.replace(/\{(\w+?-\w+?)\}/g, (match, scaleId) => {
        return availableScores[scaleId]?.toString() || '0';
    });

    try {
        // Safe evaluation using Function
        const calculate = new Function(`return ${populatedFormula}`);
        const result = calculate();

        if (typeof result !== 'number' || !isFinite(result) || isNaN(result)) {
            return 0;
        }
        return result;
    } catch (error) {
        console.error(`[Formula Error] Could not evaluate: "${populatedFormula}"`, error);
        return 0;
    }
};

export async function submitTest(testId: string, answers: Record<string, string[]>, clientIdentifier: string): Promise<TestResult> {

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

    // Deserialize questions (options/scoring are JSON in DB)
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

    // Phase 1: Calculate Standard Scores
    for (const scale of standardScales) {
        standardScores[scale.id] = 0;
    }

    for (const section of processedTest.sections) {
        for (const question of section.questions) {
            const givenAnswer = answers[question.id];
            if (!givenAnswer) continue;

            const answerIds = Array.isArray(givenAnswer) ? givenAnswer : [givenAnswer];
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
    let currentAllScores = { ...standardScores, ...calculatedScores };

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

    // 3. Handle Therapist ID
    let therapistId = 'default-therapist-id';

    // Check if code provides therapist linkage
    if (clientIdentifier) {
        const code = await prisma.accessCode.findUnique({ where: { code: clientIdentifier } });
        if (code) {
            therapistId = code.therapistId;
            // Mark code as used? Maybe in separate action or here.
            // Let's assume validation happened before, but we mark used here or after success.
            await prisma.accessCode.update({ where: { code: clientIdentifier }, data: { isUsed: true } });
        }
    }

    // Ensure therapist exists to avoid Foreign Key error (Quick Fix for Prototype)
    const therapist = await prisma.user.findUnique({ where: { id: therapistId } });
    if (!therapist) {
        // Create a default user if not exists
        await prisma.user.create({
            data: {
                id: therapistId,
                email: 'default@example.com',
                username: 'Default Therapist',
                role: 'therapist'
            }
        });
    }

    const result = await prisma.testResult.create({
        data: {
            testId: test.id,
            // testTitle: test.title, // Removed as not in schema
            // testVersion: test.version, // Removed as not in schema
            therapistId: therapistId,
            clientIdentifier: clientIdentifier,
            scores: dbScores,
            answers: dbAnswers,
            completedAt: new Date()
        }
    });

    revalidatePath('/therapist/dashboard');

    return {
        ...result,
        testTitle: test.title, // Enrich return object
        testVersion: test.version, // Enrich return object
        completedAt: result.completedAt.toISOString(),
        scores: JSON.parse(result.scores as string),
        answers: JSON.parse(result.answers as string)
    };
}

export async function fetchResults(): Promise<TestResult[]> {
    const results = await prisma.testResult.findMany({
        orderBy: { completedAt: 'desc' },
        include: { test: true } // Include test to get title/version
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
    await prisma.testResult.delete({
        where: { id: resultId }
    });
    revalidatePath('/therapist/dashboard');
}
