import { GoogleGenAI } from "@google/genai";
import type { Test, TestResult, ClientAnswer, CalculatedScaleScore, Question, User, AccessCode, PdfTemplate, AggregatedTestInfo, DetailedAggregatedData, AiSettings, PsychometricData, SystemCheckResult, Notification, BrandingSettings, ScaleReliability, QuestionDiscrimination } from '../components/types';
import { MOCK_TESTS, MOCK_RESULTS, MOCK_USERS, MOCK_ACCESS_CODES, MOCK_PDF_TEMPLATES, MOCK_NOTIFICATIONS } from './mockData';
import { UserRole, View } from '../components/types';

// Simulate network latency
const LATENCY = 200;

let tests: Test[] = MOCK_TESTS;
let results: TestResult[] = MOCK_RESULTS;
let users: User[] = MOCK_USERS;
let accessCodes: AccessCode[] = MOCK_ACCESS_CODES;
let pdfTemplates: PdfTemplate[] = MOCK_PDF_TEMPLATES;
let notifications: Notification[] = MOCK_NOTIFICATIONS;

// --- Authentication ---
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (user && user.password === password) {
                // In a real app, never return the password
                const { password, ...userWithoutPassword } = user;
                resolve(userWithoutPassword as User);
            } else {
                resolve(null);
            }
        }, LATENCY);
    });
};

// --- Test Management (with versioning) ---
export const fetchTests = async (latestOnly: boolean = true): Promise<Test[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!latestOnly) {
        resolve(JSON.parse(JSON.stringify(tests)));
        return;
      }
      // Return only the latest version of each test
      const latestVersionsMap = new Map<string, Test>();
      for (const test of tests) {
        const existing = latestVersionsMap.get(test.canonicalId);
        if (!existing || test.version > existing.version) {
          latestVersionsMap.set(test.canonicalId, test);
        }
      }
      resolve(JSON.parse(JSON.stringify(Array.from(latestVersionsMap.values()))));
    }, LATENCY);
  });
};

export const fetchTestById = async (id: string): Promise<Test | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(tests.find(t => t.id === id)))), LATENCY));
};

export const saveTest = async (testData: Test, createNewVersion: boolean = false): Promise<Test> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const isEditingExisting = tests.some(t => t.id === testData.id);

      if (isEditingExisting && createNewVersion) {
        // Create new version
        const existingVersions = tests.filter(t => t.canonicalId === testData.canonicalId);
        const latestVersion = Math.max(...existingVersions.map(t => t.version));
        const newVersionData: Test = {
          ...testData,
          id: `test-${Date.now()}`,
          version: latestVersion + 1,
          createdAt: new Date(),
        };
        tests.push(newVersionData);
        resolve(JSON.parse(JSON.stringify(newVersionData)));
      } else if (isEditingExisting && !createNewVersion) {
        // Overwrite existing version
        const index = tests.findIndex(t => t.id === testData.id);
        tests[index] = { ...testData, createdAt: tests[index].createdAt }; // Preserve original creation date on overwrite
        resolve(JSON.parse(JSON.stringify(tests[index])));
      } else {
        // This is a brand new test (v1)
        const newTest: Test = {
          ...testData,
          id: `test-${Date.now()}`,
          canonicalId: testData.canonicalId || `tid-${Date.now()}`,
          version: 1,
          createdAt: new Date(),
        };
        tests.push(newTest);
        resolve(JSON.parse(JSON.stringify(newTest)));
      }
    }, LATENCY);
  });
};

export const deleteTest = async (testId: string): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            tests = tests.filter(t => t.id !== testId);
            resolve();
        }, LATENCY);
    });
};

export const fetchTestVersions = async (canonicalId: string): Promise<Test[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const versions = tests
                .filter(t => t.canonicalId === canonicalId)
                .sort((a, b) => b.version - a.version);
            resolve(JSON.parse(JSON.stringify(versions)));
        }, LATENCY);
    });
};


// --- PDF Template Management ---
export const fetchPdfTemplates = async (): Promise<PdfTemplate[]> => {
    return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(pdfTemplates))), LATENCY));
};

export const fetchPdfTemplateById = async (id: string): Promise<PdfTemplate | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(pdfTemplates.find(t => t.id === id)))), LATENCY));
};

