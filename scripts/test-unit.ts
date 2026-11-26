import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
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
import { generatePdf, generateComparisonPdf, normalizeRichTextMarkdownToHtml } from '../lib/pdf/pdfGenerator';
import { formatAiTextToHtml } from '../components/report/ReportCharts';
import { encryptSecret, decryptSecret } from '../app/services/settingsService';
import { hexToRgb, getLuminance, getContrastRatio, getWcagRating, getContrastingTextColor } from '../utils/colorUtils';
import {
    remapTestEntityIds,
    sanitizeTestForPublicClient,
    escapeCsvCell,
    buildCsvContent,
    createAccessCodeString,
    normalizeAccessCodeInput,
} from '../lib/testUtils';
import { getBigFiveSeedScales, getBigFiveSeedSections } from '../lib/bigFiveSync';
import {
    getDass42SeedScales,
    getDass42SeedSections,
    getDass42TestCreateData,
} from '../lib/dass42Sync';
import type { Scale, Section, Test, TestResult, PdfTemplate, BrandingSettings } from '../components/types';

console.log('=== [WARSTWA 1] Testy jednostkowe silnika liczącego, audytora, PDF i narzędzi (21/21) ===\n');

function buildBigFiveTestFixture(): Test {
    const bfScalesRaw = getBigFiveSeedScales();
    const bfSectionsRaw = getBigFiveSeedSections();
    return {
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
}

function buildDass42TestFixture(): Test {
    const dassCreate = getDass42TestCreateData();
    const dassScalesRaw = getDass42SeedScales();
    const dassSectionsRaw = getDass42SeedSections();
    return {
        id: 'test-dass-42',
        canonicalId: dassCreate.canonicalId,
        version: 1,
        title: dassCreate.title,
        description: dassCreate.description,
        instructions: dassCreate.instructions,
        status: 'PUBLISHED',
        questionsPerPage: 14,
        defaultTemplateId: 'tpl-dass',
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
}

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
    console.log('✅ [1/21] Czysty silnik liczący (calculateTestScores + evaluateFormula): działa bezbłędnie.');
}

// 2. Przypadki brzegowe silnika liczącego: multiple-select, łańcuchy formuł, dzielenie przez zero, odporność na błędną składnię
{
    assert.equal(evaluateFormula('{A} / 0', { A: 10 }), 0, 'Dzielenie przez zero (Infinity) musi bezpiecznie zwrócić 0');
    assert.equal(evaluateFormula('invalid_syntax(((', { A: 10 }), 0, 'Błędna składnia formuły musi zwrócić 0 bez wyjątku');
    assert.equal(evaluateFormula('{NIEISTNIEJACA} + 5', {}), 5, 'Brakująca skala w słowniku przyjmuje 0');

    const multiTest = {
        scales: [
            { id: 'S_MULTI', type: 'standard' as const },
            { id: 'S_STEP1', type: 'calculated' as const, formula: '{S_MULTI} * 2' },
            { id: 'S_STEP2', type: 'calculated' as const, formula: '{S_STEP1} + 10' },
        ],
        sections: [
            {
                questions: [
                    {
                        id: 'qm1',
                        scoring: {
                            a: [{ scaleId: 'S_MULTI', points: 2 }],
                            b: [{ scaleId: 'S_MULTI', points: 5 }],
                            c: [{ scaleId: 'S_MULTI', points: -1 }],
                        },
                    },
                ],
            },
        ],
    };

    const multiScores = calculateTestScores(multiTest, { qm1: ['a', 'b', 'c'] });
    assert.equal(multiScores.S_MULTI, 6, 'Suma zaznaczonych opcji wielokrotnego wyboru 2 + 5 - 1 = 6');
    assert.equal(multiScores.S_STEP1, 12, 'Pierwsza skala obliczana 6 * 2 = 12');
    assert.equal(multiScores.S_STEP2, 22, 'Kaskadowa skala obliczana zależna od innej obliczanej: 12 + 10 = 22');
    console.log('✅ [2/21] Przypadki brzegowe silnika liczącego (multiple-select, kaskadowe formuły, dzielenie przez zero): działają bezbłędnie.');
}

// 3. Test generatora N progów i granic punktowych (calculateScaleScoreBounds)
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

    const boundsSections: Section[] = [
        {
            id: 's1',
            title: 'Sekcja',
            questions: [
                {
                    id: 'q1',
                    text: 'Single choice',
                    type: 'multiple-choice',
                    options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }],
                    scoring: { '1': [{ scaleId: 'SC', points: 1 }], '2': [{ scaleId: 'SC', points: 5 }] },
                },
                {
                    id: 'q2',
                    text: 'Multiple select',
                    type: 'multiple-select',
                    options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }, { id: '3', text: 'C' }],
                    scoring: {
                        '1': [{ scaleId: 'SC', points: 3 }],
                        '2': [{ scaleId: 'SC', points: 4 }],
                        '3': [{ scaleId: 'SC', points: -2 }],
                    },
                },
            ],
        },
    ];
    const bounds = calculateScaleScoreBounds(boundsSections, 'SC');
    assert.equal(bounds.questionCount, 2);
    assert.equal(bounds.minPossible, 1 + (-2)); // -1
    assert.equal(bounds.maxPossible, 5 + (3 + 4)); // 12
    console.log('✅ [3/21] Generator N progów (generateEqualThresholds) i granice punktowe (calculateScaleScoreBounds): pełna ciągłość.');
}

