import type { Scale, ScaleLevel, Section } from '@/components/types';
import {
    isBigFiveFacetScale,
    getBigFiveFacetParentDomain,
    getBigFiveDomainCode,
} from '@/lib/tests/bigFiveDefinitions';

export interface ResolvedLevelInfo {
    label: string;
    color: string;
    textColor: string;
    description: string | null;
    minScore?: number;
    maxScore?: number;
    rankIndex: number;
    totalLevels: number;
}

function resolveColorAndContrast(rawColor?: string): { color: string; textColor: string } {
    let hexColor = rawColor || '#314293';
    let textColor = '#ffffff';

    if (hexColor === 'red') hexColor = '#ef4444';
    else if (hexColor === 'yellow') {
        hexColor = '#fef08a';
        textColor = '#854d0e';
    } else if (hexColor === 'green') hexColor = '#4e9054';
    else if (hexColor === 'purple') hexColor = '#a855f7';
    else if (hexColor === 'blue') hexColor = '#314293';
    else if (hexColor === 'orange') hexColor = '#f97316';
    else if (hexColor.startsWith('#') && hexColor.length >= 7) {
        const r = parseInt(hexColor.slice(1, 3), 16) || 0;
        const g = parseInt(hexColor.slice(3, 5), 16) || 0;
        const b = parseInt(hexColor.slice(5, 7), 16) || 0;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (luminance > 0.55) textColor = '#14161d';
    }

    return { color: hexColor, textColor };
}

/**
 * Matches a numeric score against a scale's configured `levels` (supporting ANY number of thresholds: 1, 2, 3, 4, 5, 10, etc.).
 * Falls back to percentage-based thresholds only if the scale has no levels defined.
 */
export function resolveScaleLevel(
    val: number,
    scale?: { maxScore?: number | null; levels?: ScaleLevel[] | string | null } | null
): ResolvedLevelInfo {
    if (!scale) {
        return {
            label: 'Brak danych',
            color: '#313647',
            textColor: '#fbfaf7',
            description: null,
            rankIndex: 0,
            totalLevels: 0,
        };
    }

    let parsedLevels: ScaleLevel[] = [];
    if (Array.isArray(scale.levels)) {
        parsedLevels = scale.levels;
    } else if (typeof scale.levels === 'string' && scale.levels.trim()) {
        try {
            const parsed = JSON.parse(scale.levels);
            if (Array.isArray(parsed)) parsedLevels = parsed;
        } catch {
            parsedLevels = [];
        }
    }

    if (parsedLevels.length > 0) {
        const sorted = [...parsedLevels].sort((a, b) => (a.minScore ?? 0) - (b.minScore ?? 0));
        let matchedIdx = sorted.findIndex(l => val >= l.minScore && val <= l.maxScore);

        if (matchedIdx === -1) {
            if (val < sorted[0].minScore) {
                matchedIdx = 0;
            } else {
                matchedIdx = sorted.length - 1;
            }
        }

        const matched = sorted[matchedIdx];
        const { color, textColor } = resolveColorAndContrast(matched.color);

        return {
            label: matched.name || `Poziom ${matchedIdx + 1}`,
            color,
            textColor,
            description: matched.description ? matched.description.trim() : null,
            minScore: matched.minScore,
            maxScore: matched.maxScore,
            rankIndex: matchedIdx,
            totalLevels: sorted.length,
        };
    }

    if (!scale.maxScore) {
        return {
            label: 'Wynik surowy',
            color: '#313647',
            textColor: '#fbfaf7',
            description: null,
            rankIndex: 0,
            totalLevels: 1,
        };
    }

    const ratio = val / scale.maxScore;
    if (ratio > 0.72) {
        return {
            label: 'Wysoki',
            color: '#e89183',
            textColor: '#14161d',
            description: null,
            rankIndex: 2,
            totalLevels: 3,
        };
    }
    if (ratio >= 0.48) {
        return {
            label: 'Przeciętny',
            color: '#314293',
            textColor: '#ffffff',
            description: null,
            rankIndex: 1,
            totalLevels: 3,
        };
    }
    return {
        label: 'Niski',
        color: '#4e9054',
        textColor: '#ffffff',
        description: null,
        rankIndex: 0,
        totalLevels: 3,
    };
}

/**
 * Deterministically builds a full, structured HTML baseline interpretation from the test key (`klucz testu`),
 * supporting ANY number of thresholds (`N` levels) per scale AND hierarchical facet subscales (e.g. Big Five O1..N6).
 */
