import bigFiveQuestions from '@/prisma/bigFiveQuestions.json';
import {
    BIG_FIVE_ALL_SCALE_IDS,
    BIG_FIVE_SCALE_DEFINITIONS,
} from '@/lib/interpretationBuilder';

export const BIG_FIVE_CANONICAL_ID = 'big-five-johnson-120';

export const BIG_FIVE_LIKERT_OPTIONS = JSON.stringify([
    { text: 'Bardzo nietrafne', value: 1, id: '1' },
    { text: 'Raczej nietrafne', value: 2, id: '2' },
    { text: 'Ani trafne, ani nietrafne', value: 3, id: '3' },
    { text: 'Raczej trafne', value: 4, id: '4' },
    { text: 'Bardzo trafne', value: 5, id: '5' },
]);

export function buildBigFiveQuestionScoring(
    domain: string,
    facet: number,
    keyed: string,
    scaleIdPrefix: string = ''
): string {
    const domainScaleId = `${scaleIdPrefix}${domain}`;
    const facetScaleId = `${scaleIdPrefix}${domain}${facet}`;
    const pts = keyed === 'plus' ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1];

    return JSON.stringify({
        '1': [
            { scaleId: domainScaleId, points: pts[0] },
            { scaleId: facetScaleId, points: pts[0] },
        ],
        '2': [
            { scaleId: domainScaleId, points: pts[1] },
            { scaleId: facetScaleId, points: pts[1] },
        ],
        '3': [
            { scaleId: domainScaleId, points: pts[2] },
            { scaleId: facetScaleId, points: pts[2] },
        ],
        '4': [
            { scaleId: domainScaleId, points: pts[3] },
            { scaleId: facetScaleId, points: pts[3] },
        ],
        '5': [
            { scaleId: domainScaleId, points: pts[4] },
            { scaleId: facetScaleId, points: pts[4] },
        ],
    });
}

export function getBigFiveSeedScales(scaleIdPrefix: string = '') {
    return BIG_FIVE_ALL_SCALE_IDS.map(code => {
        const def = BIG_FIVE_SCALE_DEFINITIONS[code];
        return {
            id: `${scaleIdPrefix}${def.id}`,
            name: def.name,
            type: 'standard',
            maxScore: def.maxScore,
            levels: JSON.stringify(def.levels),
            description: def.description,
        };
    });
}

export function getBigFiveSeedSections(scaleIdPrefix: string = '') {
    const slices = [
        { title: 'Część 1 (Pytania 1 - 24)', items: bigFiveQuestions.slice(0, 24) },
        { title: 'Część 2 (Pytania 25 - 48)', items: bigFiveQuestions.slice(24, 48) },
        { title: 'Część 3 (Pytania 49 - 72)', items: bigFiveQuestions.slice(48, 72) },
        { title: 'Część 4 (Pytania 73 - 96)', items: bigFiveQuestions.slice(72, 96) },
        { title: 'Część 5 (Pytania 97 - 120)', items: bigFiveQuestions.slice(96, 120) },
    ];

    return slices.map(s => ({
        title: s.title,
        questions: {
            create: s.items.map((q: any) => ({
                text: (q.text || '').trim(),
                type: 'likert-5',
                isReversed: q.keyed === 'minus',
                options: BIG_FIVE_LIKERT_OPTIONS,
                scoring: buildBigFiveQuestionScoring(q.domain, q.facet, q.keyed, scaleIdPrefix),
            })),
        },
    }));
}

/**
 * Idempotently upgrades an existing `big-five-johnson-120` test in PostgreSQL so that:
 * 1. All 5 main domain scales (O, C, E, A, N) AND all 30 facet subscales (O1..N6) exist with Polish descriptions and 3-level interpretations.
 * 2. All 120 questions score both their main domain AND their facet subscale (1..6) and have `isReversed` properly set.
 */