export const savePdfTemplate = async (template: PdfTemplate): Promise<PdfTemplate> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const index = pdfTemplates.findIndex(t => t.id === template.id);
            if (index !== -1) {
                pdfTemplates[index] = template;
            } else {
                pdfTemplates.push(template);
            }
            resolve(JSON.parse(JSON.stringify(template)));
        }, LATENCY);
    });
};

export const deletePdfTemplate = async (templateId: string): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            pdfTemplates = pdfTemplates.filter(t => t.id !== templateId);
            // Also, nullify this template in any test that uses it
            tests.forEach(test => {
                if (test.defaultTemplateId === templateId) {
                    test.defaultTemplateId = null;
                }
            });
            resolve();
        }, LATENCY);
    });
};


// --- Access Code Management ---
export const generateAccessCode = async (testId: string, therapistId: string, expiresAt: Date): Promise<AccessCode> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newCode: AccessCode = {
                code: `C${Math.random().toString(36).substring(2, 8).toUpperCase()}`, // Random code
                testId: testId,
                isUsed: false,
                generatedBy: therapistId,
                createdAt: new Date(),
                expiresAt: expiresAt,
            };
            accessCodes.push(newCode);
            resolve(JSON.parse(JSON.stringify(newCode)));
        }, LATENCY);
    });
};

export const fetchActiveCodes = async (therapistId: string): Promise<AccessCode[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const now = new Date();
            resolve(JSON.parse(JSON.stringify(accessCodes.filter(c => 
                c.generatedBy === therapistId && 
                !c.isUsed && 
                new Date(c.expiresAt) > now
            ))));
        }, LATENCY);
    });
};

export const getTestIdForCode = async (code: string): Promise<string | null> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const now = new Date();
            const foundCode = accessCodes.find(c => 
                c.code.toUpperCase() === code.toUpperCase() && 
                !c.isUsed && 
                new Date(c.expiresAt) > now
            );
            if (foundCode) {
                resolve(foundCode.testId);
            } else {
                resolve(null);
            }
        }, LATENCY);
    });
};


// --- Result Management ---
export const fetchResults = async (therapistId?: string): Promise<TestResult[]> => {
    return new Promise(resolve => setTimeout(() => {
        if (therapistId) {
            resolve(JSON.parse(JSON.stringify(results.filter(r => r.therapistId === therapistId))));
        } else {
             // For admin or system-wide views in the future
            resolve(JSON.parse(JSON.stringify(results)));
        }
    }, LATENCY));
};

export const fetchResultById = async (id: string): Promise<TestResult | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(results.find(r => r.id === id)))), LATENCY));
};

export const deleteResult = async (resultId: string): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            results = results.filter(r => r.id !== resultId);
            resolve();
        }, LATENCY);
    });
};

const calculateScores = (test: Test, answers: ClientAnswer[]): CalculatedScaleScore[] => {
    const scoreMap: Record<string, number> = {};
    const maxScoreMap: Record<string, number> = {};

    test.scales.forEach(scale => {
        scoreMap[scale.id] = 0;
        maxScoreMap[scale.id] = 0;
    });

    const allQuestions = test.sections.flatMap(s => s.questions);

    allQuestions.forEach((question: Question) => {
        const clientAnswer = answers.find(a => a.questionId === question.id);
        const maxPointsForQuestionPerScale: Record<string, number> = {};

        question.options.forEach(option => {
            const rules = question.scoring[option.id] || [];
            rules.forEach(rule => {
                // Update max score for this question for this scale
                maxPointsForQuestionPerScale[rule.scaleId] = Math.max(maxPointsForQuestionPerScale[rule.scaleId] || 0, rule.points);
                
                if (clientAnswer) {
                    const isSelected = (question.type === 'multiple-select' && clientAnswer.selectedOptionIds?.includes(option.id)) ||
                                     (question.type !== 'multiple-select' && clientAnswer.selectedOptionId === option.id);
                    if (isSelected) {
                        scoreMap[rule.scaleId] = (scoreMap[rule.scaleId] || 0) + rule.points;
                    }
                }
            });
        });
        
        Object.entries(maxPointsForQuestionPerScale).forEach(([scaleId, points]) => {
            maxScoreMap[scaleId] = (maxScoreMap[scaleId] || 0) + points;
        });
    });

    return test.scales.map(scale => ({
        scaleId: scale.id,
        scaleName: scale.name,
        score: scoreMap[scale.id] || 0,
        maxScore: maxScoreMap[scale.id] || 0,
    }));
};

