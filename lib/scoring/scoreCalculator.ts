import { evaluate } from 'mathjs';
import type { Scale, ScoringRule } from '@/components/types';

/**
 * Evaluates a mathematical formula string where scale references are enclosed in `{scaleId}`
 * (supports any alphanumeric scale ID, with or without hyphens/underscores).
 */
export function evaluateFormula(
    formula: string,
    availableScores: Record<string, number>
): number {
    const populatedFormula = formula.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_match, scaleId) => {
        return availableScores[scaleId]?.toString() || '0';
    });

    try {
        const result = evaluate(populatedFormula);

        if (typeof result !== 'number' || !isFinite(result) || isNaN(result)) {
            return 0;
        }
        return result;
    } catch {
        return 0;
    }
}

export interface ScorableTestStructure {
    scales: Array<Pick<Scale, 'id' | 'type' | 'formula'>>;
    sections: Array<{
        questions: Array<{
            id: string;
            scoring: Record<string, ScoringRule[]>;
        }>;
    }>;
}

/**
 * Pure two-phase scoring engine:
 * - Phase 1: Validates that every question has at least one answer and sums points for `standard` scales.
 * - Phase 2: Iteratively resolves `calculated` scales using `evaluateFormula`.
 */
export function calculateTestScores(
    test: ScorableTestStructure,
    answers: Record<string, string | string[]>
): Record<string, number> {
    const standardScores: Record<string, number> = {};
    const standardScales = test.scales.filter(s => s.type === 'standard');

    // Phase 1: Validate all questions are answered & Calculate Standard Scores
    for (const scale of standardScales) {
        standardScores[scale.id] = 0;
    }

    for (const section of test.sections) {
        for (const question of section.questions) {
            const givenAnswer = answers[question.id];
            const answerIds = Array.isArray(givenAnswer)
                ? givenAnswer
                : givenAnswer
                  ? [givenAnswer]
                  : [];

            if (answerIds.length === 0) {
                throw new Error('Proszę odpowiedzieć na wszystkie pytania przed zakończeniem testu.');
            }

            for (const answerId of answerIds) {
                const scoringRules = question.scoring[answerId];
                if (scoringRules) {
                    for (const rule of scoringRules) {
                        if (standardScores[rule.scaleId] !== undefined) {
                            standardScores[rule.scaleId] += rule.points;
                        }
                    }
                }
            }
        }
    }

    // Phase 2: Calculate Calculated Scores
    const calculatedScores: Record<string, number> = {};
    const calculatedScales = test.scales.filter(s => s.type === 'calculated');
    calculatedScales.forEach(s => {
        calculatedScores[s.id] = 0;
    });

    let iterations = 0;
    let scoresChanged = true;
    const maxIterations = 10;
    const currentAllScores: Record<string, number> = { ...standardScores, ...calculatedScores };

    while (scoresChanged && iterations < maxIterations) {
        scoresChanged = false;
        iterations++;

        for (const scale of calculatedScales) {
            if (scale.type === 'calculated' && scale.formula) {
                const oldValue = calculatedScores[scale.id];
                const newValue = evaluateFormula(scale.formula, currentAllScores);

                if (newValue !== oldValue) {
                    calculatedScores[scale.id] = newValue;
                    currentAllScores[scale.id] = newValue;
                    scoresChanged = true;
                }
            }
        }
    }

    return { ...standardScores, ...calculatedScores };
}