export async function ensureBigFiveTestUpgraded<T extends Record<string, any>>(
    prisma: any,
    prismaTest: T
): Promise<T> {
    if (!prismaTest || prismaTest.canonicalId !== BIG_FIVE_CANONICAL_ID) {
        return prismaTest;
    }

    const existingScales: any[] = prismaTest.scales || [];
    const hasAll35Scales = existingScales.length >= 35;

    // Check if questions already score both domain and facet (2 rules per option) and have isReversed set
    const allDbQuestions: any[] = [];
    for (const sec of prismaTest.sections || []) {
        for (const q of sec.questions || []) {
            allDbQuestions.push(q);
        }
    }

    let questionsNeedUpdate = false;
    if (allDbQuestions.length === 120) {
        const sampleQ = allDbQuestions[0];
        try {
            const parsedScoring = JSON.parse(sampleQ.scoring || '{}');
            const rulesForOpt1 = parsedScoring['1'] || [];
            if (rulesForOpt1.length < 2) {
                questionsNeedUpdate = true;
            }
        } catch {
            questionsNeedUpdate = true;
        }
        const anyReversed = allDbQuestions.some(q => Boolean(q.isReversed));
        if (!anyReversed) {
            questionsNeedUpdate = true;
        }
    }

    if (hasAll35Scales && !questionsNeedUpdate) {
        return prismaTest;
    }

    try {
        // Determine if this test uses bare IDs ('O', 'C', ...) or prefixed IDs (if cloned)
        const usesBareDomainIds = existingScales.some(s =>
            ['O', 'C', 'E', 'A', 'N'].includes(s.id)
        );
        const scaleIdPrefix = usesBareDomainIds ? '' : `${prismaTest.id.slice(0, 6)}-`;

        // Map existing scales by code ('O', 'C', ..., 'N6')
        const existingByCode = new Map<string, any>();
        for (const s of existingScales) {
            if (BIG_FIVE_SCALE_DEFINITIONS[s.id]) {
                existingByCode.set(s.id, s);
                continue;
            }
            const trimmedName = (s.name || '').trim();
            const facetMatch = trimmedName.match(/^([OCEAN][1-6]):/);
            if (facetMatch) {
                existingByCode.set(facetMatch[1], s);
                continue;
            }
            const lower = trimmedName.toLowerCase();
            if (lower === 'otwartość na doświadczenia') existingByCode.set('O', s);
            else if (lower === 'sumienność') existingByCode.set('C', s);
            else if (lower === 'ekstrawersja') existingByCode.set('E', s);
            else if (lower === 'ugodowość') existingByCode.set('A', s);
            else if (lower === 'neurotyczność') existingByCode.set('N', s);
        }

        const codeToScaleId = new Map<string, string>();

        // 1. Upsert all 35 scales (5 domains + 30 facets)
        for (const code of BIG_FIVE_ALL_SCALE_IDS) {
            const def = BIG_FIVE_SCALE_DEFINITIONS[code];
            const existing = existingByCode.get(code);

            if (existing) {
                codeToScaleId.set(code, existing.id);
                await prisma.scale.update({
                    where: { id: existing.id },
                    data: {
                        name: def.name,
                        maxScore: def.maxScore,
                        description: def.description,
                        levels: JSON.stringify(def.levels),
                    },
                });
            } else {
                const candidateId = `${scaleIdPrefix}${def.id}`;
                // Check if candidateId is already taken by another test version
                const collision = await prisma.scale.findUnique({
                    where: { id: candidateId },
                    select: { id: true, testId: true },
                });
                const finalId =
                    collision && collision.testId !== prismaTest.id
                        ? `${prismaTest.id.slice(0, 8)}-${def.id}`
                        : candidateId;

                codeToScaleId.set(code, finalId);
                await prisma.scale.create({
                    data: {
                        id: finalId,
                        testId: prismaTest.id,
                        type: 'standard',
                        name: def.name,
                        maxScore: def.maxScore,
                        description: def.description,
                        levels: JSON.stringify(def.levels),
                    },
                });
            }
        }

        // 2. Build lookup of bigFiveQuestions by normalized text + fallback by index
        const byText = new Map<string, any>();
        for (const qItem of bigFiveQuestions as any[]) {
            byText.set((qItem.text || '').trim().toLowerCase(), qItem);
        }

        for (let idx = 0; idx < allDbQuestions.length; idx++) {
            const dbQ = allDbQuestions[idx];
            const normText = (dbQ.text || '').trim().toLowerCase();
            const refQ =
                byText.get(normText) ||
                (allDbQuestions.length === 120 ? (bigFiveQuestions as any[])[idx] : undefined);
            if (!refQ) continue;

            const domainScaleId = codeToScaleId.get(refQ.domain) || refQ.domain;
            const facetCode = `${refQ.domain}${refQ.facet}`;
            const facetScaleId = codeToScaleId.get(facetCode) || facetCode;
            const pts = refQ.keyed === 'plus' ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1];

            let optionsArr: any[] = [];
            try {
                optionsArr = JSON.parse(dbQ.options || '[]');
            } catch {
                optionsArr = [];
            }
            if (!Array.isArray(optionsArr) || optionsArr.length !== 5) {
                optionsArr = JSON.parse(BIG_FIVE_LIKERT_OPTIONS);
            }

            const newScoring: Record<string, any[]> = {};
            optionsArr.forEach((opt: any, optIdx: number) => {
                const p = pts[optIdx] ?? 3;
                newScoring[opt.id] = [
                    { scaleId: domainScaleId, points: p },
                    { scaleId: facetScaleId, points: p },
                ];
            });

            await prisma.question.update({
                where: { id: dbQ.id },
                data: {
                    text: (refQ.text || dbQ.text).trim(),
                    isReversed: refQ.keyed === 'minus',
                    scoring: JSON.stringify(newScoring),
                },
            });
        }

        // 3. Re-fetch the upgraded test
        const refreshed = await prisma.test.findUnique({
            where: { id: prismaTest.id },
            include: {
                scales: true,
                sections: {
                    include: {
                        questions: true,
                    },
                },
            },
        });
        return refreshed || prismaTest;
    } catch (err) {
        console.error('Non-fatal error upgrading Big Five test in DB:', err);
        return prismaTest;
    }
}
