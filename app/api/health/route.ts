import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditTestIntegrity } from '@/lib/scoring/testAuditor';
import { ensureDass42TestExists } from '@/lib/dass42Sync';
import type { Test, Scale, Question } from '@/components/types';

export const dynamic = 'force-dynamic';

/**
 * 100% Read-Only Health & Test Integrity Endpoint.
 * Safe for both DEV and PROD monitoring:
 * - Verifies PostgreSQL connection
 * - Ensures built-in tests exist non-destructively
 * - Audits published tests for psychometric/structural integrity
 * - NEVER exposes any user accounts, access codes, or client test results
 */
export async function GET() {
    const startedAt = Date.now();
    try {
        await ensureDass42TestExists(prisma);

        const rawTests = await prisma.test.findMany({
            where: { status: 'PUBLISHED' },
            include: {
                scales: true,
                sections: {
                    include: { questions: true },
                },
            },
        });

        const latestByCanonical = new Map<string, (typeof rawTests)[number]>();
        for (const t of rawTests) {
            const existing = latestByCanonical.get(t.canonicalId);
            if (!existing || t.version > existing.version) {
                latestByCanonical.set(t.canonicalId, t);
            }
        }

        const auditSummaries = Array.from(latestByCanonical.values()).map(t => {
            const serialized: Test = {
                id: t.id,
                canonicalId: t.canonicalId,
                version: t.version,
                title: t.title,
                description: t.description || '',
                instructions: t.instructions || '',
                status: (t.status as 'DRAFT' | 'PUBLISHED') || 'PUBLISHED',
                questionsPerPage: t.questionsPerPage,
                defaultTemplateId: t.defaultTemplateId,
                createdAt: t.createdAt.toISOString(),
                scales: t.scales.map(s => ({
                    id: s.id,
                    name: s.name,
                    type: s.type as Scale['type'],
                    description: s.description || '',
                    maxScore: s.maxScore ?? undefined,
                    formula: s.formula ?? undefined,
                    levels: s.levels ? JSON.parse(s.levels) : undefined,
                })),
                sections: t.sections.map(sec => ({
                    id: sec.id,
                    title: sec.title,
                    questions: sec.questions.map(q => ({
                        id: q.id,
                        text: q.text,
                        type: q.type as Question['type'],
                        isReversed: Boolean(q.isReversed),
                        options: JSON.parse(q.options),
                        scoring: JSON.parse(q.scoring),
                    })),
                })),
            };

            const report = auditTestIntegrity(serialized);
            return {
                canonicalId: t.canonicalId,
                title: report.title,
                version: report.version,
                questionCount: report.questionCount,
                scaleCount: report.scaleCount,
                passed: report.passed,
                errorCount: report.errorCount,
                warningCount: report.warningCount,
            };
        });

        const allPassed = auditSummaries.every(a => a.passed);

        return NextResponse.json(
            {
                status: allPassed ? 'ok' : 'degraded',
                database: 'connected',
                responseTimeMs: Date.now() - startedAt,
                publishedTestsCount: auditSummaries.length,
                testsAudit: auditSummaries,
            },
            { status: allPassed ? 200 : 503 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                status: 'error',
                database: 'disconnected',
                error: error?.message || 'Healthcheck failed',
            },
            { status: 500 }
        );
    }
}
