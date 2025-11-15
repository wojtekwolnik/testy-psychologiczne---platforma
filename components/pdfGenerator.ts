
import { PDFDocument } from 'pdf-lib';
import type { TestResult, Test, PdfTemplate } from './types';
import type { Branding } from '../contexts/BrandingContext';

// This function is now isolated in its own file to be dynamically imported.
export async function generatePdf(
    result: TestResult, 
    test: Test, 
    branding: Branding, 
    template: PdfTemplate | undefined, 
    customInterpretation: string
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let y = height - 50;

    // Simple title
    page.drawText(`${branding.appName || 'Test'} - Raport Wyników`, { x: 50, y, size: 24 });
    y -= 40;

    if (template && template.body) {
        // This is a simplified placeholder. A real implementation would need a complex parser
        // to replace placeholders like {{clientName}} with actual data.
        let body = template.body;
        body = body.replace(/{{clientName}}/g, result.clientName);
        body = body.replace(/{{testDate}}/g, new Date(result.completedAt).toLocaleDateString());
        body = body.replace(/{{testTitle}}/g, test.title);
        
        // Naive replacement for scores
        Object.entries(result.scores).forEach(([key, value]) => {
            const scoreRegex = new RegExp(`{{scores.${key}}}`, 'g');
            body = body.replace(scoreRegex, String(value));
        });

        body = body.replace(/{{therapistInterpretation}}/g, customInterpretation);

        // This simplified version just draws the text. A real version would handle HTML -> PDF.
        const lines = body.split('\n');
        for (const line of lines) {
            page.drawText(line, { x: 50, y, size: 12 });
            y -= 15;
            if (y < 50) {
                page = pdfDoc.addPage();
                y = height - 50;
            }
        }
    } else {
        // Default fallback PDF content
        page.drawText(`Pacjent: ${result.clientName}`, { x: 50, y, size: 12 });
        y -= 20;
        page.drawText(`Data: ${new Date(result.completedAt).toLocaleDateString()}`, { x: 50, y, size: 12 });
        y -= 40;

        page.drawText('Wyniki:', { x: 50, y, size: 16 });
        y -= 25;

        for (const [key, value] of Object.entries(result.scores)) {
            page.drawText(`${key}: ${value}`, { x: 70, y, size: 12 });
            y -= 20;
            if (y < 50) {
                page = pdfDoc.addPage();
                y = height - 50;
            }
        }
    }

    return pdfDoc.save();
}
