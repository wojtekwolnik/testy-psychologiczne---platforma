'use server';

import { prisma } from '@/lib/prisma';
import type { Test, Question, Scale, Section, PdfTemplate } from '@/components/types';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { requireAuth } from './authActions';
import { getNormalizedBigFiveScaleData } from '@/lib/interpretationBuilder';
import { ensureBigFiveTestUpgraded } from '@/lib/bigFiveSync';
import { ensureDass42TestExists, isDass42EnsuredInMemory } from '@/lib/dass42Sync';
import { remapTestEntityIds } from '@/lib/testUtils';
import { auditTestIntegrity } from '@/lib/scoring/testAuditor';
import { checkRateLimit } from '@/lib/rateLimit';

// Helper to parse JSON fields from Prisma to Frontend Types
const serializeTest = (prismaTest: any): Test => {
    const isBigFive = prismaTest.canonicalId === 'big-five-johnson-120';

    return {
        ...prismaTest,
        status: prismaTest.status || 'DRAFT',
        createdAt: prismaTest.createdAt.toISOString(),
        scales: (prismaTest.scales || []).map((s: any) => {
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
                description,
                maxScore: s.maxScore ?? undefined,
                formula: s.formula ?? undefined,
                levels: parsedLevels,
            };
        }),
        sections: (prismaTest.sections || []).map((sec: any) => ({
            ...sec,
            questions: (sec.questions || []).map((q: any) => ({
                ...q,
                isReversed: Boolean(q.isReversed),
                options: JSON.parse(q.options),
                scoring: JSON.parse(q.scoring),
            })),
        })),
    };
};

export async function fetchTests(): Promise<Test[]> {
    const user = await requireAuth();
    if (!isDass42EnsuredInMemory()) {
        await ensureDass42TestExists(prisma);
    }
    const whereClause = user.role === 'admin' ? {} : { status: 'PUBLISHED' };
    const tests = await prisma.test.findMany({
        where: whereClause,
        include: {
            scales: true,
            sections: {
                include: {
                    questions: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' }
    });

    const upgradedTests = [];
    for (const t of tests) {
        const upgraded = await ensureBigFiveTestUpgraded(prisma, t);
        upgradedTests.push(upgraded);
    }

    return upgradedTests.map(serializeTest);
}

export async function fetchTestById(testId: string): Promise<Test | null> {
    const user = await requireAuth();
    const test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
            scales: true,
            sections: {
                include: {
                    questions: true,
                },
            },
        },
    });

    if (!test) return null;
    if (user.role !== 'admin' && test.status !== 'PUBLISHED') {
        return null;
    }
    const upgraded = await ensureBigFiveTestUpgraded(prisma, test);
    return serializeTest(upgraded);
}

/**
 * Public action for test-takers: validates access code and strips out all scoring keys & scale formulas
 * so answers cannot be reverse-engineered in browser DevTools.
 * Also returns `codeExpiresAt` so client browser storage enforces code expiration over local 14-day draft TTL.
 */
export async function fetchPublicTestForClient(testId: string, clientCode: string): Promise<Test | null> {
    const rate = checkRateLimit('public-test-load', 25, 60_000);
    if (!rate.allowed) {
        return null;
    }

    const trimmedCode = (clientCode || '').trim().toUpperCase();
    if (!trimmedCode) return null;

    const accessCode = await prisma.accessCode.findUnique({
        where: { code: trimmedCode }
    });

    if (!accessCode || accessCode.isUsed || new Date() > accessCode.expiresAt || accessCode.testId !== testId) {
        return null;
    }

    const test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
            sections: {
                include: {
                    questions: true,
                },
            },
        },
    });

    if (!test || test.status !== 'PUBLISHED') return null;

    return {
        ...test,
        status: (test.status as 'DRAFT' | 'PUBLISHED') || 'PUBLISHED',
        createdAt: test.createdAt.toISOString(),
        codeExpiresAt: accessCode.expiresAt.toISOString(),
        scales: [],
        sections: test.sections.map((sec) => ({
            ...sec,
            questions: sec.questions.map((q) => ({
                ...q,
                type: q.type as Question['type'],
                options: JSON.parse(q.options).map((opt: any) => ({
                    id: opt.id,
                    text: opt.text,
                })),
                scoring: {},
            })),
        })),
    };
}

