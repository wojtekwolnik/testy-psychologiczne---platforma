import assert from 'node:assert/strict';
import {
    generateEqualThresholds,
    calculateScaleScoreBounds,
    getNormalizedBigFiveScaleData,
    resolveScaleLevel,
    buildKeyInterpretation,
    isBigFiveFacetScale,
    getBigFiveFacetParentDomain,
    getBigFiveDomainCode,
} from '../lib/interpretationBuilder';
import { calculateTestScores, evaluateFormula } from '../lib/scoring/scoreCalculator';
import { auditTestIntegrity } from '../lib/scoring/testAuditor';
import { analyzeResponseQuality } from '../lib/scoring/responseQualityAnalyzer';
import { getBigFiveSeedScales, getBigFiveSeedSections } from '../lib/bigFiveSync';
import {
    getDass42SeedScales,
    getDass42SeedSections,
    getDass42TestCreateData,
} from '../lib/dass42Sync';
import type { Scale, Section, Test } from '../components/types';

console.log('=== [WARSTWA 1] Testy jednostkowe silnika liczącego, audytora i kluczy testów ===\n');

// 1. Test czystego silnika liczącego (calculateTestScores & evaluateFormula)
{
    assert.equal(evaluateFormula('{A} + {B} * 2', { A: 10, B: 5 }), 20);
    assert.equal(evaluateFormula('({DASS_D} + {DASS_A} + {DASS_S})', { DASS_D: 12, DASS_A: 8, DASS_S: 15 }), 35);

    const mockTest = {
        scales: [
            { id: 'S1', type: 'standard' as const },
            { id: 'S2', type: 'standard' as const },
            { id: 'TOTAL', type: 'calculated' as const, formula: '{S1} + {S2}' },
        ],
        sections: [
            {
                questions: [
                    {
                        id: 'q1',
                        scoring: {
                            o1: [{ scaleId: 'S1', points: 3 }, { scaleId: 'S2', points: 1 }],
                            o2: [{ scaleId: 'S1', points: 0 }, { scaleId: 'S2', points: 4 }],
                        },
                    },
                    {
                        id: 'q2',
                        scoring: {
                            o1: [{ scaleId: 'S1', points: 2 }],
                            o2: [{ scaleId: 'S1', points: 5 }],
                        },
                    },
                ],
            },
        ],
    };

    const scores = calculateTestScores(mockTest, { q1: ['o1'], q2: ['o2'] });
    assert.equal(scores.S1, 8, 'S1 powinno wynosić 3 + 5 = 8');
    assert.equal(scores.S2, 1, 'S2 powinno wynosić 1');
    assert.equal(scores.TOTAL, 9, 'Skala obliczana TOTAL powinna wynosić S1 + S2 = 9');

    assert.throws(
        () => calculateTestScores(mockTest, { q1: ['o1'] }),
        /Proszę odpowiedzieć na wszystkie pytania/,
        'Powinien rzucić błąd przy brakującej odpowiedzi'
    );
    console.log('✅ [1/6] Czysty silnik liczący (calculateTestScores + evaluateFormula): działa bezbłędnie.');
}

// 2. Test generatora N progów i granic punktowych
{
    for (const count of [2, 3, 4, 5, 6, 8, 10]) {
        const levels = generateEqualThresholds(count, 120, 24);
        assert.equal(levels.length, count);
        assert.equal(levels[0].minScore, 24);
        assert.equal(levels[count - 1].maxScore, 120);
        for (let i = 1; i < levels.length; i++) {
            assert.equal(levels[i].minScore, levels[i - 1].maxScore + 1);
        }
    }
    console.log('✅ [2/6] Generator N progów (generateEqualThresholds): pełna ciągłość przedziałów.');
}

