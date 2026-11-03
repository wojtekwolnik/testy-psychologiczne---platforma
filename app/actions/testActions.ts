'use server';

import { prisma } from '@/lib/prisma';
import type { Test, Question, Scale, Section, PdfTemplate } from '@/components/types';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { requireAuth } from './authActions';

// Helper to parse JSON fields from Prisma to Frontend Types
const serializeTest = (prismaTest: any): Test => {
    return {
        ...prismaTest,
        status: prismaTest.status || 'DRAFT',
        createdAt: prismaTest.createdAt.toISOString(),
        scales: (prismaTest.scales || []).map((s: any) => ({
            ...s,
            maxScore: s.maxScore ?? undefined,
            formula: s.formula ?? undefined,
            levels: s.levels ? JSON.parse(s.levels) : undefined
        })),
        sections: (prismaTest.sections || []).map((sec: any) => ({
            ...sec,
            questions: (sec.questions || []).map((q: any) => ({
                ...q,
                options: JSON.parse(q.options),
                scoring: JSON.parse(q.scoring),
            })),
        })),
    };
};

export async function fetchTests(): Promise<Test[]> {
    await requireAuth();
    const tests = await prisma.test.findMany({
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

    return tests.map(serializeTest);
}

export async function fetchTestById(testId: string): Promise<Test | null> {
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
    return serializeTest(test);
}

/**
 * Public action for test-takers: validates access code and strips out all scoring keys & scale formulas
 * so answers cannot be reverse-engineered in browser DevTools.
 */
export async function fetchPublicTestForClient(testId: string, clientCode: string): Promise<Test | null> {
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

    if (!test) return null;

    return {
        ...test,
        status: (test.status as 'DRAFT' | 'PUBLISHED') || 'PUBLISHED',
        createdAt: test.createdAt.toISOString(),
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
    const { id, scales, sections, ...basicInfo } = testData;

    await prisma.$transaction(async (tx) => {
        await tx.test.update({
            where: { id },
            data: {
                title: basicInfo.title,
                description: basicInfo.description,
                instructions: basicInfo.instructions,
                questionsPerPage: basicInfo.questionsPerPage,
                version: basicInfo.version
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
                            options: JSON.stringify(q.options),
                            scoring: JSON.stringify(q.scoring)
                        }))
                    }
                }
            });
        }
    });

    revalidatePath('/admin/dashboard');
    revalidatePath(`/test/${id}`);

    const updated = await fetchTestById(id);
    if (!updated) throw new Error("Failed to save and retrieve test.");
    return updated;
}

const generateDefaultTemplate = (test: Test, testId: string): PdfTemplate => {
    return {
        id: crypto.randomUUID(),
        name: `${test.title} - Widok Standardowy`,
        testCanonicalId: test.canonicalId,
        components: [
            { id: crypto.randomUUID(), type: 'Header', options: { title: 'Raport Wyniku Testu', subtitle: test.title, showLogo: true } },
            { id: crypto.randomUUID(), type: 'TestDescription', options: {} },
            { id: crypto.randomUUID(), type: 'RichText', options: { content: '## Dane Klienta\n\nIdentyfikator: {{imie}}\nData badania: {{data}}' } },
            { id: crypto.randomUUID(), type: 'ScoresTable', options: { showDescriptions: true } },
            { id: crypto.randomUUID(), type: 'BarChart', options: { title: 'Profil Wyników' } },
            { id: crypto.randomUUID(), type: 'Interpretations', options: { title: 'Szczegółowa interpretacja' } },
            { id: crypto.randomUUID(), type: 'AiInterpretation', options: { title: 'Opis zindywidualizowany' } },
            { id: crypto.randomUUID(), type: 'AnswersList', options: { title: 'Udzielone odpowiedzi' } },
            { id: crypto.randomUUID(), type: 'RichText', options: { content: '---\n*Raport wygenerowany automatycznie przez Platformę Real Moment.*' } }
        ]
    };
};

export async function createNewTest(testData: Test): Promise<Test> {
    await requireAuth('admin');
    const { id, scales, sections, defaultTemplateId, createdAt, ...basicInfo } = testData;

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
                create: scales.map(s => ({
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
                create: sections.map(sec => ({
                    id: sec.id,
                    title: sec.title,
                    questions: {
                        create: sec.questions.map(q => ({
                            id: q.id,
                            text: q.text,
                            type: q.type,
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
    if (!created) throw new Error("Failed to create test.");
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

    if (!test) throw new Error("Linked test not found");

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
    await prisma.test.update({
        where: { id: testId },
        data: { status: newStatus }
    });

    revalidatePath('/admin/dashboard');
    const updated = await fetchTestById(testId);
    if (!updated) throw new Error("Failed to update test status.");
    return updated;
}
