
// =========================================================================
// Test & Results Related Types
// =========================================================================

export interface AnswerOption {
  id: string;
  text: string;
}

export interface ScoringRule {
  scaleId: string;
  points: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'multiple-select' | 'likert-5' | 'likert-7' | 'scale-1-10' | 'yes-no';
  options: AnswerOption[];
  scoring: Record<string, ScoringRule[]>; // Maps AnswerOption ID to an array of scoring rules
  isReversed?: boolean;
}

export interface Section {
  id: string;
  title: string;
  questions: Question[];
}

export interface ScaleLevel {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
  description?: string;
}

export interface Scale {
  type: 'standard' | 'calculated';
  id: string;
  name: string;
  abbreviation?: string;
  description: string;
  maxScore?: number;
  formula?: string;
  levels?: ScaleLevel[];
}

export interface Test {
  id: string;
  canonicalId: string;
  version: number;
  title: string;
  description: string;
  instructions: string;
  status: 'DRAFT' | 'PUBLISHED';
  questionsPerPage: number | null;
  sections: Section[];
  scales: Scale[];
  defaultTemplateId: string | null;
  createdAt: string;
}

export interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  testVersion: number;
  therapistId: string; // ID of the therapist who owns this result
  clientIdentifier: string;
  completedAt: string;
  scores: { [scaleId: string]: number };
  answers: { [questionId: string]: string | string[] };
  analysis?: string | null;
}

export interface AccessCode {
  code: string;
  testId: string;
  therapistId: string;
  isUsed: boolean;
  expiresAt: string;
  therapistName?: string;
  therapistEmail?: string;
}


// =========================================================================
// PDF Template Related Types
// =========================================================================

export type ReportComponent = {
  id: string;
  type: 'Header' | 'ScoresTable' | 'BarChart' | 'RadarChart' | 'RichText' | 'Interpretations' | 'AnswersList' | 'TestDescription' | 'AiInterpretation';
  title?: string;
  options: { [key: string]: any };
};

export interface PdfTemplate {
  id: string;
  name: string;
  testCanonicalId: string;
  components: ReportComponent[];
}


// =========================================================================
// User & Auth Related Types
// =========================================================================

export enum UserRole {
  Admin = 'admin',
  Therapist = 'therapist',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  email: string;
  fullName: string;
  twoFactorSecret?: string;
}

// =========================================================================
// UI & General Application Types
// =========================================================================

export interface Notification {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  context?: {
    view: string;
    params: any;
  };
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ClientAnswer {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
}

export interface ThemePalette {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
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

  // Sidebar
  sidebarBackground: string;
  sidebarTextColor: string;
  sidebarActiveBackground: string;
  sidebarActiveText: string;
  sidebarHoverBackground: string;
  sidebarHoverText: string;
}

export interface BrandingSettings {
  appName: string;
  logoUrl: string;
  fontFamily: string;
  borderRadius: number;
  boxShadow: string;
  chartColors: string[];
  clientPageTitle: string;
  clientPageDescription: string;
  clientPageButtonText: string;
  clientThankYouTitle: string;
  clientThankYouMessage: string;
  clientThankYouButtonText: string;
  clientConfirmationTitle: string;
  clientConfirmationMessage: string;
  clientConfirmationButtonText: string;

  // Modern Theming
  mode: 'system' | 'light' | 'dark';
  lightTheme: ThemePalette;
  darkTheme: ThemePalette;

  // Valid for backward compatibility (optional/deprecated)
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  errorColor?: string;
  warningColor?: string;
  successColor?: string;
  adminColor?: string;
  adminBackgroundColor?: string;
  therapistColor?: string;
  therapistBackgroundColor?: string;
  sidebarBackground?: string;
  sidebarTextColor?: string;
  sidebarActiveBackground?: string;
  sidebarActiveText?: string;
  sidebarHoverBackground?: string;
  sidebarHoverText?: string;

  aiSettings: {
    enabled: boolean;
    provider: string;
    apiKey: string;
    endpoint: string;
    model: string;
    systemPrompt: string;
  };
  emailSettings: {
    enabled?: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      username: string;
      password?: string;
    };
    fromName: string;
    fromEmail: string;
    therapistNotificationSubject: string;
    therapistNotificationBody: string;
  };
}