// 4. Audyt spójności Wielkiej Piątki (IPIP-NEO-PI-R 120) + pełna symulacja 120 odpowiedzi
{
    const bfTest = buildBigFiveTestFixture();
    const bfAudit = auditTestIntegrity(bfTest);
    assert.equal(bfAudit.passed, true, `Wielka Piątka nie przeszła audytu: ${JSON.stringify(bfAudit.issues)}`);
    assert.equal(bfAudit.errorCount, 0);
    assert.equal(bfAudit.warningCount, 0);
    assert.equal(bfAudit.questionCount, 120);
    assert.equal(bfAudit.scaleCount, 35);

    const minSim = bfAudit.simulationSummary!.minScores;
    const maxSim = bfAudit.simulationSummary!.maxScores;
    for (const domain of ['O', 'C', 'E', 'A', 'N']) {
        const facetSumMin = [1, 2, 3, 4, 5, 6].reduce((acc, idx) => acc + minSim[`${domain}${idx}`], 0);
        const facetSumMax = [1, 2, 3, 4, 5, 6].reduce((acc, idx) => acc + maxSim[`${domain}${idx}`], 0);
        assert.equal(minSim[domain], facetSumMin, `Suma podskal ${domain}1..${domain}6 musi równać się wynikowi domeny ${domain}`);
        assert.equal(maxSim[domain], facetSumMax, `Suma podskal ${domain}1..${domain}6 musi równać się wynikowi domeny ${domain}`);
    }
    console.log('✅ [4/21] Audyt i symulacja Wielkiej Piątki (120 pytań, 5 domen + 30 podskal): 0 błędów, 0 ostrzeżeń.');
}

// 5. Audyt spójności polskiej adaptacji DASS-42 + pełna symulacja 42 odpowiedzi
{
    const dassTest = buildDass42TestFixture();
    const dassAudit = auditTestIntegrity(dassTest);
    assert.equal(dassAudit.passed, true, `DASS-42 nie przeszedł audytu: ${JSON.stringify(dassAudit.issues)}`);
    assert.equal(dassAudit.errorCount, 0);
    assert.equal(dassAudit.warningCount, 0);
    assert.equal(dassAudit.questionCount, 42);
    assert.equal(dassAudit.scaleCount, 4);

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
    console.log('✅ [5/21] Audyt i symulacja DASS-42 (42 pytania, 4 skale, 6 progów stenowych): 0 błędów, 0 ostrzeżeń.');
}

