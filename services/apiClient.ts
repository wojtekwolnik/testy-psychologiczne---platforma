
import { type User, type Test, type TestResult, type AccessCode, type PdfTemplate, type Scale, type Question, UserRole } from '../components/types';
import { generateUniqueId } from '../utils/idUtils';
import { evaluate } from 'mathjs';

// In-memory "database" for mock data
const mockUsers: User[] = [
    {
        id: 'admin-user-id',
        username: 'Admin User',
        email: 'admin@example.com',
        role: UserRole.Admin,
        createdAt: new Date().toISOString(),
        fullName: 'Administrator'
    },
    {
        id: 'therapist-user-id',
        username: 'Therapist User',
        email: 'therapist@example.com',
        role: UserRole.Therapist,
        createdAt: new Date().toISOString(),
        fullName: 'Terapeuta'
    },
];

let mockTests: Test[] = [
    {
        id: "test-1",
        canonicalId: "wielka-piatka-v1",
        version: 1,
        title: "Test Osobowości 'Wielka Piątka'",
        description: "Test mierzący pięć głównych czynników osobowości.",
        instructions: "Instrukcje...",
        questionsPerPage: null,
        defaultTemplateId: null,
        scales: [
            { type: 'standard', id: "scale-n", name: "Neurotyczność", description: "...", maxScore: 50 },
            { type: 'standard', id: "scale-e", name: "Ekstrawersja", description: "...", maxScore: 50 },
            { type: 'standard', id: "scale-o", name: "Otwartość na Doświadczenie", description: "...", maxScore: 50 },
            { type: 'standard', id: "scale-a", name: "Ugodowość", description: "...", maxScore: 50 },
            { type: 'standard', id: "scale-c", name: "Sumienność", description: "...", maxScore: 50 },
            { type: 'calculated', id: "scale-consc-extra", name: "Wskaźnik Sumienność-Ekstrawersja", description: "Złożony wskaźnik...", formula: "{scale-c} + {scale-e}" },
        ],
        sections: [],
        status: 'PUBLISHED',
        createdAt: new Date().toISOString()
    }
];
let mockResults: TestResult[] = [
    {
        id: 'res-1',
        testId: 'test-1',
        testTitle: "Test Osobowości 'Wielka Piątka'",
        testVersion: 1,
        therapistId: 'therapist-user-id',
        clientIdentifier: 'Klient_A',
        completedAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
        scores: { 'scale-n': 30, 'scale-e': 45 },
        answers: {},
    },
    {
        id: 'res-2',
        testId: 'test-1',
        testTitle: "Test Osobowości 'Wielka Piątka'",
        testVersion: 1,
        therapistId: 'another-therapist-id', // Belongs to a different therapist
        clientIdentifier: 'Klient_B',
        completedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        scores: { 'scale-n': 25, 'scale-e': 40 },
        answers: {},
    },
];
let mockTemplates: PdfTemplate[] = [];
let mockAccessCodes: AccessCode[] = [
    {
        code: 'VALID123',
        testId: 'test-1',
        therapistId: 'therapist-user-id',
        isUsed: false,
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
    },
    {
        code: 'TAKEN456',
        testId: 'test-1',
        therapistId: 'another-therapist-id',
        isUsed: false,
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    },
];

// --- NEW: Authentication Logic ---

// Mock session storage
let currentSession: { userId: string } | null = null;

const getUserIdFromSession = (): string | null => {
    // In a real app, this would get the user ID from a JWT token or server session.
    return currentSession ? currentSession.userId : null;
};

export const checkAuthStatus = async (): Promise<User> => {
    const userId = getUserIdFromSession();
    if (userId) {
        const user = mockUsers.find(u => u.id === userId);
        if (user) return Promise.resolve(user);
    }
    return Promise.reject("No active session");
};

export const login = async (email: string, password: string) => {
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
        throw new Error("Nie znaleziono użytkownika o podanym adresie email.");
    }
    // In a real app, you would verify the password hash
    console.log(`[API MOCK] Authenticating ${email}`);

    // Simulate 2FA requirement for the admin user
    if (user.role === UserRole.Admin) {
        return Promise.resolve({ needs2FA: true, user });
    }

    currentSession = { userId: user.id };
    return Promise.resolve({ needs2FA: false, user });
};

export const verify2FA = async (userId: string, code: string): Promise<User> => {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error("User not found for 2FA verification.");

    // Simulate code verification. In a real app, use a library like `otplib`.
    if (code === "123456") { // Mock valid code
        currentSession = { userId: user.id };
        return Promise.resolve(user);
    }
    throw new Error("Nieprawidłowy kod weryfikacyjny.");
};

