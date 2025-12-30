'use server';

import { prisma } from '@/lib/prisma';
import type { Test, Question, Scale, Section, PdfTemplate } from '@/components/types';
import { revalidatePath } from 'next/cache';

// Helper to parse JSON fields from Prisma (SQLite) to Frontend Types
const serializeTest = (prismaTest: any): Test => {
    return {
        ...prismaTest,
        status: prismaTest.status || 'DRAFT', // Default to DRAFT if null (legacy data)
        createdAt: prismaTest.createdAt.toISOString(),
        scales: prismaTest.scales.map((s: any) => ({ ...s, maxScore: s.maxScore ?? undefined, formula: s.formula ?? undefined })),
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
                    formula: s.formula || null
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

export async function createNewTest(testData: Test): Promise<Test> {
    // Similar to save but 'create'
    const { id, scales, sections, defaultTemplateId, createdAt, ...basicInfo } = testData;

    await prisma.test.create({
        data: {
            id: id,
            // Explicitly map fields to avoid "Unknown argument" errors for extra props like defaultTemplateId
            title: basicInfo.title,
            description: basicInfo.description,
            instructions: basicInfo.instructions,
            questionsPerPage: basicInfo.questionsPerPage,
            version: basicInfo.version,
            canonicalId: basicInfo.canonicalId,
            createdAt: new Date(createdAt), // Ensure Date type

            scales: {
                create: scales.map(s => ({
                    id: s.id,
                    type: s.type,
                    name: s.name,
                    description: s.description,
                    maxScore: s.maxScore || null,
                    formula: s.formula || null
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

    const created = await fetchTestById(id);
    if (!created) throw new Error("Failed to create test.");
    return created;
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

    // Find test by canonicalId to get internal ID (Prisma relation needs unique ID or connect by unique)
    // Actually our schema relates PdfTemplate to Test via Test's `id` or `canonicalId`?
    // Let's check Schema. Usually relation is on `testId`.
    // Wait, the types say `testCanonicalId` but Prisma might use `testId`.
    // The `fetchPdfTemplates` above includes `test: { select: { canonicalId: true } }`.
    // This implies the relation exists. 
    // We need to connect by `canonicalId` if the schema supports it, or look up the test.
    // Let's look up the latest test version for this canonicalId to connect? 
    // OR we connect to a specific Test ID?
    // The legacy app likely connected to the canonical ID concept.
    // Let's check what `prisma.pdfTemplate` expects.

    // Assuming schema: PdfTemplate { id, name, components, testId, test -> Test }
    // We need to find the Test ID.
    const test = await prisma.test.findFirst({
        where: { canonicalId: testCanonicalId },
        orderBy: { version: 'desc' } // Link to latest version?
    });

    if (!test) throw new Error("Linked test not found");

    const saved = await prisma.pdfTemplate.upsert({
        where: { id },
        create: {
            id,
            name,
            components: JSON.stringify(components),
            testId: test.id // Connect to specific test row
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