export const submitTest = async (testId: string, answers: ClientAnswer[], clientCode: string): Promise<TestResult> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // --- PRIVACY GUARANTEE ---
            // This function intentionally does NOT collect any client-identifying data
            // such as IP address, browser information, or device details.
            // The only link to the client is the randomly generated, single-use access code.
            // --- END PRIVACY GUARANTEE ---

            const now = new Date();
            const test = tests.find(t => t.id === testId);
            const accessCode = accessCodes.find(c => 
                c.code.toUpperCase() === clientCode.toUpperCase() && 
                !c.isUsed &&
                new Date(c.expiresAt) > now
            );

            if (!test) return reject(new Error("Test not found"));
            if (!accessCode) return reject(new Error("Invalid, used, or expired code"));

            const codeIndex = accessCodes.findIndex(c => c.code === accessCode.code);
            accessCodes[codeIndex].isUsed = true;
            
            const scores = calculateScores(test, answers);

            const newResult: TestResult = {
                id: `result-${Date.now()}`,
                testId,
                testVersion: test.version,
                testTitle: test.title,
                clientIdentifier: clientCode.toUpperCase(),
                completedAt: new Date(),
                answers,
                scores,
                therapistId: accessCode.generatedBy,
            };

            results.push(newResult);

            // Create a notification for the therapist
            const notification: Notification = {
                id: `notif-${Date.now()}`,
                userId: accessCode.generatedBy,
                message: `Klient ${newResult.clientIdentifier} ukończył test "${test.title}".`,
                createdAt: new Date(),
                isRead: false,
                context: {
                    view: View.ReportView,
                    params: { resultId: newResult.id }
                }
            };
            notifications.push(notification);

            console.log(`[SYMULACJA E-MAIL] Powiadomienie do terapeuty (${accessCode.generatedBy}) o nowym wyniku dla testu "${test.title}" (klient: ${newResult.clientIdentifier}) zostałoby wysłane przy użyciu skonfigurowanych ustawień SMTP.`);
            resolve(newResult);
        }, LATENCY);
    });
};

// --- User Management ---
export const fetchUsers = async (): Promise<User[]> => {
  return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(users.map(({ password, ...user}) => user)))), LATENCY));
};

export const saveUser = async (user: User): Promise<User> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        // Preserve password if it's not being changed
        const existingPassword = users[index].password;
        users[index] = { ...user, password: user.password || existingPassword };
      } else {
        users.push({ ...user, password: user.password || 'defaultPassword' }); // Set a default or require it
      }
      const { password, ...userWithoutPassword } = user;
      resolve(JSON.parse(JSON.stringify(userWithoutPassword)));
    }, LATENCY);
  });
};

export const deleteUser = async (userId: string): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            users = users.filter(u => u.id !== userId);
            resolve();
        }, LATENCY);
    });
};

// --- AI Service ---
export const getAiInterpretation = async (result: TestResult, test: Test, aiSettings: AiSettings): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key for Gemini is not configured in environment variables.");
    }
    
    const scoresSummary = result.scores.map(s => 
        s.maxScore > 0 ? `- ${s.scaleName}: ${s.score} / ${s.maxScore} (${((s.score / s.maxScore) * 100).toFixed(0)}%)` : `- ${s.scaleName}: ${s.score}`
    ).join('\n');

    const scalesDescription = test.scales.map(s =>
        `- ${s.name}: ${s.description}`
    ).join('\n');

    const userPrompt = `
Proszę o analizę poniższych zanonimizowanych wyników testu psychologicznego.

**Tytuł Testu:** ${test.title}

**Opis Skal:**
${scalesDescription}

**Uzyskane Wyniki:**
${scoresSummary}

Zgodnie z podaną instrukcją systemową, przedstaw zwięzłą, profesjonalną i neutralną interpretację tych wyników. Wskaż potencjalne wzorce i obszary do dalszej eksploracji. Nie stawiaj diagnozy.
    `;
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: aiSettings.model || 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: aiSettings.systemPrompt,
            },
        });
        
        return response.text;
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        throw new Error(`Błąd komunikacji z API Gemini: ${error.message}`);
    }
};