// 6. Kompleksowy test wszystkich reguł wykrywania błędów w audytorze (auditTestIntegrity)
{
    const brokenTest: Test = {
        id: 'broken-1',
        canonicalId: 'custom-broken',
        version: 1,
        title: '', // Błąd: brak tytułu
        description: '',
        instructions: '', // Ostrzeżenie: brak instrukcji
        status: 'DRAFT',
        questionsPerPage: 10,
        defaultTemplateId: null,
        createdAt: new Date().toISOString(),
        scales: [
            {
                id: 'S_GAP',
                name: 'Skala z luką w progach i błędnym maxScore',
                type: 'standard',
                maxScore: 99, // Ostrzeżenie: różni się od 10
                description: '',
                levels: [
                    { id: 'l1', name: 'Niski', minScore: 0, maxScore: 4, color: 'green' },
                    { id: 'l2', name: 'Wysoki', minScore: 7, maxScore: 10, color: 'red' }, // Luka 5..6
                ],
            },
            {
                id: 'S_OVERLAP',
                name: 'Skala z nakładającymi się progami',
                type: 'standard',
                maxScore: 10,
                description: '',
                levels: [
                    { id: 'o1', name: 'Niski', minScore: 0, maxScore: 6, color: 'green' },
                    { id: 'o2', name: 'Wysoki', minScore: 5, maxScore: 10, color: 'red' }, // Nakładanie 5..6
                ],
            },
            {
                id: 'S_ORPHAN',
                name: 'Martwa skala bez pytań',
                type: 'standard',
                maxScore: 10,
                description: '',
                levels: [],
            },
            {
                id: 'S_BAD_CALC',
                name: 'Skala obliczana z nieistniejącą referencją',
                type: 'calculated',
                formula: '{S_GAP} + {WIDMO_SKALA}',
                description: '',
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
                    {
                        id: 'q2',
                        text: 'Pytanie ze skalą',
                        type: 'yes-no',
                        options: [
                            { id: '1', text: 'Tak' },
                            { id: '2', text: 'Nie' },
                        ],
                        scoring: {
                            '1': [{ scaleId: 'S_GAP', points: 0 }, { scaleId: 'S_OVERLAP', points: 0 }],
                            '2': [{ scaleId: 'S_GAP', points: 10 }, { scaleId: 'S_OVERLAP', points: 10 }],
                        },
                    },
                ],
            },
        ],
    };

    const brokenAudit = auditTestIntegrity(brokenTest);
    assert.equal(brokenAudit.passed, false, 'Audytor musi odrzucić uszkodzony test');
    const msgs = brokenAudit.issues.map(i => i.message).join(' | ');
    assert.ok(msgs.includes('Brak tytułu testu'), 'Wykrywa brak tytułu');
    assert.ok(msgs.includes('Brak instrukcji'), 'Wykrywa brak instrukcji');
    assert.ok(msgs.includes('luka między progiem'), 'Wykrywa lukę w progach');
    assert.ok(msgs.includes('nakładające się progi'), 'Wykrywa nakładające się progi');
    assert.ok(msgs.includes('nie ma przypisanego ani jednego pytania'), 'Wykrywa martwą skalę bez pytań');
    assert.ok(msgs.includes('zadeklarowane maxScore (99) różni się'), 'Wykrywa rozjazd maxScore');
    assert.ok(msgs.includes('odwołuje się do nieistniejącej skali {WIDMO_SKALA}'), 'Wykrywa błędną referencję w formule');
    assert.ok(msgs.includes('nie ma przypisanej żadnej skali'), 'Wykrywa pytanie bez skali');
    console.log('✅ [6/21] Wszystkie reguły walidacji audytora (luki, nakładanie progów, martwe skale, błędne formuły): działają bezbłędnie.');
}

// 7. Pełny przebieg wszystkich możliwych wartości punktowych (0..maxScore) dla wszystkich 39 skal wbudowanych
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
    console.log('✅ [7/21] Ciągłość wszystkich 39 skal (Wielka Piątka + DASS-42) dla każdego możliwego wyniku całkowitego: 100% pokrycia.');
}

