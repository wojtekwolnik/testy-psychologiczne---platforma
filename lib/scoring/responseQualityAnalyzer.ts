import type { Test, Question } from '@/components/types';

export interface ResponseQualityWarning {
    id: string;
    severity: 'info' | 'warning';
    title: string;
    description: string;
}

export interface ResponseQualityReport {
    totalQuestions: number;
    answeredQuestions: number;
    extremeLowerCount: number;
    extremeUpperCount: number;
    extremePercent: number;
    neutralMiddleCount: number;
    neutralMiddlePercent: number;
    moderateCount: number;
    moderatePercent: number;
    maxLongstring: number;
    maxLongstringOptionLabel: string | null;
    maxLongstringRange: { startQuestion: number; endQuestion: number } | null;
    reversedInconsistencyScales: {
        scaleId: string;
        scaleName: string;
        directMeanNorm: number;
        reversedRawMeanNorm: number;
    }[];
    overallStatus: 'optimal' | 'attention';
    warnings: ResponseQualityWarning[];
}

/**
 * Analizuje styl i spójność odpowiedzi osoby badanej bez naruszania anonimowości.
 * Wykrywa:
 * - rozkład skrajnych vs środkowych odpowiedzi,
 * - długie serie identycznych wyborów z rzędu (tzw. longstring / klikanie "w jedną kolumnę"),
 * - rozbieżności między pytaniami wprost a pytaniami odwróconymi w obrębie tej samej skali.
 */
