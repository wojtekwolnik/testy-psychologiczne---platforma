import type { Test, TestResult, User, AccessCode, PdfTemplate, Notification } from '../components/types';
import { UserRole } from '../components/types';

export const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Jan Kowalski', email: 'admin@example.com', password: 'admin123', role: UserRole.Admin, twoFactorEnabled: true },
    { id: 'user-2', name: 'Anna Nowak', email: 'terapeuta@example.com', password: 'terapeuta123', role: UserRole.Therapist, twoFactorEnabled: true },
];

export const MOCK_ACCESS_CODES: AccessCode[] = [
    { code: 'TEST-123', testId: 'test-1-v2', isUsed: false, generatedBy: 'user-2', createdAt: new Date(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
];

export const MOCK_NOTIFICATIONS: Notification[] = [];

export const MOCK_PDF_TEMPLATES: PdfTemplate[] = [
    {
        id: 'tpl-default',
        name: 'Domyślny szablon raportu',
        includeBarChart: true,
        includePieChart: true,
        includeDetailedAnswers: true,
        includeHeader: true,
        includeClientInfo: true,
        includeScoresTable: true,
        customHeaderText: 'Poufny Raport Psychologiczny',
    },
    {
        id: 'tpl-summary',
        name: 'Tylko podsumowanie wizualne',
        includeBarChart: true,
        includePieChart: true,
        includeDetailedAnswers: false,
        includeHeader: true,
        includeClientInfo: false,
        includeScoresTable: false,
        customHeaderText: '',
    }
];

export const MOCK_TESTS: Test[] = [
  {
    id: 'test-1-v1',
    canonicalId: 'tid-1',
    version: 1,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    title: 'Ocena Nastroju i Lęku Społecznego',
    description: 'Krótka ankieta służąca do oceny poziomu lęku społecznego i ogólnego nastroju.',
    instructions: 'Proszę odpowiedzieć na wszystkie pytania szczerze. Twoje wyniki są poufne i zostaną udostępnione wyłącznie Twojemu terapeucie.',
    questionsPerPage: 3,
    defaultTemplateId: 'tpl-default',
    scales: [
      { id: 'scale-1', name: 'Lęk Społeczny', description: 'Mierzy dyskomfort w sytuacjach społecznych.' },
      { id: 'scale-2', name: 'Nastrój Depresyjny', description: 'Mierzy symptomy związane z obniżonym nastrojem i anhedonią.' },
    ],
    sections: [
        {
            id: 'sec-1',
            title: 'Część A: Sytuacje społeczne',
            questions: [
                 {
                    id: 'q-1',
                    text: 'Czuję niepokój, gdy muszę przemawiać przed grupą.',
                    type: 'likert-5',
                    options: [
                      { id: 'q1-o1', text: 'Zdecydowanie nie' },
                      { id: 'q1-o2', text: 'Raczej nie' },
                      { id: 'q1-o3', text: 'Ani tak, ani nie' },
                      { id: 'q1-o4', text: 'Raczej tak' },
                      { id: 'q1-o5', text: 'Zdecydowanie tak' },
                    ],
                    scoring: { 'q1-o1': [{ scaleId: 'scale-1', points: 0 }], 'q1-o2': [{ scaleId: 'scale-1', points: 1 }], 'q1-o3': [{ scaleId: 'scale-1', points: 2 }], 'q1-o4': [{ scaleId: 'scale-1', points: 3 }], 'q1-o5': [{ scaleId: 'scale-1', points: 4 }],},
                },
            ]
        }
    ]
  },
  {
    id: 'test-1-v2',
    canonicalId: 'tid-1',
    version: 2,
    createdAt: new Date(),
    title: 'Ocena Nastroju i Lęku Społecznego (Wersja 2)',
    description: 'Zaktualizowana ankieta służąca do oceny poziomu lęku społecznego i ogólnego nastroju.',
    instructions: 'Proszę odpowiedzieć na wszystkie pytania szczerze. Twoje wyniki są poufne i zostaną udostępnione wyłącznie Twojemu terapeucie.',
    questionsPerPage: 3,
    defaultTemplateId: 'tpl-default',
    scales: [
      { id: 'scale-1', name: 'Lęk Społeczny', description: 'Mierzy dyskomfort w sytuacjach społecznych.' },
      { id: 'scale-2', name: 'Nastrój Depresyjny', description: 'Mierzy symptomy związane z obniżonym nastrojem i anhedonią.' },
      { id: 'scale-3', name: 'Pozytywne Nastawienie', description: 'Mierzy ogólny optymizm i pozytywne uczucia.' },
    ],
    sections: [
        {
            id: 'sec-1',
            title: 'Część A: Sytuacje społeczne',
            questions: [
                 {
                    id: 'q-1',
                    text: 'Czuję niepokój, gdy muszę przemawiać przed grupą.',
                    type: 'likert-5',
                    options: [
                      { id: 'q1-o1', text: 'Zdecydowanie nie' },
                      { id: 'q1-o2', text: 'Raczej nie' },
                      { id: 'q1-o3', text: 'Ani tak, ani nie' },
                      { id: 'q1-o4', text: 'Raczej tak' },
                      { id: 'q1-o5', text: 'Zdecydowanie tak' },
                    ],
                    scoring: { 'q1-o1': [{ scaleId: 'scale-1', points: 0 }], 'q1-o2': [{ scaleId: 'scale-1', points: 1 }], 'q1-o3': [{ scaleId: 'scale-1', points: 2 }], 'q1-o4': [{ scaleId: 'scale-1', points: 3 }], 'q1-o5': [{ scaleId: 'scale-1', points: 4 }],},
                },
                {
                    id: 'q-4',
                    text: 'Unikam spotkań towarzyskich, ponieważ boję się oceny.',
                    type: 'multiple-choice',
                    options: [ { id: 'q4-o1', text: 'Nigdy' }, { id: 'q4-o2', text: 'Czasami' }, { id: 'q4-o3', text: 'Często' }, { id: 'q4-o4', text: 'Prawie zawsze' },],
                    scoring: { 'q4-o1': [{ scaleId: 'scale-1', points: 0 }], 'q4-o2': [{ scaleId: 'scale-1', points: 1 }], 'q4-o3': [{ scaleId: 'scale-1', points: 2 }], 'q4-o4': [{ scaleId: 'scale-1', points: 3 }],},
                },
            ]
        },
        {
            id: 'sec-2',
            title: 'Część B: Samopoczucie',
            questions: [
                {
                    id: 'q-2',
                    text: 'W ciągu ostatnich dwóch tygodni czułem/am się przygnębiony/a, w depresji lub bez nadziei.',
                    type: 'multiple-choice',
                    options: [ { id: 'q2-o1', text: 'Wcale' }, { id: 'q2-o2', text: 'Przez kilka dni' }, { id: 'q2-o3', text: 'Przez więcej niż połowę dni' }, { id: 'q2-o4', text: 'Niemal codziennie' },],
                    scoring: { 'q2-o1': [{ scaleId: 'scale-2', points: 0 }], 'q2-o2': [{ scaleId: 'scale-2', points: 1 }], 'q2-o3': [{ scaleId: 'scale-2', points: 2 }], 'q2-o4': [{ scaleId: 'scale-2', points: 3 }],},
                },
                {
                    id: 'q-3',
                    text: 'Patrzę w przyszłość z nadzieją i entuzjazmem.',
                    type: 'multiple-choice',
                    options: [ { id: 'q3-o1', text: 'Zdecydowanie się nie zgadzam' }, { id: 'q3-o2', text: 'Nie zgadzam się' }, { id: 'q3-o3', text: 'Zgadzam się' }, { id: 'q3-o4', text: 'Zdecydowanie się zgadzam' },],
                    scoring: { 'q3-o1': [{ scaleId: 'scale-3', points: 0 }], 'q3-o2': [{ scaleId: 'scale-3', points: 1 }], 'q3-o3': [{ scaleId: 'scale-3', points: 2 }], 'q3-o4': [{ scaleId: 'scale-3', points: 3 }],},
                },
                 {
                    id: 'q-5',
                    text: 'Martwię się przyszłością i jednocześnie czuję smutek.',
                    type: 'multiple-choice',
                    options: [ { id: 'q5-o1', text: 'Nigdy' }, { id: 'q5-o2', text: 'Czasem' }, { id: 'q5-o3', text: 'Często' },],
                    scoring: { 'q5-o1': [{ scaleId: 'scale-1', points: 0 }, { scaleId: 'scale-2', points: 0 }], 'q5-o2': [{ scaleId: 'scale-1', points: 1 }, { scaleId: 'scale-2', points: 1 }], 'q5-o3': [{ scaleId: 'scale-1', points: 2 }, { scaleId: 'scale-2', points: 2 }],},
                },
            ]
        }
    ]
  },
  {
    id: 'test-dass42-v1',
    canonicalId: 'tid-dass42',
    version: 1,
    createdAt: new Date(),
    title: 'Skala Depresji, Lęku i Stresu (DASS-42)',
    description: 'Kwestionariusz samooceny mierzący trzy negatywne stany emocjonalne: depresję, lęk i stres. Składa się z 42 pytań.',
    instructions: 'Przeczytaj każde stwierdzenie i zdecyduj, jak bardzo odnosiło się ono do Ciebie <strong>w ciągu ostatniego tygodnia</strong>. Nie ma dobrych ani złych odpowiedzi. Nie zastanawiaj się zbyt długo nad odpowiedzią na poszczególne stwierdzenia.',
    questionsPerPage: 7,
    defaultTemplateId: 'tpl-default',
    scales: [
      { id: 'dass-d', name: 'Depresja', description: 'Mierzy objawy dysforii, beznadziejności, dewaluacji życia, samooceny, braku zainteresowania/zaangażowania i anhedonii.' },
      { id: 'dass-a', name: 'Lęk', description: 'Mierzy objawy pobudzenia autonomicznego, lęku sytuacyjnego i subiektywnego doświadczenia lęku.' },
      { id: 'dass-s', name: 'Stres', description: 'Mierzy objawy trudności w relaksacji, pobudzenia nerwowego, drażliwości i bycia łatwo zdenerwowanym.' },
    ],
    sections: [
        {
            id: 'dass-sec-1',
            title: 'Pytania',
            questions: [
                // Questions 1-42 will be generated here
                // S: 1, 6, 8, 11, 12, 14, 18, 22, 27, 29, 32, 33, 35, 39
                // A: 2, 4, 7, 9, 15, 19, 20, 23, 25, 28, 30, 36, 40, 41
                // D: 3, 5, 10, 13, 16, 17, 21, 24, 26, 31, 34, 37, 38, 42
                {
                    id: 'dass-q-1', text: 'Stwierdziłem/am, że trudno mi się odprężyć.', type: 'multiple-choice',
                    options: [ { id: 'dass-q1-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q1-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q1-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q1-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q1-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q1-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q1-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q1-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-2', text: 'Odczuwałem/am suchość w ustach.', type: 'multiple-choice',
                    options: [ { id: 'dass-q2-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q2-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q2-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q2-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q2-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q2-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q2-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q2-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-3', text: 'Nie potrafiłem/am dostrzec w sobie żadnych pozytywnych uczuć.', type: 'multiple-choice',
                    options: [ { id: 'dass-q3-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q3-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q3-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q3-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q3-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q3-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q3-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q3-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-4', text: 'Doświadczałem/am trudności w oddychaniu (np. zbyt szybki oddech, duszność bez wysiłku fizycznego).', type: 'multiple-choice',
                    options: [ { id: 'dass-q4-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q4-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q4-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q4-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q4-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q4-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q4-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q4-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-5', text: 'Trudno mi było wykrzesać z siebie inicjatywę do działania.', type: 'multiple-choice',
                    options: [ { id: 'dass-q5-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q5-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q5-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q5-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q5-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q5-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q5-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q5-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-6', text: 'Miałem/am skłonność do przesadnego reagowania na sytuacje.', type: 'multiple-choice',
                    options: [ { id: 'dass-q6-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q6-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q6-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q6-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q6-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q6-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q6-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q6-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-7', text: 'Odczuwałem/am drżenie (np. rąk).', type: 'multiple-choice',
                    options: [ { id: 'dass-q7-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q7-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q7-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q7-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q7-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q7-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q7-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q7-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-8', text: 'Czułem/am, że zużywam dużo energii na niepotrzebne zdenerwowanie.', type: 'multiple-choice',
                    options: [ { id: 'dass-q8-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q8-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q8-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q8-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q8-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q8-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q8-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q8-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-9', text: 'Martwiłem/am się sytuacjami, w których mogłem/am spanikować i zrobić z siebie głupka.', type: 'multiple-choice',
                    options: [ { id: 'dass-q9-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q9-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q9-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q9-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q9-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q9-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q9-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q9-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-10', text: 'Czułem/am, że nie mam na co czekać.', type: 'multiple-choice',
                    options: [ { id: 'dass-q10-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q10-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q10-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q10-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q10-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q10-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q10-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q10-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-11', text: 'Stwierdziłem/am, że łatwo mnie zirytować.', type: 'multiple-choice',
                    options: [ { id: 'dass-q11-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q11-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q11-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q11-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q11-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q11-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q11-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q11-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-12', text: 'Ciężko mi było się zrelaksować.', type: 'multiple-choice',
                    options: [ { id: 'dass-q12-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q12-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q12-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q12-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q12-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q12-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q12-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q12-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-13', text: 'Czułem/am się smutny/a i przygnębiony/a.', type: 'multiple-choice',
                    options: [ { id: 'dass-q13-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q13-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q13-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q13-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q13-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q13-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q13-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q13-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-14', text: 'Byłem/am niecierpliwy/a, gdy coś lub ktoś opóźniał moje działanie.', type: 'multiple-choice',
                    options: [ { id: 'dass-q14-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q14-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q14-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q14-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q14-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q14-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q14-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q14-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-15', text: 'Czułem/am, że zaraz wpadnę w panikę.', type: 'multiple-choice',
                    options: [ { id: 'dass-q15-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q15-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q15-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q15-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q15-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q15-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q15-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q15-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-16', text: 'Nic nie było w stanie wzbudzić we mnie entuzjazmu.', type: 'multiple-choice',
                    options: [ { id: 'dass-q16-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q16-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q16-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q16-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q16-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q16-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q16-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q16-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-17', text: 'Czułem/am, że niewiele znaczę jako człowiek.', type: 'multiple-choice',
                    options: [ { id: 'dass-q17-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q17-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q17-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q17-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q17-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q17-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q17-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q17-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-18', text: 'Czułem/am, że jestem dość drażliwy/a.', type: 'multiple-choice',
                    options: [ { id: 'dass-q18-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q18-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q18-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q18-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q18-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q18-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q18-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q18-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-19', text: 'Byłem/am świadom/a pracy mojego serca, mimo braku wysiłku fizycznego (np. uczucie przyśpieszonego bicia, "gubienia" rytmu).', type: 'multiple-choice',
                    options: [ { id: 'dass-q19-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q19-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q19-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q19-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q19-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q19-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q19-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q19-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-20', text: 'Czułem/am się przestraszony/a bez żadnego powodu.', type: 'multiple-choice',
                    options: [ { id: 'dass-q20-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q20-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q20-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q20-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q20-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q20-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q20-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q20-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-21', text: 'Czułem/am, że życie jest bez sensu.', type: 'multiple-choice',
                    options: [ { id: 'dass-q21-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q21-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q21-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q21-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q21-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q21-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q21-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q21-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-22', text: 'Trudno mi było się uspokoić.', type: 'multiple-choice',
                    options: [ { id: 'dass-q22-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q22-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q22-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q22-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q22-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q22-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q22-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q22-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-23', text: 'Miałem/am trudności z połykaniem.', type: 'multiple-choice',
                    options: [ { id: 'dass-q23-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q23-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q23-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q23-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q23-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q23-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q23-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q23-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-24', text: 'Nie potrafiłem/am znaleźć satysfakcji w żadnym z moich działań.', type: 'multiple-choice',
                    options: [ { id: 'dass-q24-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q24-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q24-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q24-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q24-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q24-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q24-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q24-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-25', text: 'Byłem/am bliski/a paniki.', type: 'multiple-choice',
                    options: [ { id: 'dass-q25-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q25-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q25-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q25-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q25-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q25-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q25-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q25-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-26', text: 'Nie byłem/am w stanie zaangażować się w to co robię.', type: 'multiple-choice',
                    options: [ { id: 'dass-q26-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q26-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q26-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q26-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q26-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q26-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q26-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q26-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-27', text: 'Czułem/am, że jestem bardzo wrażliwy/a na dotyk.', type: 'multiple-choice',
                    options: [ { id: 'dass-q27-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q27-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q27-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q27-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q27-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q27-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q27-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q27-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-28', text: 'Martwiłem/am się o stan swojego zdrowia fizycznego.', type: 'multiple-choice',
                    options: [ { id: 'dass-q28-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q28-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q28-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q28-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q28-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q28-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q28-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q28-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-29', text: 'Stwierdziłem/am, że łatwo wpadam w poruszenie.', type: 'multiple-choice',
                    options: [ { id: 'dass-q29-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q29-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q29-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q29-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q29-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q29-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q29-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q29-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-30', text: 'Obawiałem/am się, że jakieś błahe, nieznane mi zadanie wytrąci mnie z równowagi.', type: 'multiple-choice',
                    options: [ { id: 'dass-q30-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q30-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q30-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q30-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q30-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q30-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q30-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q30-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-31', text: 'Nie widziałem/am niczego, co mógłbym/mogłabym oczekiwać w przyszłości.', type: 'multiple-choice',
                    options: [ { id: 'dass-q31-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q31-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q31-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q31-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q31-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q31-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q31-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q31-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-32', text: 'Byłem/am w stanie ciągłego napięcia nerwowego.', type: 'multiple-choice',
                    options: [ { id: 'dass-q32-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q32-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q32-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q32-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q32-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q32-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q32-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q32-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-33', text: 'Stwierdziłem/am, że mam trudności z uspokojeniem się po zdenerwowaniu.', type: 'multiple-choice',
                    options: [ { id: 'dass-q33-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q33-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q33-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q33-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q33-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q33-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q33-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q33-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-34', text: 'Czułem/am, że straciłem/am całą radość życia.', type: 'multiple-choice',
                    options: [ { id: 'dass-q34-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q34-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q34-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q34-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q34-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q34-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q34-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q34-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-35', text: 'Trudno mi było tolerować, gdy ktoś mi przeszkadzał w tym co robiłem/am.', type: 'multiple-choice',
                    options: [ { id: 'dass-q35-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q35-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q35-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q35-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q35-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q35-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q35-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q35-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-36', text: 'Czułem/am się bliski/a załamania.', type: 'multiple-choice',
                    options: [ { id: 'dass-q36-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q36-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q36-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q36-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q36-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q36-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q36-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q36-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-37', text: 'Czułem/am, że nie jestem nic wart/a.', type: 'multiple-choice',
                    options: [ { id: 'dass-q37-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q37-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q37-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q37-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q37-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q37-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q37-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q37-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-38', text: 'Nie mogłem/am znaleźć w sobie zainteresowania czymkolwiek.', type: 'multiple-choice',
                    options: [ { id: 'dass-q38-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q38-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q38-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q38-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q38-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q38-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q38-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q38-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
                {
                    id: 'dass-q-39', text: 'Byłem/am nadpobudliwy/a.', type: 'multiple-choice',
                    options: [ { id: 'dass-q39-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q39-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q39-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q39-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q39-o1': [{ scaleId: 'dass-s', points: 0 }], 'dass-q39-o2': [{ scaleId: 'dass-s', points: 1 }], 'dass-q39-o3': [{ scaleId: 'dass-s', points: 2 }], 'dass-q39-o4': [{ scaleId: 'dass-s', points: 3 }], }
                },
                {
                    id: 'dass-q-40', text: 'Czułem/am się niepewnie i bezradnie.', type: 'multiple-choice',
                    options: [ { id: 'dass-q40-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q40-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q40-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q40-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q40-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q40-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q40-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q40-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-41', text: 'Trudno mi było zebrać myśli.', type: 'multiple-choice',
                    options: [ { id: 'dass-q41-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q41-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q41-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q41-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q41-o1': [{ scaleId: 'dass-a', points: 0 }], 'dass-q41-o2': [{ scaleId: 'dass-a', points: 1 }], 'dass-q41-o3': [{ scaleId: 'dass-a', points: 2 }], 'dass-q41-o4': [{ scaleId: 'dass-a', points: 3 }], }
                },
                {
                    id: 'dass-q-42', text: 'Czułem/am, że życie mnie wyczerpało.', type: 'multiple-choice',
                    options: [ { id: 'dass-q42-o1', text: 'Nie dotyczyło mnie to w ogóle' }, { id: 'dass-q42-o2', text: 'Odnosiło się to do mnie w pewnym stopniu lub przez część czasu' }, { id: 'dass-q42-o3', text: 'Odnosiło się to do mnie w znacznym stopniu lub przez większość czasu' }, { id: 'dass-q42-o4', text: 'Odnosiło się to do mnie bardzo mocno lub przez większość czasu' }, ],
                    scoring: { 'dass-q42-o1': [{ scaleId: 'dass-d', points: 0 }], 'dass-q42-o2': [{ scaleId: 'dass-d', points: 1 }], 'dass-q42-o3': [{ scaleId: 'dass-d', points: 2 }], 'dass-q42-o4': [{ scaleId: 'dass-d', points: 3 }], }
                },
            ]
        }
    ]
  }
];

export const MOCK_RESULTS: TestResult[] = [
    {
        id: 'result-1',
        testId: 'test-1-v2',
        testVersion: 2,
        testTitle: 'Ocena Nastroju i Lęku Społecznego (Wersja 2)',
        clientIdentifier: 'KLIENT-A8B2C1',
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dni temu
        therapistId: 'user-2',
        answers: [
            { questionId: 'q-1', selectedOptionId: 'q1-o4' }, // Raczej tak (3pkt do Lęku)
            { questionId: 'q-4', selectedOptionId: 'q4-o4' }, // Prawie zawsze (3pkt do Lęku)
            { questionId: 'q-2', selectedOptionId: 'q2-o2' }, // Kilka dni (1pkt do Nastroju)
            { questionId: 'q-3', selectedOptionId: 'q3-o2' }, // Nie zgadzam się (1pkt do Pozytywnych)
            { questionId: 'q-5', selectedOptionId: 'q5-o3' }, // Często (2pkt do Lęku, 2pkt do Nastroju)
        ],
        scores: [
            { scaleId: 'scale-1', scaleName: 'Lęk Społeczny', score: 8, maxScore: 9 },
            { scaleId: 'scale-2', scaleName: 'Nastrój Depresyjny', score: 3, maxScore: 5 },
            { scaleId: 'scale-3', scaleName: 'Pozytywne Nastawienie', score: 1, maxScore: 3 },
        ]
    },
    {
        id: 'result-2',
        testId: 'test-1-v1',
        testVersion: 1,
        testTitle: 'Ocena Nastroju i Lęku Społecznego',
        clientIdentifier: 'KLIENT-D4E5F6',
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dni temu
        therapistId: 'user-2',
        answers: [
            { questionId: 'q-1', selectedOptionId: 'q1-o2' },
        ],
        scores: [
            { scaleId: 'scale-1', scaleName: 'Lęk Społeczny', score: 1, maxScore: 9 },
            { scaleId: 'scale-2', scaleName: 'Nastrój Depresyjny', score: 0, maxScore: 5 },
        ]
    },
    // ---- ADDED 15 NEW RESULTS FOR AGGREGATION ----
    // 7 results for "Ocena Nastroju i Lęku Społecznego (Wersja 2)"
    {
        id: 'result-3', testId: 'test-1-v2', testVersion: 2, testTitle: 'Ocena Nastroju i Lęku Społecznego (Wersja 2)',
        clientIdentifier: 'KLIENT-G7H8I9', completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), therapistId: 'user-2',
        answers: [
            { questionId: 'q-1', selectedOptionId: 'q1-o5' }, { questionId: 'q-4', selectedOptionId: 'q4-o3' },
            { questionId: 'q-2', selectedOptionId: 'q2-o1' }, { questionId: 'q-3', selectedOptionId: 'q3-o4' },
            { questionId: 'q-5', selectedOptionId: 'q5-o1' },
        ],
        scores: [
            { scaleId: 'scale-1', scaleName: 'Lęk Społeczny', score: 6, maxScore: 9 },
            { scaleId: 'scale-2', scaleName: 'Nastrój Depresyjny', score: 0, maxScore: 5 },
            { scaleId: 'scale-3', scaleName: 'Pozytywne Nastawienie', score: 3, maxScore: 3 },
        ]
    },
    {
        id: 'result-4', testId: 'test-1-v2', testVersion: 2, testTitle: 'Ocena Nastroju i Lęku Społecznego (Wersja 2)',
        clientIdentifier: 'KLIENT-J1K2L3', completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), therapistId: 'user-2',
        answers: [
            { questionId: 'q-1', selectedOptionId: 'q1-o2' }, { questionId: 'q-4', selectedOptionId: 'q4-o2' },
            { questionId: 'q-2', selectedOptionId: 'q2-o4' }, { questionId: 'q-3', selectedOptionId: 'q3-o1' },
            { questionId: 'q-5', selectedOptionId: 'q5-o2' },
        ],
        scores: [
            { scaleId: 'scale-1', scaleName: 'Lęk Społeczny', score: 3, maxScore: 9 },
            { scaleId: 'scale-2', scaleName: 'Nastrój Depresyjny', score: 5, maxScore: 5 },
            { scaleId: 'scale-3', scaleName: 'Pozytywne Nastawienie', score: 0, maxScore: 3 },
        ]
    },
    {
        id: 'result-5', testId: 'test-1-v2', testVersion: 2, testTitle: 'Ocena Nastroju i Lęku Społecznego (Wersja 2)',
        clientIdentifier: 'KLIENT-M4N5O6', completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), therapistId: 'user-2',
        answers: [
            { questionId: 'q-1', selectedOptionId: 'q1-o1' }, { questionId: 'q-4', selectedOptionId: 'q4-o1' },
            { questionId: 'q-2', selectedOptionId: 'q2-o1' }, { questionId: 'q-3', selectedOptionId: 'q3-o3' },
            { questionId: 'q-5', selectedOptionId: 'q5-o1' },
        ],
        scores: [
            { scaleId: 'scale-1', scaleName: 'Lęk Społeczny', score: 0, maxScore: 9 },
            { scaleId: 'scale-2', scaleName: 'Nastrój Depresyjny', score: 0, maxScore: 5 },
            { scaleId: 'scale-3', scaleName: 'Pozytywne Nastawienie', score: 2, maxScore: 3 },
        ]
    },
     {
        id: 'result-6', testId: 'test-1-v2', testVersion: 2, testTitle: 'Ocena Nastroju i Lęku Społecznego (Wersja 2)',
        clientIdentifier: 'KLIENT-P7Q8R9', completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), therapistId: 'user-2',
        answers: [
            { questionId: 'q-1', selectedOptionId: 'q1-o3' }, { questionId: 'q-4', selectedOptionId: 'q4-o2' },
            { questionId: 'q-2', selectedOptionId: 'q2-o2' }, { questionId: 'q-3', selectedOptionId: 'q3-o2' },
            { questionId: 'q-5', selectedOptionId: 'q5-o2' },
        ],
        scores: [
            { scaleId: 'scale-1', scaleName: 'Lęk Społeczny', score: 4, maxScore: 9 },
            { scaleId: 'scale-2', scaleName: 'Nastrój Depresyjny', score: 2, maxScore: 5 },
            { scaleId: 'scale-3', scaleName: 'Pozytywne Nastawienie', score: 1, maxScore: 3 },
        ]
    },
     {
        id: 'result-7', testId: 'test-1-v2', testVersion: 2, testTitle: 'Ocena Nastroju i Lęku Społecznego (Wersja 2)',
        clientIdentifier: 'KLIENT-S1T2U3', completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), therapistId: 'user-2',
        answers: [
            { questionId: 'q-1', selectedOptionId: 'q1-o5' }, { questionId: 'q-4', selectedOptionId: 'q4-o4' },
            { questionId: 'q-2', selectedOptionId: 'q2-o4' }, { questionId: 'q-3', selectedOptionId: 'q3-o1' },
            { questionId: 'q-5', selectedOptionId: 'q5-o3' },
        ],
        scores: [
            { scaleId: 'scale-1', scaleName: 'Lęk Społeczny', score: 9, maxScore: 9 },
            { scaleId: 'scale-2', scaleName: 'Nastrój Depresyjny', score: 5, maxScore: 5 },
            { scaleId: 'scale-3', scaleName: 'Pozytywne Nastawienie', score: 0, maxScore: 3 },
        ]
    },
    {
        id: 'result-8', testId: 'test-1-v2', testVersion: 2, testTitle: 'Ocena Nastroju i Lęku Społecznego (Wersja 2)',
        clientIdentifier: 'KLIENT-V4W5X6', completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), therapistId: 'user-2',
        answers: [
            { questionId: 'q-1', selectedOptionId: 'q1-o1' }, { questionId: 'q-4', selectedOptionId: 'q4-o1' },
            { questionId: 'q-2', selectedOptionId: 'q2-o1' }, { questionId: 'q-3', selectedOptionId: 'q3-o4' },
            { questionId: 'q-5', selectedOptionId: 'q5-o1' },
        ],
        scores: [
            { scaleId: 'scale-1', scaleName: 'Lęk Społeczny', score: 0, maxScore: 9 },
            { scaleId: 'scale-2', scaleName: 'Nastrój Depresyjny', score: 0, maxScore: 5 },
            { scaleId: 'scale-3', scaleName: 'Pozytywne Nastawienie', score: 3, maxScore: 3 },
        ]
    },
    {
        id: 'result-9', testId: 'test-1-v2', testVersion: 2, testTitle: 'Ocena Nastroju i Lęku Społecznego (Wersja 2)',
        clientIdentifier: 'KLIENT-Y7Z8A9', completedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), therapistId: 'user-2',
        answers: [
            { questionId: 'q-1', selectedOptionId: 'q1-o4' }, { questionId: 'q-4', selectedOptionId: 'q4-o1' },
            { questionId: 'q-2', selectedOptionId: 'q2-o3' }, { questionId: 'q-3', selectedOptionId: 'q3-o2' },
            { questionId: 'q-5', selectedOptionId: 'q5-o3' },
        ],
        scores: [
            { scaleId: 'scale-1', scaleName: 'Lęk Społeczny', score: 5, maxScore: 9 },
            { scaleId: 'scale-2', scaleName: 'Nastrój Depresyjny', score: 4, maxScore: 5 },
            { scaleId: 'scale-3', scaleName: 'Pozytywne Nastawienie', score: 1, maxScore: 3 },
        ]
    },
    // 8 results for "DASS-42"
    ...Array.from({ length: 8 }, (_, i) => {
        const id = 10 + i;
        const clientIdentifier = `KLIENT-DASS${id}`;
        const completedAt = new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000);
        
        const test = MOCK_TESTS.find(t => t.id === 'test-dass42-v1')!;
        const answers: { questionId: string; selectedOptionId: string; }[] = [];
        const scores = { 'dass-d': 0, 'dass-a': 0, 'dass-s': 0 };

        test.sections[0].questions.forEach(q => {
            const randomOptionIndex = Math.floor(Math.random() * 4);
            const selectedOption = q.options[randomOptionIndex];
            answers.push({ questionId: q.id, selectedOptionId: selectedOption.id });
            const rule = q.scoring[selectedOption.id][0];
            scores[rule.scaleId as 'dass-d' | 'dass-a' | 'dass-s'] += rule.points;
        });

        return {
            id: `result-${id}`, testId: 'test-dass42-v1', testVersion: 1,
            testTitle: 'Skala Depresji, Lęku i Stresu (DASS-42)',
            clientIdentifier, completedAt, therapistId: 'user-2',
            answers,
            scores: [
                { scaleId: 'dass-d', scaleName: 'Depresja', score: scores['dass-d'], maxScore: 42 },
                { scaleId: 'dass-a', scaleName: 'Lęk', score: scores['dass-a'], maxScore: 42 },
                { scaleId: 'dass-s', scaleName: 'Stres', score: scores['dass-s'], maxScore: 42 },
            ]
        };
    })
];