// 8. Generator opisów interpretacyjnych z klucza (buildKeyInterpretation) dla Wielkiej Piątki i DASS-42
{
    const bfTest = buildBigFiveTestFixture();
    const midScores: Record<string, number> = {};
    bfTest.scales.forEach(s => {
        midScores[s.id] = isBigFiveFacetScale(s) ? 14 : 84;
    });
    const bfHtml = buildKeyInterpretation(bfTest, midScores);
    assert.ok(bfHtml.includes('PODSUMOWANIE PROFILU WYNIKÓW'), 'Musi zawierać nagłówek podsumowania');
    assert.ok(bfHtml.includes('SZCZEGÓŁOWA INTERPRETACJA WYMIARÓW WG KLUCZA TESTU'), 'Musi zawierać sekcję szczegółową');
    assert.ok(bfHtml.includes('Podskale (aspekty wymiaru'), 'Musi zagnieżdżać podskale pod domenami Wielkiej Piątki');
    assert.ok(bfHtml.includes('Wyobraźnia'), 'Musi zawierać podskale O1..N6');

    const dassTest = buildDass42TestFixture();
    const dassHtml = buildKeyInterpretation(dassTest, { DASS_D: 22, DASS_A: 16, DASS_S: 28, DASS_TOTAL: 66 });
    assert.ok(dassHtml.includes('Skala depresji'), 'Opis DASS-42 musi zawierać Skalę depresji');
    assert.ok(dassHtml.includes('Skala lęku'), 'Opis DASS-42 musi zawierać Skalę lęku');
    assert.ok(dassHtml.includes('Skala stresu'), 'Opis DASS-42 musi zawierać Skalę stresu');
    assert.equal(buildKeyInterpretation({ title: 'Pusty', scales: [] }, {}), '', 'Pusty test zwraca pusty string');
    console.log('✅ [8/21] Generator opisów z klucza (buildKeyInterpretation: hierarchia Wielkiej Piątki + DASS-42): działa bezbłędnie.');
}

// 9. Analizator stylu odpowiedzi — Longstring i profil zrównoważony (DASS-42)
{
    const dassTest = buildDass42TestFixture();
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
    console.log('✅ [9/21] Analizator stylu odpowiedzi — detekcja Longstring oraz profilu optymalnego: działa bezbłędnie.');
}

// 10. Analizator stylu odpowiedzi — Tendencja centralna, Styl skrajny oraz Niespójność pytań wprost vs odwróconych (Wielka Piątka)
{
    const bfTest = buildBigFiveTestFixture();
    const allBfQ = bfTest.sections.flatMap(s => s.questions);

    // A) Tendencja centralna + potakiwanie: wybieranie ciągle środkowej opcji (indeks 2 z 5) lub zawsze ostatniej opcji (indeks 4 z 5)
    const middleAnswers: Record<string, string[]> = {};
    const alwaysAgreeAnswers: Record<string, string[]> = {};
    const alternatingExtremeAnswers: Record<string, string[]> = {};

    allBfQ.forEach((q, idx) => {
        middleAnswers[q.id] = [q.options[2].id]; // zawsze "3 - Trudno powiedzieć"
        alwaysAgreeAnswers[q.id] = [q.options[4].id]; // zawsze "5 - Całkowicie się zgadzam" (sprzeczne na pytaniach odwróconych!)
        alternatingExtremeAnswers[q.id] = [q.options[idx % 2 === 0 ? 0 : 4].id]; // naprzemiennie 1 i 5 (brak longstring, ale 100% skrajnych)
    });

    const middleReport = analyzeResponseQuality(bfTest, middleAnswers);
    assert.equal(middleReport.neutralMiddlePercent, 100);
    assert.ok(middleReport.warnings.some(w => w.id === 'central-tendency'), 'Musi wykryć tendencję centralną');

    const agreeReport = analyzeResponseQuality(bfTest, alwaysAgreeAnswers);
    assert.ok(agreeReport.reversedInconsistencyScales.length > 0, 'Musi wykryć niespójność między pytaniami wprost a odwróconymi');
    assert.ok(agreeReport.warnings.some(w => w.id === 'reversed-inconsistency'), 'Musi wygenerować ostrzeżenie reversed-inconsistency');

    const extremeReport = analyzeResponseQuality(bfTest, alternatingExtremeAnswers);
    assert.equal(extremeReport.extremePercent, 100);
    assert.equal(extremeReport.maxLongstring, 1, 'Naprzemienne skrajne odpowiedzi mają longstring = 1');
    assert.ok(extremeReport.warnings.some(w => w.id === 'extreme-responding'), 'Musi wykryć styl skrajnych odpowiedzi');
    console.log('✅ [10/21] Analizator stylu odpowiedzi — Tendencja centralna, Styl skrajny i Niespójność par odwróconych: działają bezbłędnie.');
}

