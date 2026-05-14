'use server';

import { prisma } from '@/lib/prisma';
import type { Test, Question, Scale, Section, PdfTemplate } from '@/components/types';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';


// Helper to parse JSON fields from Prisma (SQLite) to Frontend Types
const serializeTest = (prismaTest: any): Test => {
    return {
        ...prismaTest,
        status: prismaTest.status || 'DRAFT', // Default to DRAFT if null (legacy data)
        createdAt: prismaTest.createdAt.toISOString(),
        scales: prismaTest.scales.map((s: any) => ({
            ...s,
            maxScore: s.maxScore ?? undefined,
            formula: s.formula ?? undefined,
            levels: s.levels ? JSON.parse(s.levels) : undefined
        })),
        sections: prismaTest.sections.map((sec: any) => ({
            ...sec,
            questions: sec.questions.map((q: any) => ({
                ...q,
                options: JSON.parse(q.options),
                scoring: JSON.parse(q.scoring),
            })),
        })),
    };
};

export async function fetchTests(): Promise<Test[]> {
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

export async function saveTest(testData: Test, asNewVersion: boolean): Promise<Test> {
    // Logic to save Test. 
    // NOTE: Prisma Update with nested relations is tricky. 
    // Usually simpler to Delete relations and Re-create, or handle meticulously.
    // For Prototype migration, we will use a "Transaction" approach: Update Test, and Upsert/Delete Children?
    // Actually, simplest strategy for "Drafting":
    // If asNewVersion: Create completely new Test with new ID.
    // If update: Update basic fields, and re-create sub-collections (or smart update).

    // Implementation for "Upserting" the whole tree is complex in one go.
    // Let's implement a "Smart Delete-Insert" for sub-collections for now to ensure consistency, 
    // or use `upsert` where IDs match.

    const { id, scales, sections, ...basicInfo } = testData;

    // If new version, generate new IDs? For "asNewVersion", the FE usually handles ID gen call? 
    // Or we do it here. The prompt implies we receive a Test object.

    // Let's try to update the existing test.

    await prisma.$transaction(async (tx) => {
        // 1. Update Test Basic Info
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

        // 2. Handle Scales
        // Ideally we diff changes, but deleting all and recreating is safer for prototype if IDs allow.
        // But we want to preserve IDs if possible for Results linking? 
        // Actually, if we edit a test, do we break old results?
        // For this step, let's assume "Overwrite" of structure for the EDIT mode.

        // Delete existing scales and sections/questions for this test and re-create.
        // This is drastic but ensures clean state vs the FE state.
        await tx.scale.deleteMany({ where: { testId: id } });
        await tx.question.deleteMany({ where: { section: { testId: id } } }); // Cascade? 
        // Wait, deleting section deletes questions via Cascade in Schema?
        // Schema says: Section -> Questions (OnDelete: Cascade). Good.
        await tx.section.deleteMany({ where: { testId: id } });

        // Create Scales
        if (scales.length > 0) {
            await tx.scale.createMany({
                data: scales.map(s => ({
                    id: s.id, // Keep ID from FE
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

        // Create Sections & Questions
        // createMany doesn't support nested relations easily for deep nesting.
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

// Helper to generate a standardized default template
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
            { id: crypto.randomUUID(), type: 'RichText', options: { content: '---\n*Raport wygenerowany automatycznie przez Platformę Testów Psychologicznych.*' } }
        ]
    };
};

export async function createNewTest(testData: Test): Promise<Test> {
    const { id, scales, sections, defaultTemplateId, createdAt, ...basicInfo } = testData;

    // 1. Create the Test first
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

    // 2. Generate and Save Default Template
    const defaultTemplate = generateDefaultTemplate(testData, id);
    await prisma.pdfTemplate.create({
        data: {
            id: defaultTemplate.id,
            name: defaultTemplate.name,
            testId: id,
            components: JSON.stringify(defaultTemplate.components)
        }
    });

    // 3. Update Test with Default Template ID
    await prisma.test.update({
        where: { id },
        data: { defaultTemplateId: defaultTemplate.id }
    });

    const created = await fetchTestById(id);
    if (!created) throw new Error("Failed to create test.");
    return created;
}

export async function setDefaultTemplate(testId: string, templateId: string): Promise<void> {
    await prisma.test.update({
        where: { id: testId },
        data: { defaultTemplateId: templateId }
    });
    revalidatePath('/admin/templates');
    revalidatePath(`/test/${testId}`);
}

export async function createDefaultTemplatesForExistingTests(): Promise<{ count: number }> {
    const tests = await prisma.test.findMany({
        where: { defaultTemplateId: null },
        include: { scales: true, sections: { include: { questions: true } } }
    });

    let count = 0;
    for (const test of tests) {
        // Serialize to match Test type expected by helper (optional, strictly helper needs title/canonicalId)
        const serialized = serializeTest(test); // Only needed if helper uses complex fields, but simpler wrapper works
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
    // Upsert logic
    const { id, name, testCanonicalId, components } = template;

    // Find test to connect
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
    await prisma.pdfTemplate.delete({ where: { id } });
    revalidatePath('/admin/templates');
}

export async function fetchTestVersions(canonicalId: string): Promise<Test[]> {
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
    await prisma.test.update({
        where: { id: testId },
        data: { status: newStatus }
    });

    revalidatePath('/admin/dashboard');
    const updated = await fetchTestById(testId);
    if (!updated) throw new Error("Failed to update test status.");
    return updated;
}

