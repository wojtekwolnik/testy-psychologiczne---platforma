import type { Test } from '@/components/types';
import { calculateScaleScoreBounds, resolveScaleLevel, buildKeyInterpretation } from './interpretationBuilder';
import { calculateTestScores, evaluateFormula } from './scoreCalculator';

export interface TestAuditIssue {
    severity: 'error' | 'warning';
    category: 'metadata' | 'questions' | 'scales' | 'thresholds' | 'simulation';
    message: string;
}

export interface TestAuditReport {
    testId: string;
    title: string;
    version: number;
    status: 'DRAFT' | 'PUBLISHED';
    questionCount: number;
    scaleCount: number;
    passed: boolean;
    errorCount: number;
    warningCount: number;
    issues: TestAuditIssue[];
    simulationSummary: {
        minScores: Record<string, number>;
        maxScores: Record<string, number>;
        interpretationLength: number;
    } | null;
}

/**
 * Pure, 100% read-only psychometric & technical integrity auditor for any Test object.
 * Safe to run both in DEV and in PROD (never touches the database).
 */
export function auditTestIntegrity(test: Test): TestAuditReport {
    const issues: TestAuditIssue[] = [];
    const allQuestions = (test.sections || []).flatMap(s => s.questions || []);
    const scaleIds = new Set((test.scales || []).map(s => s.id));

    // 1. Metadata checks
    if (!test.title || !test.title.trim()) {
        issues.push({
            severity: 'error',
            category: 'metadata',
            message: 'Brak tytułu testu.',
        });
    }
    if (!test.instructions || !test.instructions.trim()) {
        issues.push({
            severity: 'warning',
            category: 'metadata',
            message: 'Brak instrukcji dla osoby badanej.',
        });
    }
    if (!test.sections || test.sections.length === 0) {
        issues.push({
            severity: 'error',
            category: 'questions',
            message: 'Test nie posiada żadnej sekcji pytań.',
        });
    }

    // 2. Question checks
    let unassignedQuestionCount = 0;
    (test.sections || []).forEach((sec, sIdx) => {
        if (!sec.questions || sec.questions.length === 0) {
            issues.push({
                severity: 'warning',
                category: 'questions',
                message: `Sekcja #${sIdx + 1} („${sec.title || 'Bez tytułu'}”) nie zawiera żadnych pytań.`,
            });
        }

        (sec.questions || []).forEach((q, qIdx) => {
            if (!q.text || !q.text.trim()) {
                issues.push({
                    severity: 'error',
                    category: 'questions',
                    message: `Pytanie #${qIdx + 1} w sekcji „${sec.title}” nie ma treści.`,
                });
            }
            if (!q.options || q.options.length < 2) {
                issues.push({
                    severity: 'error',
                    category: 'questions',
                    message: `Pytanie „${(q.text || '').slice(0, 40)}...” ma mniej niż 2 opcje odpowiedzi.`,
                });
            }

            // Check if question awards points to at least one existing scale
            const referencedScales = new Set<string>();
            for (const opt of q.options || []) {
                const rules = q.scoring?.[opt.id] || [];
                for (const r of rules) {
                    if (r.scaleId) {
                        referencedScales.add(r.scaleId);
                        if (!scaleIds.has(r.scaleId)) {
                            issues.push({
                                severity: 'error',
                                category: 'questions',
                                message: `Pytanie „${(q.text || '').slice(0, 40)}...” odwołuje się do nieistniejącej skali ID="${r.scaleId}".`,
                            });
                        }
                    }
                }
            }
            if (referencedScales.size === 0) {
                unassignedQuestionCount++;
            }
        });
    });

    if (unassignedQuestionCount > 0) {
        issues.push({
            severity: test.canonicalId === 'demo-personality-test' ? 'warning' : 'error',
            category: 'questions',
            message: `${unassignedQuestionCount} pytań w teście nie ma przypisanej żadnej skali punktowej.`,
        });
    }

    // 3. Scales & Thresholds (levels) checks
    if (!test.scales || test.scales.length === 0) {
        issues.push({
            severity: test.canonicalId === 'demo-personality-test' ? 'warning' : 'error',
            category: 'scales',
            message: 'Test nie ma zdefiniowanej żadnej skali.',
        });
    }

    for (const scale of test.scales || []) {
        if (scale.type === 'standard') {
            const bounds = calculateScaleScoreBounds(test.sections || [], scale.id);
            if (bounds.questionCount === 0) {
                issues.push({
                    severity: 'error',
                    category: 'scales',
                    message: `Skala standardowa „${scale.name}” (${scale.id}) nie ma przypisanego ani jednego pytania.`,
                });
            } else if (scale.maxScore !== undefined && scale.maxScore !== bounds.maxPossible) {
                issues.push({
                    severity: 'warning',
                    category: 'scales',
                    message: `Skala „${scale.name}”: zadeklarowane maxScore (${scale.maxScore}) różni się od sumy maksymalnych punktów z pytań (${bounds.maxPossible}).`,
                });
            }

            // Check threshold continuity across [minPossible .. maxPossible]
            if (scale.levels && scale.levels.length > 0) {
                const sorted = [...scale.levels].sort((a, b) => a.minScore - b.minScore);
                const maxTarget = scale.maxScore ?? bounds.maxPossible;
                const minTarget = Math.min(0, bounds.minPossible);

                if (sorted[0].minScore > bounds.minPossible && sorted[0].minScore > minTarget) {
                    issues.push({
                        severity: 'warning',
                        category: 'thresholds',
                        message: `Skala „${scale.name}”: najniższy próg zaczyna się od ${sorted[0].minScore} pkt, a minimalny możliwy wynik z pytań to ${bounds.minPossible} pkt.`,
                    });
                }
                if (sorted[sorted.length - 1].maxScore < maxTarget) {
                    issues.push({
                        severity: 'warning',
                        category: 'thresholds',
                        message: `Skala „${scale.name}”: najwyższy próg kończy się na ${sorted[sorted.length - 1].maxScore} pkt, a maksymalny wynik skali to ${maxTarget} pkt.`,
                    });
                }

                for (let i = 1; i < sorted.length; i++) {
                    const prev = sorted[i - 1];
                    const curr = sorted[i];
                    if (curr.minScore > prev.maxScore + 1) {
                        issues.push({
                            severity: 'error',
                            category: 'thresholds',
                            message: `Skala „${scale.name}”: luka między progiem „${prev.name}” (do ${prev.maxScore} pkt) a „${curr.name}” (od ${curr.minScore} pkt).`,
                        });
                    } else if (curr.minScore <= prev.maxScore) {
                        issues.push({
                            severity: 'warning',
                            category: 'thresholds',
                            message: `Skala „${scale.name}”: nakładające się progi „${prev.name}” (do ${prev.maxScore} pkt) oraz „${curr.name}” (od ${curr.minScore} pkt).`,
                        });
                    }
                }
            } else {
                issues.push({
                    severity: 'warning',
                    category: 'thresholds',
                    message: `Skala „${scale.name}” nie ma zdefiniowanych progów punktowych (levels) — użyte zostaną domyślne progi procentowe.`,
                });
            }
        } else if (scale.type === 'calculated') {
            if (!scale.formula || !scale.formula.trim()) {
                issues.push({
                    severity: 'error',
                    category: 'scales',
                    message: `Skala obliczana „${scale.name}” nie ma wpisanej formuły matematycznej.`,
                });
            } else {
                const refs = Array.from(scale.formula.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)).map(m => m[1]);
                for (const refId of refs) {
                    if (!scaleIds.has(refId)) {
                        issues.push({
                            severity: 'error',
                            category: 'scales',
                            message: `Formuła skali „${scale.name}” odwołuje się do nieistniejącej skali {${refId}}.`,
                        });
                    }
                }
                const dummyScores: Record<string, number> = {};
                scaleIds.forEach(id => {
                    dummyScores[id] = 10;
                });
                const evalResult = evaluateFormula(scale.formula, dummyScores);
                if (!Number.isFinite(evalResult)) {
                    issues.push({
                        severity: 'error',
                        category: 'scales',
                        message: `Formuła skali „${scale.name}” (${scale.formula}) zwraca nieprawidłową wartość liczbową.`,
                    });
                }
            }
        }
    }

    // 4. Simulation of first-option and last-option answer vectors
    let simulationSummary: TestAuditReport['simulationSummary'] = null;
    if (allQuestions.length > 0 && allQuestions.every(q => q.options && q.options.length > 0)) {
        try {
            const firstAnswers: Record<string, string[]> = {};
            const lastAnswers: Record<string, string[]> = {};
            for (const q of allQuestions) {
                firstAnswers[q.id] = [q.options[0].id];
                lastAnswers[q.id] = [q.options[q.options.length - 1].id];
            }
            const minScores = calculateTestScores(test, firstAnswers);
            const maxScores = calculateTestScores(test, lastAnswers);
            const interp = buildKeyInterpretation(test, maxScores);

            // Also verify resolveScaleLevel doesn't throw for any scale
            for (const s of test.scales || []) {
                resolveScaleLevel(minScores[s.id] ?? 0, s);
                resolveScaleLevel(maxScores[s.id] ?? 0, s);
            }

            simulationSummary = {
                minScores,
                maxScores,
                interpretationLength: interp.length,
            };
        } catch (err: any) {
            issues.push({
                severity: 'error',
                category: 'simulation',
                message: `Błąd symulacji przeliczenia wyników: ${err?.message || String(err)}`,
            });
        }
    }

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    return {
        testId: test.id,
        title: test.title,
        version: test.version,
        status: test.status,
        questionCount: allQuestions.length,
        scaleCount: (test.scales || []).length,
        passed: errorCount === 0,
        errorCount,
        warningCount,
        issues,
        simulationSummary,
    };
}