export function analyzeResponseQuality(
    test: Pick<Test, 'scales' | 'sections'>,
    answers: Record<string, string | string[]> | undefined | null
): ResponseQualityReport {
    const safeAnswers = answers || {};
    const allQuestions: Question[] = (test.sections || []).flatMap(sec => sec.questions || []);
    const totalQuestions = allQuestions.length;

    let answeredQuestions = 0;
    let extremeLowerCount = 0;
    let extremeUpperCount = 0;
    let neutralMiddleCount = 0;
    let moderateCount = 0;

    let currentStreak = 0;
    let currentStreakOptionIdx: number | null = null;
    let currentStreakStart = 1;
    let currentStreakLabel: string | null = null;

    let maxLongstring = 0;
    let maxLongstringOptionLabel: string | null = null;
    let maxLongstringRange = null as { startQuestion: number; endQuestion: number } | null;

    // Dla spójności pytań wprost vs odwróconych: zbieramy znormalizowany indeks wybranej opcji (0..1)
    const scaleItemRawChoices = new Map<
        string,
        { directNorms: number[]; reversedRawNorms: number[] }
    >();

    allQuestions.forEach((q, idx) => {
        const questionNum = idx + 1;
        const rawAns = safeAnswers[q.id];
        const selectedId = Array.isArray(rawAns) ? rawAns[0] : rawAns;
        const options = q.options || [];

        if (selectedId === undefined || selectedId === null || selectedId === '' || options.length < 2) {
            currentStreak = 0;
            currentStreakOptionIdx = null;
            return;
        }

        const optIndex = options.findIndex(o => String(o.id) === String(selectedId));
        if (optIndex === -1) {
            currentStreak = 0;
            currentStreakOptionIdx = null;
            return;
        }

        answeredQuestions++;
        const optCount = options.length;
        const normPos = optCount > 1 ? optIndex / (optCount - 1) : 0.5; // 0.0 = pierwsza opcja, 1.0 = ostatnia opcja

        // Kategoryzacja wyboru (skrajny dolny, skrajny górny, środkowy/neutralny, umiarkowany)
        if (optIndex === 0) {
            extremeLowerCount++;
        } else if (optIndex === optCount - 1) {
            extremeUpperCount++;
        } else if (optCount % 2 === 1 && optIndex === Math.floor(optCount / 2)) {
            neutralMiddleCount++;
        } else {
            moderateCount++;
        }

        // Śledzenie serii identycznych wyborów (longstring po indeksie kolumny)
        if (currentStreakOptionIdx === optIndex) {
            currentStreak++;
        } else {
            currentStreak = 1;
            currentStreakOptionIdx = optIndex;
            currentStreakStart = questionNum;
            currentStreakLabel = options[optIndex]?.text || `Opcja ${optIndex + 1}`;
        }

        if (currentStreak > maxLongstring) {
            maxLongstring = currentStreak;
            maxLongstringOptionLabel = currentStreakLabel;
            maxLongstringRange = {
                startQuestion: currentStreakStart,
                endQuestion: questionNum,
            };
        }

        // Wykrywanie czy pytanie jest odwrócone dla konkretnej skali:
        // Pytanie uznajemy za odwrócone względem skali S, jeśli posiada flagę isReversed === true
        // LUB punkty przypisane pierwszej opcji są wyższe niż punkty przypisane ostatniej opcji.
        const firstOptId = options[0]?.id;
        const lastOptId = options[optCount - 1]?.id;
        const firstRules = (firstOptId && q.scoring?.[firstOptId]) || [];
        const lastRules = (lastOptId && q.scoring?.[lastOptId]) || [];

        const scaleIdsInQuestion = new Set<string>();
        Object.values(q.scoring || {}).forEach(rules => {
            (rules || []).forEach(r => {
                if (r?.scaleId) scaleIdsInQuestion.add(r.scaleId);
            });
        });

        scaleIdsInQuestion.forEach(scaleId => {
            const firstPts = firstRules.find(r => r.scaleId === scaleId)?.points ?? 0;
            const lastPts = lastRules.find(r => r.scaleId === scaleId)?.points ?? 0;

            if (firstPts === lastPts) return;

            const isReversedForScale = Boolean(q.isReversed) || firstPts > lastPts;
            if (!scaleItemRawChoices.has(scaleId)) {
                scaleItemRawChoices.set(scaleId, { directNorms: [], reversedRawNorms: [] });
            }
            const bucket = scaleItemRawChoices.get(scaleId)!;
            if (isReversedForScale) {
                bucket.reversedRawNorms.push(normPos);
            } else {
                bucket.directNorms.push(normPos);
            }
        });
    });

    const denom = Math.max(1, answeredQuestions);
    const extremePercent = Math.round(((extremeLowerCount + extremeUpperCount) / denom) * 100);
    const neutralMiddlePercent = Math.round((neutralMiddleCount / denom) * 100);
    const moderatePercent = Math.max(0, 100 - extremePercent - neutralMiddlePercent);

    // Analiza spójności pytań wprost vs odwróconych
    // Jeśli osoba badana odpowiada spójnie, to wysokie wartości surowego indeksu (bliskie 1.0) w pytaniach wprost
    // powinny iść w parze z niskimi wartościami surowego indeksu (bliskimi 0.0) w pytaniach odwróconych.
    // Gdy obie średnie są jednoczesnie wysokie (>= 0.72) lub jednocześnie niskie (<= 0.28), oznacza to potakiwanie / zaprzeczanie niezależnie od treści (acquiescence bias).
    const reversedInconsistencyScales: ResponseQualityReport['reversedInconsistencyScales'] = [];

    (test.scales || []).forEach(scale => {
        const bucket = scaleItemRawChoices.get(scale.id);
        if (!bucket || bucket.directNorms.length < 2 || bucket.reversedRawNorms.length < 2) return;

        const directMean =
            bucket.directNorms.reduce((a, b) => a + b, 0) / bucket.directNorms.length;
        const reversedRawMean =
            bucket.reversedRawNorms.reduce((a, b) => a + b, 0) / bucket.reversedRawNorms.length;

        const bothHigh = directMean >= 0.72 && reversedRawMean >= 0.72;
        const bothLow = directMean <= 0.28 && reversedRawMean <= 0.28;

        if (bothHigh || bothLow) {
            reversedInconsistencyScales.push({
                scaleId: scale.id,
                scaleName: scale.name || scale.id,
                directMeanNorm: Number(directMean.toFixed(2)),
                reversedRawMeanNorm: Number(reversedRawMean.toFixed(2)),
            });
        }
    });

    const warnings: ResponseQualityWarning[] = [];

    const longstringThreshold = totalQuestions >= 30 ? 10 : totalQuestions >= 12 ? 7 : 6;
    if (answeredQuestions >= 10 && maxLongstring >= longstringThreshold && maxLongstringRange) {
        warnings.push({
            id: 'longstring',
            severity: 'warning',
            title: `Długa seria identycznych odpowiedzi z rzędu (${maxLongstring} pytań)`,
            description: `W pytaniach nr ${maxLongstringRange.startQuestion}–${maxLongstringRange.endQuestion} wybrano pod rząd tę samą odpowiedź („${maxLongstringOptionLabel}”). Warto zweryfikować podczas rozmowy, czy badany nie zaznaczał odpowiedzi automatycznie.`,
        });
    }

    if (answeredQuestions >= 10 && neutralMiddlePercent >= 55) {
        warnings.push({
            id: 'central-tendency',
            severity: 'warning',
            title: `Tendencja centralna / unikanie deklaracji (${neutralMiddlePercent}% odpowiedzi środkowych)`,
            description: `Ponad połowa odpowiedzi to wariant neutralny/środkowy. Może to wskazywać na trudność z jednoznaczną samooceną, ostrożność lub ambiwalencję badanego.`,
        });
    }

    if (answeredQuestions >= 10 && extremePercent >= 75) {
        warnings.push({
            id: 'extreme-responding',
            severity: 'info',
            title: `Styl skrajnych odpowiedzi (${extremePercent}% wyborów na krańcach skali)`,
            description: `Osoba badana bardzo często wybierała skrajne opcje odpowiedzi (najniższą lub najwyższą). Może to odzwierciedlać wyraziste nasilenie cech/objawów lub dychotomiczny styl oceniania.`,
        });
    }

    if (reversedInconsistencyScales.length > 0) {
        const count = reversedInconsistencyScales.length;
        const mod10 = count % 10;
        const mod100 = count % 100;
        const noun =
            count === 1
                ? 'skala'
                : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
                  ? 'skale'
                  : 'skal';
        const listedNames = reversedInconsistencyScales
            .slice(0, 4)
            .map(s => s.scaleName)
            .join(', ');
        const extraCount = reversedInconsistencyScales.length - 4;
        warnings.push({
            id: 'reversed-inconsistency',
            severity: 'warning',
            title: `Niespójność między pytaniami wprost a odwróconymi (${count} ${noun})`,
            description: `W skalach: ${listedNames}${
                extraCount > 0 ? ` (+${extraCount} więcej)` : ''
            } badany zaznaczał ten sam kierunek odpowiedzi zarówno w twierdzeniach pozytywnych, jak i przeczących (odwróconych).`,
        });
    }

    const hasWarningSeverity = warnings.some(w => w.severity === 'warning');

    return {
        totalQuestions,
        answeredQuestions,
        extremeLowerCount,
        extremeUpperCount,
        extremePercent,
        neutralMiddleCount,
        neutralMiddlePercent,
        moderateCount,
        moderatePercent,
        maxLongstring,
        maxLongstringOptionLabel,
        maxLongstringRange,
        reversedInconsistencyScales,
        overallStatus: hasWarningSeverity ? 'attention' : 'optimal',
        warnings,
    };
}
