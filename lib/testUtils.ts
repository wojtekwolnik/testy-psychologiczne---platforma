import crypto from 'crypto';
import type { Scale, Section, Test, Question } from '@/components/types';

/**
 * Remaps scale, section, and question IDs so a cloned test version or imported JSON test
 * never collides with primary keys of existing Scale/Section/Question rows in PostgreSQL,
 * while preserving all formula and scoring references.
 */
export function remapTestEntityIds(
    scales: Scale[],
    sections: Section[]
): { remappedScales: Scale[]; remappedSections: Section[] } {
    const scaleIdMap = new Map<string, string>();
    for (const s of scales) {
        const suffix = crypto.randomBytes(4).toString('hex');
        scaleIdMap.set(s.id, `s-${suffix}`);
    }

    const remappedScales: Scale[] = scales.map(s => {
        const newId = scaleIdMap.get(s.id) || s.id;
        let newFormula = s.formula;
        if (newFormula) {
            newFormula = newFormula.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_m, refId) => {
                const mapped = scaleIdMap.get(refId) || refId;
                return `{${mapped}}`;
            });
        }
        return {
            ...s,
            id: newId,
            formula: newFormula,
        };
    });

    const remappedSections: Section[] = sections.map(sec => ({
        ...sec,
        id: `sec-${crypto.randomBytes(4).toString('hex')}`,
        questions: sec.questions.map(q => {
            const newScoring: Record<string, any[]> = {};
            for (const [optId, rules] of Object.entries(q.scoring || {})) {
                if (Array.isArray(rules)) {
                    newScoring[optId] = rules.map(r => ({
                        ...r,
                        scaleId: scaleIdMap.get(r.scaleId) || r.scaleId,
                    }));
                }
            }
            return {
                ...q,
                id: `q-${crypto.randomBytes(4).toString('hex')}`,
                scoring: newScoring,
            };
        }),
    }));

    return { remappedScales, remappedSections };
}

/**
 * Strips out all scoring keys, scale definitions, and formulas from a Test object
 * before sending it to the client browser so answers cannot be reverse-engineered in DevTools.
 */
export function sanitizeTestForPublicClient(test: Test): Test {
    return {
        ...test,
        scales: [],
        sections: (test.sections || []).map(sec => ({
            ...sec,
            questions: (sec.questions || []).map(q => ({
                ...q,
                type: q.type as Question['type'],
                options: (q.options || []).map((opt: any) => ({
                    id: opt.id,
                    text: opt.text,
                })),
                scoring: {},
            })),
        })),
    };
}

/**
 * Escapes a single CSV cell and wraps it in double quotes.
 */
export function escapeCsvCell(val: unknown): string {
    const str = val === null || val === undefined ? '' : String(val);
    return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Builds a complete UTF-8 BOM semicolon-separated CSV string ready for Polish Excel.
 */
export function buildCsvContent(headers: string[], rows: unknown[][]): string {
    const headerLine = headers.map(escapeCsvCell).join(';');
    const rowLines = rows.map(r => r.map(escapeCsvCell).join(';'));
    return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Generates a cryptographically random access code in AC-XXXXXXXX format
 * and normalizes user-entered codes.
 */
export function createAccessCodeString(): string {
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `AC-${randomPart}`;
}

export function normalizeAccessCodeInput(raw: string | undefined | null): string {
    return (raw || '').trim().toUpperCase();
}
