import { describe, it, expect } from 'vitest';
import { generatePdf } from './pdfGenerator';
import type { TestResult, Test, BrandingSettings, PdfTemplate, ReportComponent } from './types';

// Mock data setup
const mockTest: Test = {
  id: 'test-1',
  canonicalId: 'c-test-1',
  version: 1,
  title: 'Psychological Test Alpha',
  description: 'A test for pdf generation',
  instructions: 'Please answer carefully',
  status: 'PUBLISHED',
  createdAt: new Date().toISOString(),
  questionsPerPage: null,
  defaultTemplateId: null,
  scales: [
    { id: 'scale-1', type: 'standard', name: 'Depression Scale', description: '', maxScore: 100 },
    { id: 'scale-2', type: 'standard', name: 'Anxiety Scale', description: '', maxScore: 50 },
  ],
  sections: [],
};

const mockResult: TestResult = {
  id: 'result-1',
  testId: 'test-1',
  testTitle: 'Psychological Test Alpha',
  testVersion: 1,
  therapistId: 'therapist-1',
  clientIdentifier: 'Client A',
  completedAt: new Date().toISOString(),
  scores: {
    'scale-1': 75,
    'scale-2': 40
  },
  answers: {},
  analysis: 'Mock AI analysis'
};

const mockBranding: BrandingSettings = {
  appName: 'MindCare',
  logoUrl: '',
  fontFamily: 'Inter',
  borderRadius: 8,
  boxShadow: 'none',
  chartColors: [],
  clientPageTitle: '',
  clientPageDescription: '',
  clientPageButtonText: '',
  clientThankYouTitle: '',
  clientThankYouMessage: '',
  clientThankYouButtonText: '',
  clientConfirmationTitle: '',
  clientConfirmationMessage: '',
  clientConfirmationButtonText: '',
  mode: 'light',
  lightTheme: {} as any,
  darkTheme: {} as any,
  aiSettings: { enabled: false, provider: '', apiKey: '', endpoint: '', model: '', systemPrompt: '' },
  emailSettings: { fromName: '', fromEmail: '', therapistNotificationSubject: '', therapistNotificationBody: '', smtp: { host: '', port: 0, secure: false, username: '' } }
};

describe('pdfGenerator', () => {
  it('should generate a PDF byte array with default components', async () => {
    const pdfBytes = await generatePdf(mockResult, mockTest, mockBranding, undefined, '');
    
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(100);
    
    // Check for PDF signature (%PDF-)
    const signature = new TextDecoder().decode(pdfBytes.subarray(0, 5));
    expect(signature).toBe('%PDF-');
  });

  it('should include custom interpretation if provided', async () => {
    const customInterpretation = 'This client shows elevated anxiety markers.';
    const pdfBytes = await generatePdf(mockResult, mockTest, mockBranding, undefined, customInterpretation);
    
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(100);
  });

  it('should render all custom template component types without crashing', async () => {
    const customComponents: ReportComponent[] = [
      { id: '1', type: 'Header', options: { text: 'Custom Header', fontSize: 24 } },
      { id: '2', type: 'ScoresTable', title: 'Test Table', options: { scaleIds: ['scale-1'] } },
      { id: '3', type: 'BarChart', title: 'Test Chart', options: { scaleIds: ['scale-2'] } },
      { id: '4', type: 'RadarChart', title: 'Test Radar', options: {} },
      { id: '5', type: 'RichText', options: { content: '<p>HTML Content <b>Bold</b></p>' } }
    ];

    const mockTemplate: PdfTemplate = {
      id: 'template-1',
      testCanonicalId: 'c-test-1',
      name: 'Full Template',
      components: customComponents
    };
    
    const pdfBytes = await generatePdf(mockResult, mockTest, mockBranding, mockTemplate, '');
    
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(100);
  });
});