// 11. Szyfrowanie i deszyfrowanie sekretów AES-256-GCM (encryptSecret / decryptSecret)
{
    const rawSecret = 'haslo-smtp-ZażółćGęśląJaźń-123!@#';
    const encrypted1 = encryptSecret(rawSecret);
    const encrypted2 = encryptSecret(rawSecret);

    assert.ok(encrypted1.startsWith('enc:v1:'), 'Zaszyfrowany sekret musi mieć prefiks enc:v1:');
    assert.notEqual(encrypted1, encrypted2, 'Losowy IV musi dawać inny szyfrogram przy każdym wywołaniu');
    assert.equal(decryptSecret(encrypted1), rawSecret, 'Odszyfrowany sekret musi być identyczny z oryginałem');
    assert.equal(encryptSecret(encrypted1), encrypted1, 'Ponowne wywołanie encryptSecret nie może podwójnie szyfrować');
    assert.equal(decryptSecret('jawny-tekst'), 'jawny-tekst', 'Niezaszyfrowany tekst powinien zostać zwrócony bez zmian');
    assert.equal(decryptSecret('enc:v1:0000:1111:2222'), '', 'Uszkodzony lub obcy szyfrogram musi bezpiecznie zwrócić pusty string bez wyjątku');
    console.log('✅ [11/21] Szyfrowanie AES-256-GCM (encryptSecret / decryptSecret + losowy IV + cichy fallback klucza): działa bezbłędnie.');
}

// 12. Konwersja tekstu AI i Markdown do HTML (formatAiTextToHtml & normalizeRichTextMarkdownToHtml)
{
    const mdSample = '```html\n**Wniosek główny:** Badany wykazuje *umiarkowane* napięcie.\n\nDrugi akapit\nz nową linią.\n```';
    const htmlOut = formatAiTextToHtml(mdSample);
    assert.ok(!htmlOut.includes('```'), 'Musi usuwać znaczniki bloków kodu markdown');
    assert.ok(htmlOut.includes('<strong>Wniosek główny:</strong>'), 'Musi konwertować ** na <strong>');
    assert.ok(htmlOut.includes('<em>umiarkowane</em>'), 'Musi konwertować * na <em>');
    assert.ok(htmlOut.includes('<p>Drugi akapit<br>z nową linią.</p>'), 'Musi dzielić akapity i łamania linii');

    const alreadyHtml = '<p>Gotowy <strong>HTML</strong></p>';
    assert.equal(formatAiTextToHtml(alreadyHtml), alreadyHtml, 'Gotowy HTML nie może być psuty');

    assert.equal(
        normalizeRichTextMarkdownToHtml('## Dane Klienta\n\nIdentyfikator: **123**\n---'),
        '<b>Dane Klienta</b><br><br>Identyfikator: <b>123</b><br>'
    );
    console.log('✅ [12/21] Konwersja Markdown i odpowiedzi AI do HTML (formatAiTextToHtml + normalizeRichTextMarkdownToHtml): działa bezbłędnie.');
}

// 13. Narzędzia kolorystyczne i kontrastowe WCAG (utils/colorUtils.ts)
{
    assert.deepEqual(hexToRgb('#314293'), { r: 49, g: 66, b: 147 });
    assert.equal(hexToRgb('nie-kolor'), null);
    assert.equal(getContrastingTextColor('#14161d'), '#FFFFFF', 'Dla ciemnego tła tekst musi być biały');
    assert.equal(getContrastingTextColor('#fbfaf7'), '#14161D', 'Dla jasnego tła tekst musi być ciemny');

    const highRatio = getContrastRatio('#14161d', '#ffffff');
    assert.ok(highRatio > 15, `Kontrast czerni i bieli musi przekraczać 15:1 (otrzymano ${highRatio})`);
    assert.equal(getWcagRating(highRatio).rating, 'Doskonały');
    assert.equal(getWcagRating(5.0).rating, 'Dobry');
    assert.equal(getWcagRating(2.1).rating, 'Słaby');
    console.log('✅ [13/21] Kalkulator kontrastu WCAG 2.1 i luminancji (colorUtils): działa bezbłędnie.');
}