// 3. Audyt spójności Wielkiej Piątki (IPIP-NEO-PI-R 120) + pełna symulacja 120 odpowiedzi
{
    const bfScalesRaw = getBigFiveSeedScales();
    const bfSectionsRaw = getBigFiveSeedSections();

    const bfTest: Test = {
        id: 'test-bf-120',
        canonicalId: 'big-five-johnson-120',
        version: 1,
        title: 'Wielka Piątka (IPIP-NEO-PI-R 120)',
        description: 'Opis testu Wielkiej Piątki',
        instructions: 'Instrukcja badania Wielkiej Piątki',
        status: 'PUBLISHED',
        questionsPerPage: 24,
        defaultTemplateId: null,
        createdAt: new Date().toISOString(),
        scales: bfScalesRaw.map(s => ({
            id: s.id,
            name: s.name,
            type: 'standard',
            maxScore: s.maxScore,
            description: s.description,
            levels: JSON.parse(s.levels),
        })),
        sections: bfSectionsRaw.map((sec, idx) => ({
            id: `sec-${idx}`,
            title: sec.title,
            questions: sec.questions.create.map((q, qIdx) => ({
                id: `bf-q-${idx}-${qIdx}`,
                text: q.text,
                type: q.type as any,
                isReversed: q.isReversed,
                options: JSON.parse(q.options),
                scoring: JSON.parse(q.scoring),
            })),
        })),
    };

    const bfAudit = auditTestIntegrity(bfTest);
    assert.equal(bfAudit.passed, true, `Wielka Piątka nie przeszła audytu: ${JSON.stringify(bfAudit.issues)}`);
    assert.equal(bfAudit.errorCount, 0);
    assert.equal(bfAudit.warningCount, 0);
    assert.equal(bfAudit.questionCount, 120);
    assert.equal(bfAudit.scaleCount, 35);

    // Sprawdzenie, że suma 6 podskal (np. O1..O6) zawsze równa się wynikowi domeny głównej (O)
    const minSim = bfAudit.simulationSummary!.minScores;
    const maxSim = bfAudit.simulationSummary!.maxScores;
    for (const domain of ['O', 'C', 'E', 'A', 'N']) {
        const facetSumMin = [1, 2, 3, 4, 5, 6].reduce((acc, idx) => acc + minSim[`${domain}${idx}`], 0);
        const facetSumMax = [1, 2, 3, 4, 5, 6].reduce((acc, idx) => acc + maxSim[`${domain}${idx}`], 0);
        assert.equal(minSim[domain], facetSumMin, `Suma podskal ${domain}1..${domain}6 musi równać się wynikowi domeny ${domain}`);
        assert.equal(maxSim[domain], facetSumMax, `Suma podskal ${domain}1..${domain}6 musi równać się wynikowi domeny ${domain}`);
    }
    console.log('✅ [3/6] Audyt i symulacja Wielkiej Piątki (120 pytań, 5 domen + 30 podskal): 0 błędów, 0 ostrzeżeń.');
}

// 4. Audyt spójności polskiej adaptacji DASS-42 + pełna symulacja 42 odpowiedzi
{
    const dassCreate = getDass42TestCreateData();
    const dassScalesRaw = getDass42SeedScales();
    const dassSectionsRaw = getDass42SeedSections();

    const dassTest: Test = {
        id: 'test-dass-42',
        canonicalId: dassCreate.canonicalId,
        version: 1,
        title: dassCreate.title,
        description: dassCreate.description,
        instructions: dassCreate.instructions,
        status: 'PUBLISHED',
        questionsPerPage: 14,
        defaultTemplateId: null,
        createdAt: new Date().toISOString(),
        scales: dassScalesRaw.map(s => ({
            id: s.id,
            name: s.name,
            type: 'standard',
            maxScore: s.maxScore,
            description: s.description,
            levels: JSON.parse(s.levels),
        })),
        sections: dassSectionsRaw.map((sec, idx) => ({
            id: `dass-sec-${idx}`,
            title: sec.title,
            questions: sec.questions.create.map((q, qIdx) => ({
                id: `dass-q-${idx}-${qIdx}`,
                text: q.text,
                type: q.type as any,
                isReversed: q.isReversed,
                options: JSON.parse(q.options),
                scoring: JSON.parse(q.scoring),
            })),
        })),
    };

    const dassAudit = auditTestIntegrity(dassTest);
    assert.equal(dassAudit.passed, true, `DASS-42 nie przeszedł audytu: ${JSON.stringify(dassAudit.issues)}`);
    assert.equal(dassAudit.errorCount, 0);
    assert.equal(dassAudit.warningCount, 0);
    assert.equal(dassAudit.questionCount, 42);
    assert.equal(dassAudit.scaleCount, 4);

    // Dla odpowiedzi '0' wszystkie skale DASS = 0; dla odpowiedzi '3' D=42, A=42, S=42, TOTAL=126
    assert.deepEqual(dassAudit.simulationSummary!.minScores, {
        DASS_D: 0,
        DASS_A: 0,
        DASS_S: 0,
        DASS_TOTAL: 0,
    });
    assert.deepEqual(dassAudit.simulationSummary!.maxScores, {
        DASS_D: 42,
        DASS_A: 42,
        DASS_S: 42,
        DASS_TOTAL: 126,
    });
    console.log('✅ [4/6] Audyt i symulacja DASS-42 (42 pytania, 4 skale, 6 progów stenowych): 0 błędów, 0 ostrzeżeń.');
}