// --- Notification Service ---
export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const userNotifications = notifications
                .filter(n => n.userId === userId)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            resolve(JSON.parse(JSON.stringify(userNotifications)));
        }, LATENCY);
    });
};

export const markNotificationsAsRead = async (userId: string, notificationIds: string[]): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            notifications = notifications.map(n => {
                if (n.userId === userId && notificationIds.includes(n.id)) {
                    return { ...n, isRead: true };
                }
                return n;
            });
            resolve();
        }, LATENCY / 2);
    });
};

// --- Aggregated Data Service ---
export const fetchTestsForAggregation = async (): Promise<AggregatedTestInfo[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const latestTestsMap = new Map<string, Test>();
            for (const test of tests) {
                const existing = latestTestsMap.get(test.canonicalId);
                if (!existing || test.version > existing.version) {
                    latestTestsMap.set(test.canonicalId, test);
                }
            }
            const latestTests = Array.from(latestTestsMap.values());

            const aggregatedInfo: AggregatedTestInfo[] = latestTests.map(test => {
                const completionCount = results.filter(r => r.testId === test.id).length;
                return {
                    testId: test.id,
                    testTitle: test.title,
                    version: test.version,
                    completionCount: completionCount,
                };
            }).filter(info => info.completionCount > 0);

            resolve(JSON.parse(JSON.stringify(aggregatedInfo)));
        }, LATENCY);
    });
};

export const fetchDetailedAggregatedDataForTest = async (testId: string): Promise<DetailedAggregatedData> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const test = tests.find(t => t.id === testId);
            if (!test) return reject(new Error("Test not found"));

            const relevantResults = results.filter(r => r.testId === testId);
            const completionCount = relevantResults.length;
            const allQuestions = test.sections.flatMap(s => s.questions);

            const maxScoreMap: Record<string, number> = {};
            test.scales.forEach(scale => maxScoreMap[scale.id] = 0);
            allQuestions.forEach((question: Question) => {
                const maxPointsForQuestionPerScale: Record<string, number> = {};
                question.options.forEach(option => {
                    const rules = question.scoring[option.id] || [];
                    rules.forEach(rule => {
                        maxPointsForQuestionPerScale[rule.scaleId] = Math.max(maxPointsForQuestionPerScale[rule.scaleId] || 0, rule.points);
                    });
                });
                Object.entries(maxPointsForQuestionPerScale).forEach(([scaleId, points]) => {
                    maxScoreMap[scaleId] = (maxScoreMap[scaleId] || 0) + points;
                });
            });
            
            const scoreDistribution: Record<string, { bin: string; count: number }[]> = {};
            test.scales.forEach(scale => {
                const scoresForScale = relevantResults.map(r => r.scores.find(s => s.scaleId === scale.id)?.score || 0);
                const maxScore = maxScoreMap[scale.id] || 1;
                const binCount = 5;
                const binSize = Math.ceil(maxScore / binCount) || 1;
                const bins: Record<string, number> = {};
                for (let i = 0; i < binCount; i++) {
                    const start = i * binSize;
                    const end = Math.min((i + 1) * binSize - 1, maxScore);
                    bins[`${start}-${end}`] = 0;
                }
                scoresForScale.forEach(score => {
                    const binIndex = Math.floor(score / binSize);
                    const start = binIndex * binSize;
                    const end = Math.min((binIndex + 1) * binSize - 1, maxScore);
                    const binLabel = `${start}-${end}`;
                    if (bins.hasOwnProperty(binLabel)) {
                        bins[binLabel]++;
                    }
                });
                scoreDistribution[scale.id] = Object.entries(bins).map(([bin, count]) => ({ bin, count }));
            });

            const answerFrequency: Record<string, { name: string; value: number }[]> = {};
            allQuestions.forEach(q => {
                const frequencies: Record<string, number> = {};
                q.options.forEach(o => frequencies[o.id] = 0);
                relevantResults.forEach(r => {
                    const answer = r.answers.find(a => a.questionId === q.id);
                    if (!answer) return;
                    const ids = answer.selectedOptionId ? [answer.selectedOptionId] : answer.selectedOptionIds || [];
                    ids.forEach(id => {
                        if (frequencies.hasOwnProperty(id)) frequencies[id]++;
                    });
                });
                answerFrequency[q.id] = Object.entries(frequencies).map(([optionId, count]) => ({
                    name: q.options.find(o => o.id === optionId)?.text || 'Unknown',
                    value: count
                }));
            });

            resolve({ testId, testTitle: test.title, completionCount, scales: test.scales, scoreDistribution, answerFrequency });
        }, LATENCY);
    });
};