export function buildKeyInterpretation(
    test: { title: string; scales: Scale[] },
    scores: Record<string, number>
): string {
    if (!test.scales || test.scales.length === 0) {
        return '';
    }

    interface EvaluatedScale {
        scale: Scale;
        score: number;
        maxScore?: number;
        percentage: number | null;
        level: ResolvedLevelInfo;
        relativeRank: number;
        isFacet: boolean;
        parentDomain: string | null;
    }

    const evaluated: EvaluatedScale[] = [];

    for (const scale of test.scales) {
        const score = scores[scale.id];
        if (score === undefined) continue;

        const maxScore = scale.maxScore && scale.maxScore > 0 ? scale.maxScore : undefined;
        const percentage = maxScore ? Math.min(100, Math.max(0, Math.round((score / maxScore) * 100))) : null;
        const level = resolveScaleLevel(score, scale);
        const relativeRank =
            level.totalLevels > 1
                ? level.rankIndex / (level.totalLevels - 1)
                : percentage !== null
                  ? percentage / 100
                  : 0.5;

        evaluated.push({
            scale,
            score,
            maxScore,
            percentage,
            level,
            relativeRank,
            isFacet: isBigFiveFacetScale(scale),
            parentDomain: getBigFiveFacetParentDomain(scale),
        });
    }

    if (evaluated.length === 0) return '';

    const primaryScales = evaluated.filter(e => !e.isFacet);
    const facetScales = evaluated.filter(e => e.isFacet);
    const summaryTargets = primaryScales.length > 0 ? primaryScales : evaluated;

    // 1. Group primary scales dynamically by their achieved level label (works for 2, 3, 4, 5, 10... levels)
    const groupsMap = new Map<
        string,
        { label: string; maxRelativeRank: number; items: EvaluatedScale[] }
    >();

    for (const item of summaryTargets) {
        const key = item.level.label.trim();
        const existing = groupsMap.get(key);
        if (existing) {
            existing.items.push(item);
            if (item.relativeRank > existing.maxRelativeRank) {
                existing.maxRelativeRank = item.relativeRank;
            }
        } else {
            groupsMap.set(key, {
                label: item.level.label,
                maxRelativeRank: item.relativeRank,
                items: [item],
            });
        }
    }

    const sortedGroups = Array.from(groupsMap.values()).sort(
        (a, b) => b.maxRelativeRank - a.maxRelativeRank
    );

    let html = `<p><strong>PODSUMOWANIE PROFILU WYNIKÓW (${test.title})</strong></p><ul>`;
    for (const group of sortedGroups) {
        const formattedItems = group.items
            .map(it => {
                const scorePart = it.maxScore
                    ? `${it.score}/${it.maxScore} pkt (${it.percentage}%)`
                    : `${it.score} pkt`;
                return `${it.scale.name} (${scorePart})`;
            })
            .join(', ');
        html += `<li><strong>Poziom: ${group.label}</strong> — ${formattedItems}</li>`;
    }
    html += `</ul><p><br></p>`;

    // 2. Detailed per-scale key interpretation (with nested facets if present)
    html += `<p><strong>SZCZEGÓŁOWA INTERPRETACJA WYMIARÓW WG KLUCZA TESTU</strong></p>`;

    for (const item of summaryTargets) {
        const scorePart = item.maxScore
            ? `${item.score} / ${item.maxScore} pkt (${item.percentage}%)`
            : `${item.score} pkt`;
        const rangePart =
            item.level.minScore !== undefined && item.level.maxScore !== undefined
                ? ` [przedział klucza: ${item.level.minScore}–${item.level.maxScore} pkt]`
                : '';

        html += `<p><strong>${item.scale.name} — wynik: ${scorePart} | Poziom: ${item.level.label}</strong>${rangePart}</p>`;

        const scaleGeneralDesc = (item.scale.description || '').trim();
        const levelSpecificDesc = (item.level.description || '').trim();

        if (levelSpecificDesc) {
            if (scaleGeneralDesc && scaleGeneralDesc !== levelSpecificDesc) {
                html += `<p><em>${scaleGeneralDesc}</em></p>`;
            }
            html += `<p>${levelSpecificDesc}</p>`;
        } else if (scaleGeneralDesc) {
            html += `<p>${scaleGeneralDesc}</p>`;
        } else {
            html += `<p>Brak szczegółowego opisu tekstowego dla tego progu w kluczu testu.</p>`;
        }

        // Render child facets if this primary scale has facets (e.g. O -> O1..O6)
        const domainCode = getBigFiveDomainCode(item.scale);
        const childFacets = domainCode
            ? facetScales.filter(f => f.parentDomain === domainCode)
            : [];

        if (childFacets.length > 0) {
            html += `<p><strong>Podskale (aspekty wymiaru ${item.scale.name}):</strong></p><ul>`;
            for (const facet of childFacets) {
                const fScorePart = facet.maxScore
                    ? `${facet.score}/${facet.maxScore} pkt (${facet.percentage}%)`
                    : `${facet.score} pkt`;
                const fDesc = (facet.level.description || facet.scale.description || '').trim();
                html += `<li><strong>${facet.scale.name}</strong> — ${fScorePart}, poziom: <strong>${facet.level.label}</strong>.${fDesc ? ` ${fDesc}` : ''}</li>`;
            }
            html += `</ul>`;
        }
    }

    return html;
}

/**
 * Generates `count` (N >= 2) contiguous, non-overlapping score intervals covering [minPossible .. maxPossible].
 * Adapts default labels and colors automatically to any N (2, 3, 4, 5, 6, ... 10+).
 */
