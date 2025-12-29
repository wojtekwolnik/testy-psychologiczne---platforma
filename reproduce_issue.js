/**
 * Reproduction Script for Chained Formulas Bug
 * Run with: node reproduce_issue.js
 */

// --- Mock of the problematic function from apiClient.ts ---

const evaluateFormula = (formula, availableScores) => {
    const populatedFormula = formula.replace(/\{(\w+?)\}/g, (match, scaleId) => {
        return availableScores[scaleId]?.toString() || '0';
    });
    try {
        const calculate = new Function(`return ${populatedFormula}`);
        return calculate();
    } catch (error) {
        return 0;
    }
};

const submitTestMock = (test, answers) => {
    console.log("--- Starting Test Submission Mock ---");
    const standardScores = {};

    // 1. Calculate Standard Scores (Mocking the result of Phase 1)
    test.scales.filter(s => s.type === 'standard').forEach(s => {
        standardScores[s.id] = 10; // Assume every standard scale gets 10 points
    });
    console.log("Standard Scores:", standardScores);

    // 2. Calculate Calculated Scores (The Flawed Logic)
    const calculatedScores = {};
    const calculatedScales = test.scales.filter(s => s.type === 'calculated');

    for (const scale of calculatedScales) {
        // BUG: We are only passing 'standardScores' to evaluateFormula
        // If Scale B depends on Scale A (which is calculated), it will fail.
        calculatedScores[scale.id] = evaluateFormula(scale.formula, standardScores);
    }

    return { ...standardScores, ...calculatedScores };
};

// --- Test Case ---

const testDefinition = {
    scales: [
        { id: 'S1', type: 'standard' },
        { id: 'C1', type: 'calculated', formula: '{S1} * 2' }, // Should be 20
        { id: 'C2', type: 'calculated', formula: '{C1} + 5' }  // Should be 25 (depends on C1)
    ]
};

const results = submitTestMock(testDefinition, {});

console.log("\n--- Results ---");
console.log("S1 (Standard) Expected: 10, Got:", results['S1']);
console.log("C1 (Calc from Std) Expected: 20, Got:", results['C1']);
console.log("C2 (Calc from Calc) Expected: 25, Got:", results['C2']);

if (results['C2'] === 25) {
    console.log("\nSUCCESS: Logic is correct.");
} else {
    console.log("\nFAILURE: Logic is broken. C2 could not see C1 value.");
}