// 5. Test wykrywania celowych błędów przez audytora (testAuditor negative test)
{
    const brokenTest: Test = {
        id: 'broken-1',
        canonicalId: 'custom-broken',
        version: 1,
        title: 'Test z błędami',
        description: '',
        instructions: '',
        status: 'DRAFT',
        questionsPerPage: 10,
        defaultTemplateId: null,
        createdAt: new Date().toISOString(),
        scales: [
            {
                id: 'S1',
                name: 'Skala z luką w progach',
                type: 'standard',
                maxScore: 10,
                description: '',
                levels: [
                    { id: 'l1', name: 'Niski', minScore: 0, maxScore: 4, color: 'green' },
                    { id: 'l2', name: 'Wysoki', minScore: 7, maxScore: 10, color: 'red' }, // Luka 5..6!
                ],
            },
        ],
        sections: [
            {
                id: 'sec1',
                title: 'Sekcja 1',
                questions: [
                    {
                        id: 'q1',
                        text: 'Pytanie bez przypisanej skali',
                        type: 'yes-no',
                        options: [
                            { id: '1', text: 'Tak' },
                            { id: '2', text: 'Nie' },
                        ],
                        scoring: {},
                    },
                ],
            },
        ],
    };

    const brokenAudit = auditTestIntegrity(brokenTest);
    assert.equal(brokenAudit.passed, false, 'Audytor musi wykryć błędy w uszkodzonym teście');
    assert.ok(brokenAudit.issues.some(i => i.message.includes('luka między progiem')), 'Musi wykryć lukę między progami 4 a 7');
    assert.ok(brokenAudit.issues.some(i => i.message.includes('nie ma przypisanej żadnej skali')), 'Musi wykryć pytanie bez skali');
    console.log('✅ [5/6] Wykrywanie luk w progach i pytań bez skali przez audytora (auditTestIntegrity): działa bezbłędnie.');
}

// 6. Pełny przebieg wszystkich możliwych wartości punktowych (0..maxScore) dla wszystkich 39 skal wbudowanych
{
    const allScales = [...getBigFiveSeedScales(), ...getDass42SeedScales()].map(s => ({
        id: s.id,
        name: s.name,
        maxScore: s.maxScore,
        levels: JSON.parse(s.levels),
    }));

    for (const scale of allScales) {
        for (let score = 0; score <= scale.maxScore; score++) {
            const resolved = resolveScaleLevel(score, scale);
            assert.ok(resolved.label && resolved.label !== 'Brak danych', `Brak progu dla ${scale.id} przy wyniku ${score}`);
            assert.ok(resolved.description && resolved.description.length > 10, `Brak opisu interpretacyjnego dla ${scale.id} przy wyniku ${score}`);
        }
    }
    console.log('✅ [6/7] Ciągłość wszystkich 39 skal (Wielka Piątka + DASS-42) dla każdego możliwego wyniku całkowitego: 100% pokrycia.');
}

// 7. Test analizatora stylu i spójności odpowiedzi (analyzeResponseQuality)
{
    const dassCreate = getDass42TestCreateData();
    const dassScalesRaw = getDass42SeedScales();
    const dassSectionsRaw = getDass42SeedSections();

    const dassTest: Test = {
        id: 'test-dass-42',
        canonicalId: dassCreate.canonicalId,
        version: 1,
        title: dassCreate.title,
        description: dassCreate.description,
        instructions: dassCreate.instructions,
        status: 'PUBLISHED',
        questionsPerPage: 14,
        defaultTemplateId: null,
        createdAt: new Date().toISOString(),
        scales: dassScalesRaw.map(s => ({
            id: s.id,
            name: s.name,
            type: 'standard',
            maxScore: s.maxScore,
            description: s.description,
            levels: JSON.parse(s.levels),
        })),
        sections: dassSectionsRaw.map((sec, idx) => ({
            id: `dass-sec-${idx}`,
            title: sec.title,
            questions: sec.questions.create.map((q, qIdx) => ({
                id: `dass-q-${idx}-${qIdx}`,
                text: q.text,
                type: q.type as any,
                isReversed: q.isReversed,
                options: JSON.parse(q.options),
                scoring: JSON.parse(q.scoring),
            })),
        })),
    };

    const allQ = dassTest.sections.flatMap(s => s.questions);
    const straightLineAnswers: Record<string, string[]> = {};
    allQ.forEach(q => {
        straightLineAnswers[q.id] = [q.options[0].id];
    });

    const straightReport = analyzeResponseQuality(dassTest, straightLineAnswers);
    assert.equal(straightReport.maxLongstring, 42);
    assert.equal(straightReport.overallStatus, 'attention');
    assert.ok(straightReport.warnings.some(w => w.id === 'longstring'));

    const variedAnswers: Record<string, string[]> = {};
    allQ.forEach((q, idx) => {
        const optIdx = idx % 3 === 0 ? 1 : idx % 3 === 1 ? 2 : 0;
        variedAnswers[q.id] = [q.options[optIdx].id];
    });
    const variedReport = analyzeResponseQuality(dassTest, variedAnswers);
    assert.equal(variedReport.overallStatus, 'optimal');
    assert.ok(variedReport.maxLongstring <= 2);

    console.log('✅ [7/7] Analizator stylu i jakości odpowiedzi (analyzeResponseQuality): wykrywanie longstring i profilu spójnego działa bezbłędnie.');
}

console.log('\n🎉 WSZYSTKIE TESTY JEDNOSTKOWE I AUDYTOWE ZALICZONE (7/7)!');