export function generateEqualThresholds(
    count: number,
    maxPossible: number,
    minPossible: number = 0
): ScaleLevel[] {
    const n = Math.max(2, Math.min(20, Math.floor(count || 3)));
    const safeMin = Math.max(0, Math.floor(minPossible || 0));
    const safeMax = Math.max(safeMin + n - 1, Math.floor(maxPossible || 100));

    const presetsByCount: Record<number, { names: string[]; colors: string[] }> = {
        2: {
            names: ['Niski / Norma', 'Wysoki / Podwyższony'],
            colors: ['#4e9054', '#ef4444'],
        },
        3: {
            names: ['Niski', 'Przeciętny', 'Wysoki'],
            colors: ['#fef08a', '#314293', '#ef4444'],
        },
        4: {
            names: ['Niski', 'Umiarkowanie niski', 'Umiarkowanie wysoki', 'Wysoki'],
            colors: ['#4e9054', '#314293', '#f97316', '#ef4444'],
        },
        5: {
            names: ['Bardzo niski', 'Niski', 'Przeciętny', 'Wysoki', 'Bardzo wysoki'],
            colors: ['#4e9054', '#3b82f6', '#314293', '#f97316', '#ef4444'],
        },
        6: {
            names: [
                'Bardzo niski',
                'Niski',
                'Nieco obniżony',
                'Nieco podwyższony',
                'Wysoki',
                'Bardzo wysoki',
            ],
            colors: ['#4e9054', '#0ea5e9', '#314293', '#a855f7', '#f97316', '#ef4444'],
        },
        10: {
            names: [
                'Sten 1 (bardzo niski)',
                'Sten 2 (bardzo niski)',
                'Sten 3 (niski)',
                'Sten 4 (niski)',
                'Sten 5 (przeciętny)',
                'Sten 6 (przeciętny)',
                'Sten 7 (wysoki)',
                'Sten 8 (wysoki)',
                'Sten 9 (bardzo wysoki)',
                'Sten 10 (bardzo wysoki)',
            ],
            colors: [
                '#4e9054',
                '#4e9054',
                '#0ea5e9',
                '#0ea5e9',
                '#314293',
                '#314293',
                '#f97316',
                '#f97316',
                '#ef4444',
                '#dc2626',
            ],
        },
    };

    const totalSpan = safeMax - safeMin + 1;
    const levels: ScaleLevel[] = [];

    const palette = ['#4e9054', '#0ea5e9', '#314293', '#a855f7', '#f97316', '#ef4444'];

    for (let i = 0; i < n; i++) {
        const rangeStart = safeMin + Math.floor((i * totalSpan) / n);
        const rangeEnd =
            i === n - 1
                ? safeMax
                : safeMin + Math.floor(((i + 1) * totalSpan) / n) - 1;

        const preset = presetsByCount[n];
        const name = preset
            ? preset.names[i]
            : i === 0
              ? `Poziom 1 (najniższy)`
              : i === n - 1
                ? `Poziom ${n} (najwyższy)`
                : `Poziom ${i + 1}`;

        const color = preset
            ? preset.colors[i]
            : palette[Math.min(palette.length - 1, Math.floor((i / Math.max(1, n - 1)) * (palette.length - 1)))];

        levels.push({
            id: `lvl-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            name,
            minScore: rangeStart,
            maxScore: Math.max(rangeStart, rangeEnd),
            color,
            description: '',
        });
    }

    return levels;
}

/**
 * Computes theoretical minimum and maximum possible points for a given scale based on all questions in the test.
 */
export function calculateScaleScoreBounds(
    sections: Section[],
    scaleId: string
): { minPossible: number; maxPossible: number; questionCount: number } {
    let minPossible = 0;
    let maxPossible = 0;
    let questionCount = 0;

    for (const sec of sections || []) {
        for (const q of sec.questions || []) {
            if (!q.scoring) continue;
            const optionPoints: number[] = [];

            for (const opt of q.options || []) {
                const rules = q.scoring[opt.id] || [];
                const matchingRules = rules.filter(r => r.scaleId === scaleId);
                if (matchingRules.length > 0) {
                    const sum = matchingRules.reduce((acc, r) => acc + (Number(r.points) || 0), 0);
                    optionPoints.push(sum);
                } else {
                    optionPoints.push(0);
                }
            }

            const hasNonZeroRule = optionPoints.some(p => p !== 0);
            if (!hasNonZeroRule) continue;

            questionCount++;
            if (q.type === 'multiple-select') {
                const positiveSum = optionPoints.filter(p => p > 0).reduce((a, b) => a + b, 0);
                const negativeSum = optionPoints.filter(p => p < 0).reduce((a, b) => a + b, 0);
                minPossible += negativeSum;
                maxPossible += positiveSum;
            } else {
                minPossible += Math.min(...optionPoints);
                maxPossible += Math.max(...optionPoints);
            }
        }
    }

    return { minPossible, maxPossible, questionCount };
}
