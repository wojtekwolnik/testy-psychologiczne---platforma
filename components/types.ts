
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
  id:string;
  text: string;
  type: 'multiple-choice' | 'multiple-select' | 'likert-5';
  options: AnswerOption[];
  scoring: Record<string, ScoringRule[]>; // Maps AnswerOption ID to an array of scoring rules
}

export interface Section {
  id: string;
  title: string;
  questions: Question[];
}

export interface Scale {
  type: 'standard' | 'calculated';
  id: string;
  name: string;
  description: string;
  maxScore?: number; 
  formula?: string;  
}

export interface Test {
  id: string;
  canonicalId: string; 
  version: number;
  title: string;
  description: string;
  instructions: string;
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
}

export interface AccessCode {
  code: string;
  testId: string;
  therapistId: string;
  isUsed: boolean;
  expiresAt: string;
}


// =========================================================================
// PDF Template Related Types
// =========================================================================

export type ReportComponent = {
  id: string; 
  type: 'Header' | 'ScoresTable' | 'BarChart' | 'RadarChart' | 'RichText';
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
  email: string; // Add email to User type
}

// =========================================================================
// UI & General Application Types
// =========================================================================

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