export async function saveTest(testData: Test, asNewVersion: boolean): Promise<Test> {
    await requireAuth('admin');
    if (testData.status === 'PUBLISHED') {
        const audit = auditTestIntegrity(testData);
        if (!audit.passed) {
            throw new Error(`Nie można opublikować testu z błędami psychometrycznymi (${audit.errorCount}). Popraw konfigurację przed publikacją.`);
        }
    }
    const { id, scales, sections, ...basicInfo } = testData;

    if (asNewVersion) {
        const existingVersions = await prisma.test.findMany({
            where: { canonicalId: basicInfo.canonicalId },
            select: { version: true }
        });
        const maxVersion = existingVersions.reduce((max, v) => Math.max(max, v.version), basicInfo.version || 1);
        const nextVersion = maxVersion + 1;
        const newTestId = crypto.randomUUID();
        const { remappedScales, remappedSections } = remapTestEntityIds(scales, sections);

        await prisma.test.create({
            data: {
                id: newTestId,
                canonicalId: basicInfo.canonicalId,
                version: nextVersion,
                title: basicInfo.title,
                description: basicInfo.description,
                instructions: basicInfo.instructions,
                questionsPerPage: basicInfo.questionsPerPage,
                status: basicInfo.status || 'DRAFT',
                defaultTemplateId: basicInfo.defaultTemplateId || null,
                scales: {
                    create: remappedScales.map(s => ({
                        id: s.id,
                        type: s.type,
                        name: s.name,
                        description: s.description,
                        maxScore: s.maxScore || null,
                        formula: s.formula || null,
                        levels: s.levels ? JSON.stringify(s.levels) : null
                    }))
                },
                sections: {
                    create: remappedSections.map(sec => ({
                        id: sec.id,
                        title: sec.title,
                        questions: {
                            create: sec.questions.map(q => ({
                                id: q.id,
                                text: q.text,
                                type: q.type,
                                isReversed: Boolean(q.isReversed),
                                options: JSON.stringify(q.options),
                                scoring: JSON.stringify(q.scoring)
                            }))
                        }
                    }))
                }
            }
        });

        revalidatePath('/admin/dashboard');
        revalidatePath('/therapist/dashboard');
        const createdVersion = await fetchTestById(newTestId);
        if (!createdVersion) throw new Error("Nie udało się zapisać nowej wersji testu.");
        return createdVersion;
    }

    await prisma.$transaction(async (tx) => {
        await tx.test.update({
            where: { id },
            data: {
                title: basicInfo.title,
                description: basicInfo.description,
                instructions: basicInfo.instructions,
                questionsPerPage: basicInfo.questionsPerPage,
                version: basicInfo.version,
                status: basicInfo.status || 'DRAFT',
                defaultTemplateId: basicInfo.defaultTemplateId ?? null
            }
        });

        await tx.scale.deleteMany({ where: { testId: id } });
        await tx.question.deleteMany({ where: { section: { testId: id } } });
        await tx.section.deleteMany({ where: { testId: id } });

        if (scales.length > 0) {
            await tx.scale.createMany({
                data: scales.map(s => ({
                    id: s.id,
                    testId: id,
                    type: s.type,
                    name: s.name,
                    description: s.description,
                    maxScore: s.maxScore || null,
                    formula: s.formula || null,
                    levels: s.levels ? JSON.stringify(s.levels) : null
                }))
            });
        }

        for (const section of sections) {
            await tx.section.create({
                data: {
                    id: section.id,
                    testId: id,
                    title: section.title,
                    questions: {
                        create: section.questions.map(q => ({
                            id: q.id,
                            text: q.text,
                            type: q.type,
                            isReversed: Boolean(q.isReversed),
                            options: JSON.stringify(q.options),
                            scoring: JSON.stringify(q.scoring)
                        }))
                    }
                }
            });
        }
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/therapist/dashboard');
    revalidatePath(`/test/${id}`);

    const updated = await fetchTestById(id);
    if (!updated) throw new Error("Nie udało się zapisać i pobrać zaktualizowanego testu.");
    return updated;
}

const generateDefaultTemplate = (test: Test, testId: string): PdfTemplate => {
    return {
        id: crypto.randomUUID(),
        name: `${test.title} - Widok Standardowy`,
        testCanonicalId: test.canonicalId,
        components: [
            { id: crypto.randomUUID(), type: 'Header', title: 'Raport Wyniku Testu', options: { text: `Raport: ${test.title}`, showLogo: true } },
            { id: crypto.randomUUID(), type: 'TestDescription', title: 'Opis testu', options: {} },
            { id: crypto.randomUUID(), type: 'RichText', title: 'Dane Klienta', options: { content: '<b>Dane Klienta</b><br>Identyfikator: {{imie}}<br>Data badania: {{data}}' } },
            { id: crypto.randomUUID(), type: 'ScoresTable', title: 'Zestawienie wyników skal', options: { showDescriptions: true, scaleIds: [] } },
            { id: crypto.randomUUID(), type: 'BarChart', title: 'Profil Wyników', options: { scaleIds: [] } },
            { id: crypto.randomUUID(), type: 'Interpretations', title: 'Szczegółowa interpretacja', options: { scaleIds: [] } },
            { id: crypto.randomUUID(), type: 'AiInterpretation', title: 'Opis zindywidualizowany', options: {} },
            { id: crypto.randomUUID(), type: 'AnswersList', title: 'Udzielone odpowiedzi', options: {} },
            { id: crypto.randomUUID(), type: 'RichText', title: '', options: { content: '<i>Raport wygenerowany automatycznie przez Platformę Real Moment.</i>' } }
        ]
    };
};

export async function createNewTest(testData: Test): Promise<Test> {
    await requireAuth('admin');
    const { id, scales, sections, defaultTemplateId, createdAt, ...basicInfo } = testData;

    // Ensure imported/new scale, section, and question IDs do not collide with existing rows in DB
    const existingScaleCount = scales.length > 0
        ? await prisma.scale.count({ where: { id: { in: scales.map(s => s.id) } } })
        : 0;
    const existingSectionCount = sections.length > 0
        ? await prisma.section.count({ where: { id: { in: sections.map(s => s.id) } } })
        : 0;

    const { remappedScales, remappedSections } = (existingScaleCount > 0 || existingSectionCount > 0)
        ? remapTestEntityIds(scales, sections)
        : { remappedScales: scales, remappedSections: sections };

    await prisma.test.create({
        data: {
            id: id,
            title: basicInfo.title,
            description: basicInfo.description,
            instructions: basicInfo.instructions,
            questionsPerPage: basicInfo.questionsPerPage,
            version: basicInfo.version,
            canonicalId: basicInfo.canonicalId,
            createdAt: new Date(createdAt),
            status: basicInfo.status || 'DRAFT',
            scales: {
                create: remappedScales.map(s => ({
                    id: s.id,
                    type: s.type,
                    name: s.name,
                    description: s.description,
                    maxScore: s.maxScore || null,
                    formula: s.formula || null,
                    levels: s.levels ? JSON.stringify(s.levels) : null
                }))
            },
            sections: {
                create: remappedSections.map(sec => ({
                    id: sec.id,
                    title: sec.title,
                    questions: {
                        create: sec.questions.map(q => ({
                            id: q.id,
                            text: q.text,
                            type: q.type,
                            isReversed: Boolean(q.isReversed),
                            options: JSON.stringify(q.options),
                            scoring: JSON.stringify(q.scoring)
                        }))
                    }
                }))
            }
        }
    });

    const defaultTemplate = generateDefaultTemplate(testData, id);
    await prisma.pdfTemplate.create({
        data: {
            id: defaultTemplate.id,
            name: defaultTemplate.name,
            testId: id,
            components: JSON.stringify(defaultTemplate.components)
        }
    });

    await prisma.test.update({
        where: { id },
        data: { defaultTemplateId: defaultTemplate.id }
    });

    const created = await fetchTestById(id);
    if (!created) throw new Error("Nie udało się utworzyć testu.");
    return created;
}

export async function setDefaultTemplate(testId: string, templateId: string): Promise<void> {
    await requireAuth('admin');
    await prisma.test.update({
        where: { id: testId },
        data: { defaultTemplateId: templateId }
    });
    revalidatePath('/admin/templates');
    revalidatePath(`/test/${testId}`);
}

export async function createDefaultTemplatesForExistingTests(): Promise<{ count: number }> {
    await requireAuth('admin');
    const tests = await prisma.test.findMany({
        where: { defaultTemplateId: null },
        include: { scales: true, sections: { include: { questions: true } } }
    });

    let count = 0;
    for (const test of tests) {
        const serialized = serializeTest(test);
        const template = generateDefaultTemplate(serialized, test.id);

        await prisma.pdfTemplate.create({
            data: {
                id: template.id,
                name: template.name,
                testId: test.id,
                components: JSON.stringify(template.components)
            }
        });

        await prisma.test.update({
            where: { id: test.id },
            data: { defaultTemplateId: template.id }
        });
        count++;
    }

    revalidatePath('/admin/templates');
    return { count };
}

export async function fetchPdfTemplates(): Promise<PdfTemplate[]> {
    await requireAuth();
    const templates = await prisma.pdfTemplate.findMany({
        include: { test: { select: { canonicalId: true } } }
    });
    return templates.map(t => ({
        ...t,
        testCanonicalId: t.test.canonicalId,
        components: JSON.parse(t.components as string)
    }));
}

export async function fetchPdfTemplateById(id: string): Promise<PdfTemplate | null> {
    await requireAuth();
    const template = await prisma.pdfTemplate.findUnique({
        where: { id },
        include: { test: { select: { canonicalId: true } } }
    });
    if (!template) return null;
    return {
        ...template,
        testCanonicalId: template.test.canonicalId,
        components: JSON.parse(template.components as string)
    };
}

export async function savePdfTemplate(template: PdfTemplate): Promise<PdfTemplate> {
    await requireAuth('admin');
    const { id, name, testCanonicalId, components } = template;

    const test = await prisma.test.findFirst({
        where: { canonicalId: testCanonicalId },
        orderBy: { version: 'desc' }
    });

    if (!test) throw new Error("Nie znaleziono powiązanego testu.");

    const saved = await prisma.pdfTemplate.upsert({
        where: { id },
        create: {
            id,
            name,
            components: JSON.stringify(components),
            testId: test.id
        },
        update: {
            name,
            components: JSON.stringify(components),
            testId: test.id
        }
    });

    revalidatePath('/admin/templates');
    return {
        ...saved,
        testCanonicalId: test.canonicalId,
        components: JSON.parse(saved.components as string)
    };
}

export async function deletePdfTemplate(id: string): Promise<void> {
    await requireAuth('admin');
    await prisma.pdfTemplate.delete({ where: { id } });
    revalidatePath('/admin/templates');
}

export async function fetchTestVersions(canonicalId: string): Promise<Test[]> {
    await requireAuth();
    const tests = await prisma.test.findMany({
        where: { canonicalId },
        orderBy: { version: 'desc' },
        include: {
            scales: true,
            sections: {
                include: {
                    questions: true,
                },
            },
        },
    });
    return tests.map(serializeTest);
}

export async function updateTestStatus(testId: string, newStatus: 'DRAFT' | 'PUBLISHED'): Promise<Test> {
    await requireAuth('admin');
    if (newStatus === 'PUBLISHED') {
        const existing = await fetchTestById(testId);
        if (!existing) throw new Error("Nie znaleziono testu.");
        const audit = auditTestIntegrity(existing);
        if (!audit.passed) {
            throw new Error(`Nie można opublikować testu z błędami psychometrycznymi (${audit.errorCount}). Popraw konfigurację w edytorze przed publikacją.`);
        }
    }
    await prisma.test.update({
        where: { id: testId },
        data: { status: newStatus }
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/therapist/dashboard');
    const updated = await fetchTestById(testId);
    if (!updated) throw new Error("Nie udało się zmienić statusu testu.");
    return updated;
}

export async function deleteTest(testId: string): Promise<void> {
    await requireAuth('admin');
    await prisma.$transaction(async (tx) => {
        await tx.accessCode.deleteMany({ where: { testId } });
        await tx.testResult.deleteMany({ where: { testId } });
        await tx.pdfTemplate.deleteMany({ where: { testId } });
        await tx.scale.deleteMany({ where: { testId } });
        await tx.question.deleteMany({ where: { section: { testId } } });
        await tx.section.deleteMany({ where: { testId } });
        await tx.test.delete({ where: { id: testId } });
    });
    revalidatePath('/admin/dashboard');
    revalidatePath('/therapist/dashboard');
    revalidatePath('/admin/templates');
    revalidatePath('/admin/codes');
}