export const fetchPsychometricData = async (testId: string): Promise<PsychometricData | null> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const test = tests.find(t => t.id === testId);
            if (!test) return reject(new Error("Test not found"));
            const relevantResults = results.filter(r => r.testId === testId);
            if (relevantResults.length < 1) return resolve(null); // Not enough data

            const allQuestions = test.sections.flatMap(s => s.questions);
            const scaleReliability: ScaleReliability[] = test.scales.map(scale => ({
                scaleId: scale.id, scaleName: scale.name, cronbachsAlpha: 0.7 + Math.random() * 0.25,
            }));
            const questionDiscrimination: QuestionDiscrimination[] = [];
            allQuestions.forEach(q => {
                const relatedScaleIds = new Set(Object.values(q.scoring).flat().map(rule => rule.scaleId));
                relatedScaleIds.forEach(scaleId => {
                    questionDiscrimination.push({
                        questionId: q.id, questionText: q.text.replace(/<[^>]*>?/gm, ''), scaleId: scaleId, discriminationIndex: 0.15 + Math.random() * 0.4, difficultyIndex: 0.2 + Math.random() * 0.6,
                    });
                });
            });
            resolve({ testId, completionCount: relevantResults.length, scaleReliability, questionDiscrimination });
        }, LATENCY * 2);
    });
};

// --- System Health ---
export const runSystemHealthCheck = async (branding: BrandingSettings): Promise<SystemCheckResult[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const checkResults: SystemCheckResult[] = [];
            checkResults.push({ module: 'API Service', status: 'OK', message: 'Główny serwis API odpowiada poprawnie.' });
            checkResults.push({ module: 'Baza Danych', status: 'OK', message: 'Połączenie z bazą danych jest aktywne.', details: 'Symulacja połączenia z lokalną bazą danych (LocalStorage/pamięć).' });

            const { aiSettings, emailSettings } = branding;
            if (!aiSettings.enabled) {
                checkResults.push({ module: 'Asystent AI', status: 'DEGRADED', message: 'Funkcja asystenta AI jest wyłączona w ustawieniach.', details: 'Włącz i skonfiguruj asystenta AI w panelu administratora, aby uruchomić pełną diagnostykę.' });
            } else if (!process.env.API_KEY && !aiSettings.apiKey) {
                checkResults.push({ module: 'Asystent AI', status: 'FAIL', message: 'Brak klucza API dla usługi Gemini.', details: 'Klucz API nie został znaleziony ani w ustawieniach, ani w zmiennych środowiskowych.' });
            } else {
                checkResults.push({ module: 'Asystent AI (Gemini)', status: 'OK', message: 'Konfiguracja usługi AI jest poprawna.', details: `Model: ${aiSettings.model}. Połączenie symulowane.` });
            }

            if (!emailSettings?.smtp?.host) {
                checkResults.push({ module: 'Powiadomienia E-mail (SMTP)', status: 'DEGRADED', message: 'Serwer SMTP nie jest skonfigurowany.', details: 'Uzupełnij konfigurację w panelu administratora, aby włączyć powiadomienia e-mail.' });
            } else {
                checkResults.push({ module: 'Powiadomienia E-mail (SMTP)', status: 'OK', message: 'Konfiguracja serwera SMTP wygląda poprawnie.', details: `Host: ${emailSettings.smtp.host}:${emailSettings.smtp.port}. Połączenie symulowane.` });
            }
            resolve(checkResults);
        }, LATENCY * 3);
    });
};