// 14. Klonowanie i przemapowywanie ID przy wersjonowaniu / duplikowaniu testu (remapTestEntityIds)
{
    const origScales: Scale[] = [
        { id: 'S_A', name: 'Skala A', type: 'standard', maxScore: 10, description: '' },
        { id: 'S_B', name: 'Skala B', type: 'standard', maxScore: 10, description: '' },
        { id: 'S_SUM', name: 'Suma', type: 'calculated', formula: '{S_A} + {S_B} * 2', description: '' },
    ];
    const origSections: Section[] = [
        {
            id: 'SEC_1',
            title: 'Sekcja 1',
            questions: [
                {
                    id: 'Q_1',
                    text: 'Pytanie 1',
                    type: 'multiple-choice',
                    options: [{ id: 'opt1', text: 'Opcja 1' }],
                    scoring: { opt1: [{ scaleId: 'S_A', points: 4 }, { scaleId: 'S_B', points: 3 }] },
                },
            ],
        },
    ];

    const { remappedScales, remappedSections } = remapTestEntityIds(origScales, origSections);
    assert.notEqual(remappedScales[0].id, 'S_A', 'ID skali musi zostać zmienione na nowe');
    assert.notEqual(remappedSections[0].id, 'SEC_1', 'ID sekcji musi zostać zmienione na nowe');
    assert.notEqual(remappedSections[0].questions[0].id, 'Q_1', 'ID pytania musi zostać zmienione na nowe');
    assert.equal(
        remappedScales[2].formula,
        `{${remappedScales[0].id}} + {${remappedScales[1].id}} * 2`,
        'Formuła skali obliczanej musi zostać automatycznie przepisana na nowe ID skal'
    );

    const origScores = calculateTestScores({ scales: origScales, sections: origSections }, { Q_1: ['opt1'] });
    const newQId = remappedSections[0].questions[0].id;
    const remappedScores = calculateTestScores(
        { scales: remappedScales, sections: remappedSections },
        { [newQId]: ['opt1'] }
    );
    assert.equal(origScores.S_SUM, 10);
    assert.equal(remappedScores[remappedScales[2].id], 10, 'Wynik po przemapowaniu ID musi być identyczny z oryginałem');
    console.log('✅ [14/21] Przemapowywanie ID przy klonowaniu/wersjonowaniu testów (remapTestEntityIds): pełna zgodność formuł i punktacji.');
}

// 15. Sanityzacja testu wysyłanego do przeglądarki osoby badanej (ochrona klucza punktacji przed DevTools)
{
    const dassTest = buildDass42TestFixture();
    const publicTest = sanitizeTestForPublicClient(dassTest);

    assert.equal(publicTest.scales.length, 0, 'Obiekt testu dla klienta nie może zawierać definicji skal');
    const allPublicQuestions = publicTest.sections.flatMap(s => s.questions);
    assert.equal(allPublicQuestions.length, 42);
    for (const q of allPublicQuestions) {
        assert.deepEqual(q.scoring, {}, `Pytanie ${q.id} nie może zawierać klucza punktacji w widoku klienta`);
        for (const opt of q.options) {
            assert.deepEqual(Object.keys(opt).sort(), ['id', 'text'], 'Opcja odpowiedzi może zawierać wyłącznie id oraz text');
        }
    }
    console.log('✅ [15/21] Ochrona klucza odpowiedzi przed podglądem w DevTools klienta (sanitizeTestForPublicClient): 100% szczelna.');
}

// 16. Eksport CSV z BOM UTF-8 i escape\'owaniem znaków specjalnych dla polskiego Excela (buildCsvContent)
{
    assert.equal(escapeCsvCell('Zwykły tekst'), '"Zwykły tekst"');
    assert.equal(escapeCsvCell('Tekst z "cudzysłowem" i ; średnikiem'), '"Tekst z ""cudzysłowem"" i ; średnikiem"');
    assert.equal(escapeCsvCell(null), '""');

    const csv = buildCsvContent(
        ['Kod Klienta', 'Tytuł Testu', 'Wynik'],
        [['AC-12345678', 'Test "Specjalny"; edycja 2', 42]]
    );
    assert.ok(csv.startsWith('\uFEFF'), 'Plik CSV musi zaczynać się od znacznika UTF-8 BOM dla polskiego Excela');
    assert.ok(csv.includes('"AC-12345678";"Test ""Specjalny""; edycja 2";"42"'), 'Komórki CSV muszą być rozdzielone średnikiem i poprawnie zacytowane');
    console.log('✅ [16/21] Generator CSV (UTF-8 BOM, średniki i podwójne cudzysłowy dla Excela): działa bezbłędnie.');
}