export const logout = async (): Promise<void> => {
    currentSession = null;
    return Promise.resolve();
};



// --- NEW: Formula Evaluation Logic ---

// A safe, simple function to evaluate mathematical formulas from strings.
const evaluateFormula = (formula: string, availableScores: Record<string, number>): number => {
    // Replace {scale-id} with the actual score
    const populatedFormula = formula.replace(/\{(\w+?-\w+?)\}/g, (match, scaleId) => {
        return availableScores[scaleId]?.toString() || '0';
    });

    try {
        const result = evaluate(populatedFormula);

        if (typeof result !== 'number' || !isFinite(result) || isNaN(result)) {
            return 0;
        }
        return result;
    } catch (error) {
        console.error(`[Formula Error] Could not evaluate: "${populatedFormula}"`, error);
        return 0; // Return 0 if formula is invalid
    }
};


// --- UPDATED: Test Submission Logic ---

export const submitTest = async (testId: string, answers: Record<string, string[]>, clientIdentifier: string): Promise<TestResult> => {
    console.log(`[API MOCK] Submitting test ${testId} for client ${clientIdentifier}`);
    const test = await fetchTestById(testId);
    if (!test) throw new Error("Test not found");

    const standardScores: Record<string, number> = {};
    const standardScales = test.scales.filter(s => s.type === 'standard') as Scale[];

    // Phase 1: Calculate Standard Scores
    for (const scale of standardScales) {
        standardScores[scale.id] = 0;
    }

    for (const section of test.sections) {
        for (const question of section.questions) {
            const givenAnswer = answers[question.id];
            if (!givenAnswer) continue;

            const answerIds = Array.isArray(givenAnswer) ? givenAnswer : [givenAnswer];
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

    // Phase 2: Calculate Calculated Scores (Iterative for Chained Formulas)
    const calculatedScores: Record<string, number> = {};
    const calculatedScales = test.scales.filter(s => s.type === 'calculated');

    // Initialize calculated scores with 0 or base values
    calculatedScales.forEach(s => calculatedScores[s.id] = 0);

    let iterations = 0;
    let scoresChanged = true;
    const maxIterations = 10; // Prevent infinite loops (e.g. A depends on B, B depends on A)

    // Merge standard scores initially
    let currentAllScores = { ...standardScores, ...calculatedScores };

    while (scoresChanged && iterations < maxIterations) {
        scoresChanged = false;
        iterations++;

        for (const scale of calculatedScales) {
            if (scale.type === 'calculated' && scale.formula) {
                const oldValue = calculatedScores[scale.id];
                const newValue = evaluateFormula(scale.formula, currentAllScores);

                // Check if value changed significantly (epsilon for float comparison if needed, but strict equality is fine for now)
                if (newValue !== oldValue) {
                    calculatedScores[scale.id] = newValue;
                    currentAllScores[scale.id] = newValue; // Update context for next calculations in this pass or next pass
                    scoresChanged = true;
                }
            }
        }
    }

    if (iterations === maxIterations) {
        console.warn("[API MOCK] Max iterations reached in score calculation. Possible circular dependency.");
    }

    // Phase 3: Combine and Store Result
    const finalScores = { ...standardScores, ...calculatedScores };

    const newResult: TestResult = {
        id: generateUniqueId('res'),
        testId: test.id,
        testTitle: test.title,
        testVersion: test.version,
        therapistId: getUserIdFromSession() || 'unknown-therapist',
        clientIdentifier,
        completedAt: new Date().toISOString(),
        scores: finalScores,
        answers
    };

    mockResults.push(newResult);
    console.log("[API MOCK] New result created:", newResult);
    return JSON.parse(JSON.stringify(newResult));
};

// --- Other API functions... (mostly unchanged) ---

export const saveTest = async (test: Test, asNewVersion: boolean): Promise<Test> => {
    console.log(`[API MOCK] Saving test: ${test.title}, asNewVersion: ${asNewVersion}`);
    if (asNewVersion) {
        const newVersion = {
            ...test,
            id: `test-${Date.now()}`,
            version: (test.version || 1) + 1,
            createdAt: new Date().toISOString(),
        };
        mockTests.push(newVersion);
        return Promise.resolve(JSON.parse(JSON.stringify(newVersion)));
    } else {
        const index = mockTests.findIndex(t => t.id === test.id);
        if (index !== -1) {
            mockTests[index] = test;
        } else {
            mockTests.push(test);
        }
        return Promise.resolve(JSON.parse(JSON.stringify(test)));
    }
};

export const fetchTestById = async (testId: string): Promise<Test | null> => {
    const test = mockTests.find(t => t.id === testId);
    return test ? Promise.resolve(JSON.parse(JSON.stringify(test))) : Promise.resolve(null);
};

export const fetchTests = async (): Promise<Test[]> => Promise.resolve(JSON.parse(JSON.stringify(mockTests)));
export const fetchPdfTemplates = async (): Promise<PdfTemplate[]> => Promise.resolve(JSON.parse(JSON.stringify(mockTemplates)));
export const fetchResults = async (): Promise<TestResult[]> => {
    const userId = getUserIdFromSession();
    const user = mockUsers.find(u => u.id === userId);

    if (user?.role === UserRole.Admin) {
        return Promise.resolve(JSON.parse(JSON.stringify(mockResults)));
    }

    if (user?.role === UserRole.Therapist) {
        const therapistResults = mockResults.filter(r => r.therapistId === userId);
        return Promise.resolve(JSON.parse(JSON.stringify(therapistResults)));
    }

    return Promise.resolve([]); // Return empty if no user or wrong role
};

// ... other functions ...
export const fetchPdfTemplateById = async (templateId: string): Promise<PdfTemplate | null> => null;
export const savePdfTemplate = async (template: PdfTemplate): Promise<PdfTemplate> => template;
export const deletePdfTemplate = async (templateId: string): Promise<{}> => ({});
export const getSetupStatus = async () => ({ needsSetup: false });
export const findUserByEmail = async () => null;
export const authenticateUser = async () => null;
export const getUserById = async () => null;
export const getAllUsers = async () => [];
export const getTestByCanonicalId = async (id: string) => mockTests.find(t => t.canonicalId === id) || null;
export const createTestResult = async () => ({});
export const getTestResultById = async () => null;
export const getAccessCode = async () => null;
export const markAccessCodeAsUsed = async () => ({});
export const getNotificationsForUser = async () => [];
export const getAppSettings = async () => null;
export const updateAppSettings = async () => ({});
export const fetchNotifications = async () => [];
export const getTestIdForCode = async () => null;
export const checkTestStatus = async (clientCode?: string) => ({ status: 'new' });
export const fetchResultById = async (resultId: string): Promise<TestResult | null> => {
    const userId = getUserIdFromSession();
    const user = mockUsers.find(u => u.id === userId);
    const result = mockResults.find(r => r.id === resultId);

    if (!result) return Promise.resolve(null);

    // Admins can see any result
    if (user?.role === UserRole.Admin) {
        return Promise.resolve(JSON.parse(JSON.stringify(result)));
    }

    // Therapists can only see their own results
    if (user?.role === UserRole.Therapist && result.therapistId === userId) {
        return Promise.resolve(JSON.parse(JSON.stringify(result)));
    }

    // Deny access otherwise
    return Promise.reject(new Error("Access Denied: You do not have permission to view this result."));
};
export const getAiInterpretation = async () => ({ interpretation: 'Mock AI interpretation' });
export const fetchTestVersions = async (canonicalId: string) => mockTests.filter(t => t.canonicalId === canonicalId);
export const generateAccessCode = async (testId: string, expiresAt: Date) => ({ code: `MOCK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, testId, therapistId: getUserIdFromSession() || 'therapist-from-token', isUsed: false, expiresAt: expiresAt.toISOString(), createdAt: new Date().toISOString() });
export const fetchActiveCodes = async (): Promise<AccessCode[]> => {
    const userId = getUserIdFromSession();
    const user = mockUsers.find(u => u.id === userId);

    if (user?.role === UserRole.Admin) {
        return Promise.resolve(JSON.parse(JSON.stringify(mockAccessCodes)));
    }

    if (user?.role === UserRole.Therapist) {
        const therapistCodes = mockAccessCodes.filter(c => c.therapistId === userId);
        return Promise.resolve(JSON.parse(JSON.stringify(therapistCodes)));
    }

    return Promise.resolve([]);
};
export const deleteResult = async (resultId: string) => ({});
export const saveUser = async (user: any) => user;
export const deleteUser = async (userId: string) => ({});
export const fetchTestsForAggregation = async () => [];
export const fetchDetailedAggregatedDataForTest = async (testId: string) => ({ scales: [], scoreDistribution: {}, answerFrequency: {} });
export const fetchPsychometricData = async (testId: string) => null;
export const runSystemHealthCheck = async (branding: any) => [];
export const markNotificationsAsRead = async (userId: string, notificationIds: string[]) => ({});
