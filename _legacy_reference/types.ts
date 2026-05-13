export enum UserRole {
  Admin = 'ADMIN',
  Therapist = 'THERAPIST',
  Client = 'CLIENT',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole.Admin | UserRole.Therapist;
  twoFactorEnabled: boolean;
}

export enum View {
  Login = 'LOGIN',
  StaffLogin = 'STAFF_LOGIN',
  TwoFactorAuth = 'TWO_FACTOR_AUTH',
  AdminDashboard = 'ADMIN_DASHBOARD',
  TestEditor = 'TEST_EDITOR',
  UserManagement = 'USER_MANAGEMENT',
  Branding = 'BRANDING',
  AggregatedData = 'AGGREGATED_DATA',
  TherapistDashboard = 'THERAPIST_DASHBOARD',
  ReportView = 'REPORT_VIEW',
  ClientCodeEntry = 'CLIENT_CODE_ENTRY',
  ClientTest = 'CLIENT_TEST',
  ClientThankYou = 'CLIENT_THANK_YOU',
  TemplateManager = 'TEMPLATE_MANAGER',
  TemplateEditor = 'TEMPLATE_EDITOR',
}

export interface AnswerOption {
  id: string;
  text: string;
}

export interface ScoringRule {
  scaleId: string;
  points: number;
}

// A single answer option can now have multiple scoring rules
export type ScoringMap = Record<string, ScoringRule[]>;

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'multiple-select' | 'likert-5';
  options: AnswerOption[];
  scoring: ScoringMap;
}

export interface Section {
    id: string;
    title: string;
    questions: Question[];
}

export interface Scale {
  id: string;
  name: string;
  description: string;
}

export interface Test {
  id: string; // Unique ID for this specific version
  canonicalId: string; // ID shared across all versions of a test
  version: number;
  title: string;
  description: string;
  scales: Scale[];
  sections: Section[];
  defaultTemplateId: string | null;
}

export interface ClientAnswer {
  questionId: string;
  selectedOptionId?: string; // For single choice
  selectedOptionIds?: string[]; // For multiple choice
}


export interface CalculatedScaleScore {
  scaleId: string;
  scaleName: string;
  score: number;
  maxScore: number;
}

export interface TestResult {
  id:string;
  testId: string; // The specific version ID
  testVersion: number;
  testTitle: string;
  clientIdentifier: string; 
  completedAt: Date;
  answers: ClientAnswer[];
  scores: CalculatedScaleScore[];
}

export interface BrandingSettings {
  appName: string;
  logoUrl: string | null;
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  
  // New Detailed Colors
  borderColor: string;
  inputBackgroundColor: string;
  inputTextColor: string;
  errorColor: string;
  warningColor: string;
  successColor: string;

  adminColor: string;
  adminBackgroundColor: string;
  therapistColor: string;
  therapistBackgroundColor: string;
  
  chartColors: string[];

  // Client Page Texts
  clientPageTitle: string;
  clientPageDescription: string;
  clientPageButtonText: string;
}

export interface AccessCode {
    code: string;
    testId: string; // The specific version ID
    isUsed: boolean;
    generatedBy: string; // Therapist User ID
    createdAt: Date;
}

export interface AggregatedTestInfo {
    testId: string;
    testTitle: string;
    version: number;
    completionCount: number;
}

export interface DetailedAggregatedData {
    testId: string;
    testTitle: string;
    completionCount: number;
    scales: Scale[];
    // For histogram of scores per scale
    scoreDistribution: Record<string, { bin: string; count: number }[]>;
    // For pie charts of answers per question
    answerFrequency: Record<string, { name: string; value: number }[]>;
}

export interface PdfTemplate {
    id: string;
    name: string;
    includeBarChart: boolean;
    includePieChart: boolean;
    includeDetailedAnswers: boolean;
}