// 17. Generator kodów dostępu (format AC-XXXXXXXX, unikalność 500 kodów, normalizacja wejścia klienta)
{
    assert.equal(normalizeAccessCodeInput('  ac-9f8e7d6c \n'), 'AC-9F8E7D6C');
    assert.equal(normalizeAccessCodeInput(null), '');

    const generated = new Set<string>();
    for (let i = 0; i < 500; i++) {
        const code = createAccessCodeString();
        assert.match(code, /^AC-[0-9A-F]{8}$/, `Kod ${code} musi pasować do formatu AC-XXXXXXXX`);
        generated.add(code);
    }
    assert.equal(generated.size, 500, 'Wszystkie 500 wygenerowanych w serii kodów dostępu muszą być unikalne');
    console.log('✅ [17/21] Generator i normalizator kodów dostępu (format AC-XXXXXXXX + test kolizji 500 kodów): działa bezbłędnie.');
}

// 18–21. Testy silnika PDF (DASS-42 full/client, PDF porównawczy, Wielka Piątka 120 pytań / 35 skal, weryfikacja liczby stron przez PDFDocument.load)
async function testPdfEngineSuite() {
    const dassTest = buildDass42TestFixture();
    const allQ = dassTest.sections.flatMap(s => s.questions);
    const answersA: Record<string, string[]> = {};
    const answersB: Record<string, string[]> = {};
    allQ.forEach((q, idx) => {
        answersA[q.id] = [q.options[idx % 4].id];
        answersB[q.id] = [q.options[(idx + 1) % 4].id];
    });

    const scoresA = calculateTestScores(dassTest, answersA);
    const scoresB = calculateTestScores(dassTest, answersB);

    const mockResultA: TestResult = {
        id: 'res-a',
        testId: dassTest.id,
        testTitle: dassTest.title,
        testVersion: 1,
        therapistId: 'therapist-1',
        clientIdentifier: 'KOD-PRE-01',
        completedAt: new Date().toISOString(),
        answers: answersA as any,
        scores: scoresA,
        analysis: 'Notatka gabinetowa z polskimi znakami: ąęćłńóśźż ĄĘĆŁŃÓŚŹŻ.',
    };

    const mockResultB: TestResult = {
        ...mockResultA,
        id: 'res-b',
        clientIdentifier: 'KOD-POST-02',
        answers: answersB as any,
        scores: scoresB,
    };

    const mockBranding: BrandingSettings = {
        appName: 'Real Moment',
        primaryColor: '#5c7cfa',
        reportPrimaryColor: '#314293',
        reportFooterText: 'Real Moment – Poufny raport diagnostyczny',
        reportDisclaimerEnabled: true,
    } as any;

    const legacyCustomTemplate: PdfTemplate = {
        id: 'tpl-dass',
        name: 'Szablon testowy z dawnymi polami',
        testCanonicalId: dassTest.canonicalId,
        components: [
            { id: 'c1', type: 'Header', options: { title: 'Raport Wyniku Testu', subtitle: dassTest.title } },
            { id: 'c2', type: 'TestDescription', options: {} },
            { id: 'c3', type: 'RichText', options: { content: '## Dane Klienta\n\nIdentyfikator: {{imie}}\nData badania: {{data}}\nWynik D: {{wynik:DASS_D}} ({{poziom:DASS_D}})' } },
            { id: 'c4', type: 'ScoresTable', options: { scaleIds: [] } },
            { id: 'c5', type: 'BarChart', options: { title: 'Profil Wyników', scaleIds: [] } },
            { id: 'c6', type: 'RadarChart', options: { title: 'Wykres Radarowy', scaleIds: [] } },
            { id: 'c7', type: 'Interpretations', options: { title: 'Szczegółowa interpretacja', scaleIds: [] } },
            { id: 'c8', type: 'AiInterpretation', options: { title: 'Opis zindywidualizowany' } },
            { id: 'c9', type: 'AnswersList', options: { title: 'Udzielone odpowiedzi' } },
        ],
    };

    // 18. PDF Gabinetowy (Pełny) vs PDF dla Klienta dla DASS-42
    const fullPdfBytes = await generatePdf(mockResultA, dassTest, mockBranding, legacyCustomTemplate, mockResultA.analysis || '', {
        audience: 'therapist',
    });
    const clientPdfBytes = await generatePdf(mockResultA, dassTest, mockBranding, legacyCustomTemplate, mockResultA.analysis || '', {
        audience: 'client',
    });

    const fullDoc = await PDFDocument.load(fullPdfBytes);
    const clientDoc = await PDFDocument.load(clientPdfBytes);
    assert.ok(fullDoc.getPageCount() >= 4, `Pełny raport PDF DASS-42 z listą 42 odpowiedzi powinien mieć >= 4 strony (ma ${fullDoc.getPageCount()})`);
    assert.ok(clientDoc.getPageCount() < fullDoc.getPageCount(), `PDF dla klienta (${clientDoc.getPageCount()} str.) musi mieć mniej stron niż pełny PDF (${fullDoc.getPageCount()} str.)`);
    console.log(`✅ [18/21] Silnik PDF (DASS-42): tryb Gabinetowy (${fullDoc.getPageCount()} str.) vs tryb dla Klienta (${clientDoc.getPageCount()} str.) zweryfikowany przez PDFDocument.load.`);

    // 19. Raport porównawczy Pre-test / Post-test PDF
    const compPdfBytes = await generateComparisonPdf(mockResultA, mockResultB, dassTest, mockBranding);
    const compDoc = await PDFDocument.load(compPdfBytes);
    assert.ok(compDoc.getPageCount() >= 1);
    assert.ok(compPdfBytes.byteLength > 15000);
    console.log(`✅ [19/21] Silnik PDF Porównawczy (Pre-test / Post-test, ${compDoc.getPageCount()} str., ${compPdfBytes.byteLength} B): działa bezbłędnie.`);

    // 20. Test obciążeniowy PDF dla Wielkiej Piątki (120 pytań, 35 skal, wielostronicowa tabela, wykresy i lista 120 odpowiedzi)
    const bfTest = buildBigFiveTestFixture();
    const allBfQ = bfTest.sections.flatMap(s => s.questions);
    const bfAnswers: Record<string, string[]> = {};
    allBfQ.forEach((q, idx) => {
        bfAnswers[q.id] = [q.options[idx % 5].id];
    });
    const bfScores = calculateTestScores(bfTest, bfAnswers);
    const bfResult: TestResult = {
        id: 'res-bf',
        testId: bfTest.id,
        testTitle: bfTest.title,
        testVersion: 1,
        therapistId: 'therapist-1',
        clientIdentifier: 'KOD-BF-120',
        completedAt: new Date().toISOString(),
        answers: bfAnswers as any,
        scores: bfScores,
        analysis: 'Kompleksowa notatka do badania Wielkiej Piątki (120 pytań, 35 skal).',
    };

    const bfFullBytes = await generatePdf(bfResult, bfTest, mockBranding, {
        ...legacyCustomTemplate,
        testCanonicalId: bfTest.canonicalId,
    }, bfResult.analysis || '', { audience: 'therapist' });
    const bfFullDoc = await PDFDocument.load(bfFullBytes);
    assert.ok(bfFullDoc.getPageCount() >= 10, `Pełny raport Wielkiej Piątki (35 skal + 120 pytań) musi mieć >= 10 stron (ma ${bfFullDoc.getPageCount()})`);
    console.log(`✅ [20/21] Test obciążeniowy silnika PDF dla Wielkiej Piątki (120 pytań, 35 skal -> ${bfFullDoc.getPageCount()} stron A4): działa bezbłędnie.`);

    // 21. Raport Porównawczy PDF dla Wielkiej Piątki (tabela zmian na wszystkich 35 skalach)
    const bfCompBytes = await generateComparisonPdf(bfResult, bfResult, bfTest, mockBranding);
    const bfCompDoc = await PDFDocument.load(bfCompBytes);
    assert.ok(bfCompDoc.getPageCount() >= 2, `Raport porównawczy 35 skal Wielkiej Piątki musi mieć >= 2 strony (ma ${bfCompDoc.getPageCount()})`);
    console.log(`✅ [21/21] Wielostronicowy Raport Porównawczy PDF dla 35 skal Wielkiej Piątki (${bfCompDoc.getPageCount()} str.): działa bezbłędnie.`);

    console.log('\n🎉 WSZYSTKIE TESTY JEDNOSTKOWE I AUDYTOWE ZALICZONE (21/21)!');
}

testPdfEngineSuite().catch(err => {
    console.error('❌ Błąd testu silnika PDF:', err);
    process.exit(1);
});
