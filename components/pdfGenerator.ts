
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TestResult, Test, PdfTemplate, ReportComponent } from './types';
import type { Branding } from '../contexts/BrandingContext';

// Helper to manage page and y-position
class PdfContext {
    page: any;
    y: number;
    height: number;
    pdfDoc: PDFDocument;

    constructor(pdfDoc: PDFDocument) {
        this.pdfDoc = pdfDoc;
        this.page = pdfDoc.addPage();
        const { height } = this.page.getSize();
        this.height = height;
        this.y = height - 50;
    }

    checkNewPage(neededHeight: number) {
        if (this.y - neededHeight < 50) {
            this.page = this.pdfDoc.addPage();
            this.y = this.height - 50;
        }
    }

    moveDown(amount: number) {
        this.y -= amount;
    }
}


async function drawHeader(ctx: PdfContext, component: ReportComponent) {
    ctx.checkNewPage(40);
    const font = await ctx.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    ctx.page.drawText(component.options.text || 'Nagłówek', { 
        x: 50, 
        y: ctx.y, 
        size: component.options.fontSize || 18,
        font 
    });
    ctx.moveDown( (component.options.fontSize || 18) + (component.options.marginBottom || 15) );
}

async function drawScoresTable(ctx: PdfContext, component: ReportComponent, result: TestResult, test: Test) {
    ctx.checkNewPage(50);
    const headerFont = await ctx.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await ctx.pdfDoc.embedFont(StandardFonts.Helvetica);

    // Title for the table
    if (component.title) {
        ctx.page.drawText(component.title, { x: 50, y: ctx.y, size: 14, font: headerFont });
        ctx.moveDown(25);
    }

    const scaleIds = component.options.scaleIds || Object.keys(result.scores);
    const tableTop = ctx.y;

    // Header
    ctx.page.drawText('Skala', { x: 55, y: ctx.y, font: headerFont, size: 10 });
    ctx.page.drawText('Wynik', { x: 350, y: ctx.y, font: headerFont, size: 10 });
    ctx.moveDown(20);

    // Body
    for (const scaleId of scaleIds) {
        const score = result.scores[scaleId];
        const scaleInfo = test.scales.find(s => s.id === scaleId);
        if (score === undefined || !scaleInfo) continue;

        ctx.checkNewPage(20);
        ctx.page.drawText(scaleInfo.name, { x: 55, y: ctx.y, font: bodyFont, size: 10 });
        ctx.page.drawText(String(score), { x: 350, y: ctx.y, font: bodyFont, size: 10 });
        ctx.moveDown(20);
    }
    ctx.moveDown(10); // Margin after table
}

async function drawBarChart(ctx: PdfContext, component: ReportComponent, result: TestResult, test: Test) {
    ctx.checkNewPage(150); // Reserve space for chart
    const headerFont = await ctx.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await ctx.pdfDoc.embedFont(StandardFonts.Helvetica);

    if (component.title) {
        ctx.page.drawText(component.title, { x: 50, y: ctx.y, size: 14, font: headerFont });
        ctx.moveDown(25);
    }

    const scaleIds = component.options.scaleIds || Object.keys(result.scores);
    const barWidth = 30;
    const barSpacing = 20;
    let currentX = 60;

    for (const scaleId of scaleIds) {
        const score = result.scores[scaleId];
        const scaleInfo = test.scales.find(s => s.id === scaleId);
        if (score === undefined || !scaleInfo || scaleInfo.type !== 'standard') continue;
        
        const barHeight = (score / scaleInfo.maxScore) * 100; // Height capped at 100px

        // Draw Bar
        ctx.page.drawRectangle({
            x: currentX,
            y: ctx.y - barHeight,
            width: barWidth,
            height: barHeight,
            color: rgb(0.2, 0.4, 0.8)
        });
        // Draw Label
        ctx.page.drawText(scaleInfo.name.substring(0, 5), {
            x: currentX + 5,
            y: ctx.y - barHeight - 15,
            size: 8
        });
        currentX += barWidth + barSpacing;
    }
    ctx.moveDown(120 + 20); // Chart height + margin
}

async function drawRichText(ctx: PdfContext, component: ReportComponent) {
    ctx.checkNewPage(30);
    const font = await ctx.pdfDoc.embedFont(StandardFonts.Helvetica);
    const content = component.options.content || '';
    
    // Basic renderer, does not handle actual rich text.
    const lines = content.replace(/<[^>]+>/g, '').split('\n'); 
    for(const line of lines) {
        ctx.checkNewPage(15);
        ctx.page.drawText(line, { x: 50, y: ctx.y, size: 10, font });
        ctx.moveDown(15);
    }
    ctx.moveDown(10);
}

export async function generatePdf(
    result: TestResult, 
    test: Test, 
    branding: Branding, 
    template: PdfTemplate | undefined, 
    customInterpretation: string
): Promise<Uint8Array> {
    
    const pdfDoc = await PDFDocument.create();
    const ctx = new PdfContext(pdfDoc);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const componentsToRender = template ? template.components : [
        { id: 'def-h1', type: 'Header', options: { text: `Raport: ${test.title}` } },
        { id: 'def-st', type: 'ScoresTable', title: 'Wyniki surowe', options: {} },
        { id: 'def-barchart', type: 'BarChart', title: 'Profil podstawowy', options: { scaleIds: test.scales.filter(s => s.type==='standard').map(s => s.id)} },
    ];

    // Page Header
    ctx.page.drawText(`${branding.appName || 'Platforma' }`, { x: 50, y: ctx.height - 30, size: 10 });

    for (const component of componentsToRender) {
        switch(component.type) {
            case 'Header':
                await drawHeader(ctx, component);
                break;
            case 'ScoresTable':
                await drawScoresTable(ctx, component, result, test);
                break;
            case 'BarChart':
                 await drawBarChart(ctx, component, result, test);
                 break;
             case 'RadarChart': // Placeholder
                ctx.checkNewPage(20);
                ctx.page.drawText(`[Komponent Wykresu Radarowego '${component.title}' pojawi się tutaj]`, {x: 50, y: ctx.y, size: 10, font });
                ctx.moveDown(30);
                break;
            case 'RichText':
                // Use customInterpretation if the component is marked for it
                const content = component.options.isTherapistNote ? customInterpretation : component.options.content;
                await drawRichText(ctx, { ...component, options: { ...component.options, content } });
                break;
        }
    }

    return pdfDoc.save();
}
