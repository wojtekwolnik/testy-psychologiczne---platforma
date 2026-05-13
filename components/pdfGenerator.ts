
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TestResult, Test, PdfTemplate, ReportComponent, BrandingSettings } from './types';

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
    ctx.moveDown((component.options.fontSize || 18) + (component.options.marginBottom || 15));
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

    const getScoreLevel = (val: number, scale: any) => {
        if (!scale) return 'Brak danych';
        if (scale.levels && scale.levels.length > 0) {
            const matched = scale.levels.find((l: any) => val >= l.minScore && val <= l.maxScore) || scale.levels[scale.levels.length - 1];
            return matched.name;
        }
        if (!scale.maxScore) return 'Brak danych';
        const ratio = val / scale.maxScore;
        if (ratio > 0.73) return 'Wysoki';
        if (ratio >= 0.45) return 'Przeciętny';
        return 'Niski';
    };

    // Header
    ctx.page.drawText('Skala', { x: 55, y: ctx.y, font: headerFont, size: 10 });
    ctx.page.drawText('Wynik', { x: 320, y: ctx.y, font: headerFont, size: 10 });
    ctx.page.drawText('Poziom', { x: 420, y: ctx.y, font: headerFont, size: 10 });
    ctx.moveDown(20);

    // Body
    for (const scaleId of scaleIds) {
        const score = result.scores[scaleId];
        const scaleInfo = test.scales.find(s => s.id === scaleId);
        if (score === undefined || !scaleInfo) continue;

        const levelText = getScoreLevel(score, scaleInfo);

        ctx.checkNewPage(20);
        ctx.page.drawText(scaleInfo.name, { x: 55, y: ctx.y, font: bodyFont, size: 10 });
        ctx.page.drawText(`${score}${scaleInfo.maxScore ? ` / ${scaleInfo.maxScore}` : ''}`, { x: 320, y: ctx.y, font: bodyFont, size: 10 });
        ctx.page.drawText(levelText, { x: 420, y: ctx.y, font: bodyFont, size: 10 });
        ctx.moveDown(20);
    }
    ctx.moveDown(10); // Margin after table
}

async function drawBarChart(ctx: PdfContext, component: ReportComponent, result: TestResult, test: Test) {
    ctx.checkNewPage(150); // Reserve space for chart
    const headerFont = await ctx.pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

        const maxScore = scaleInfo.maxScore && scaleInfo.maxScore > 0 ? scaleInfo.maxScore : 100; // Default to 100 if 0/missing
        const barHeight = (score / maxScore) * 100; // Height capped at 100px relative

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

async function drawRadarChart(ctx: PdfContext, component: ReportComponent, result: TestResult, test: Test) {
    const size = 200; // Total width and height of the chart
    ctx.checkNewPage(size + 60);
    const headerFont = await ctx.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const labelFont = await ctx.pdfDoc.embedFont(StandardFonts.Helvetica);

    if (component.title) {
        ctx.page.drawText(component.title, { x: 50, y: ctx.y, size: 14, font: headerFont });
        ctx.moveDown(25);
    }

    const scaleIds = component.options.scaleIds || Object.keys(result.scores);
    const scalesToDraw = scaleIds.map((id: string) => test.scales.find((s: any) => s.id === id)).filter((s: any) => !!s) as typeof test.scales;

    if (scalesToDraw.length < 3) {
        ctx.page.drawText('Wykres radarowy wymaga co najmniej 3 skal.', { x: 50, y: ctx.y, size: 10, font: labelFont });
        ctx.moveDown(20);
        return;
    }

    const centerX = 200; // Shift it a bit from the left margin
    const centerY = ctx.y - (size / 2);
    const radius = size / 2;

    // Draw background grid (concentric polygons)
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
        const r = radius * (level / levels);
        for (let i = 0; i < scalesToDraw.length; i++) {
            const angle1 = (Math.PI * 2 * i) / scalesToDraw.length - Math.PI / 2;
            const angle2 = (Math.PI * 2 * ((i + 1) % scalesToDraw.length)) / scalesToDraw.length - Math.PI / 2;

            const x1 = centerX + r * Math.cos(angle1);
            const y1 = centerY - r * Math.sin(angle1);
            const x2 = centerX + r * Math.cos(angle2);
            const y2 = centerY - r * Math.sin(angle2);

            ctx.page.drawLine({
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8)
            });
        }
    }

    // Draw axes and labels
    for (let i = 0; i < scalesToDraw.length; i++) {
        const angle = (Math.PI * 2 * i) / scalesToDraw.length - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY - radius * Math.sin(angle);

        ctx.page.drawLine({
            start: { x: centerX, y: centerY },
            end: { x, y },
            thickness: 1,
            color: rgb(0.6, 0.6, 0.6)
        });

        const label = scalesToDraw[i].name.substring(0, 15);
        const labelWidth = labelFont.widthOfTextAtSize(label, 8);
        const labelX = centerX + (radius + 15) * Math.cos(angle) - (labelWidth / 2);
        const labelY = centerY - (radius + 15) * Math.sin(angle) - 3;
        ctx.page.drawText(label, { x: labelX, y: labelY, size: 8, font: labelFont });
    }

    // Draw data polygon
    const points = scalesToDraw.map((scale, i) => {
        const score = result.scores[scale.id] || 0;
        const maxScore = scale.maxScore && scale.maxScore > 0 ? scale.maxScore : 100;
        const ratio = Math.max(0, Math.min(1, score / maxScore));
        const angle = (Math.PI * 2 * i) / scalesToDraw.length - Math.PI / 2;
        return {
            x: centerX + (radius * ratio) * Math.cos(angle),
            y: centerY - (radius * ratio) * Math.sin(angle)
        };
    });

    let svgPath = '';
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (i === 0) {
            svgPath += `M ${p.x} ${p.y} `;
        } else {
            svgPath += `L ${p.x} ${p.y} `;
        }
    }
    svgPath += 'Z';

    ctx.page.drawSvgPath(svgPath, {
        color: rgb(0.2, 0.4, 0.8),
        opacity: 0.3,
        borderColor: rgb(0.2, 0.4, 0.8),
        borderWidth: 2,
    });

    ctx.moveDown(size + 20);
}

async function drawRichText(ctx: PdfContext, component: ReportComponent) {
    ctx.checkNewPage(30);
    const normalFont = await ctx.pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await ctx.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await ctx.pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const boldItalicFont = await ctx.pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

    const content = component.options.content || '';
    const fontSize = component.options.fontSize || 10;
    const maxWidth = 500;
    const marginX = 50;
    
    const tokens = content.split(/(<[^>]+>)/).filter(Boolean);

    let isBold = false;
    let isItalic = false;
    let isList = false;
    
    let currentX = marginX;
    const lineHeight = fontSize * 1.5;

    const writeText = (text: string) => {
        if (!text) return;
        const words = text.split(/(\s+)/);

        for (const word of words) {
            if (!word) continue;
            let currentFont = normalFont;
            if (isBold && isItalic) currentFont = boldItalicFont;
            else if (isBold) currentFont = boldFont;
            else if (isItalic) currentFont = italicFont;

            const wordWidth = currentFont.widthOfTextAtSize(word, fontSize);
            
            if (currentX + wordWidth > marginX + maxWidth && word.trim() !== '') {
                ctx.moveDown(lineHeight);
                ctx.checkNewPage(lineHeight);
                currentX = marginX;
                if (isList) currentX += 20;
            }

            if (word.trim() !== '' || currentX !== marginX) {
                ctx.page.drawText(word, { x: currentX, y: ctx.y, size: fontSize, font: currentFont });
                currentX += wordWidth;
            }
        }
    };

    for (const token of tokens) {
        if (token.startsWith('<')) {
            const tag = token.toLowerCase();
            if (tag === '<b>' || tag === '<strong>') isBold = true;
            else if (tag === '</b>' || tag === '</strong>') isBold = false;
            else if (tag === '<i>' || tag === '<em>') isItalic = true;
            else if (tag === '</i>' || tag === '</em>') isItalic = false;
            else if (tag === '<br>' || tag === '<br/>' || tag === '<br />' || tag === '</p>') {
                ctx.moveDown(lineHeight);
                ctx.checkNewPage(lineHeight);
                currentX = marginX;
            } else if (tag === '<p>') {
                if (currentX !== marginX) {
                    ctx.moveDown(lineHeight * 1.5);
                    ctx.checkNewPage(lineHeight);
                    currentX = marginX;
                }
            } else if (tag === '<ul>' || tag === '<ol>') {
                isList = true;
                if (currentX !== marginX) {
                    ctx.moveDown(lineHeight);
                    ctx.checkNewPage(lineHeight);
                }
                currentX = marginX;
            } else if (tag === '</ul>' || tag === '</ol>') {
                isList = false;
                ctx.moveDown(lineHeight);
                ctx.checkNewPage(lineHeight);
                currentX = marginX;
            } else if (tag === '<li>') {
                if (currentX !== marginX) {
                    ctx.moveDown(lineHeight);
                    ctx.checkNewPage(lineHeight);
                }
                currentX = marginX + 10;
                ctx.page.drawText('• ', { x: currentX, y: ctx.y, size: fontSize, font: normalFont });
                currentX += 10;
            }
        } else {
            const text = token.replace(/&nbsp;/g, ' ');
            writeText(text);
        }
    }
    
    ctx.moveDown(lineHeight);
}

export async function generatePdf(
    result: TestResult,
    test: Test,
    branding: BrandingSettings,
    template: PdfTemplate | undefined,
    customInterpretation: string
): Promise<Uint8Array> {

    const pdfDoc = await PDFDocument.create();
    const ctx = new PdfContext(pdfDoc);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const componentsToRender: ReportComponent[] = template && template.components && template.components.length > 0 ? template.components : [
        { id: 'def-h1', type: 'Header', options: { text: `Raport: ${test.title}` } },
        { id: 'def-st', type: 'ScoresTable', title: 'Wyniki surowe', options: {} },
        { id: 'def-barchart', type: 'BarChart', title: 'Profil podstawowy', options: { scaleIds: test.scales.filter(s => s.type === 'standard').map(s => s.id) } },
    ];

    // Page Header
    ctx.page.drawText(`${branding.appName || 'Platforma'}`, { x: 50, y: ctx.height - 30, size: 10 });

    for (const component of componentsToRender) {
        switch (component.type) {
            case 'Header':
                await drawHeader(ctx, component);
                break;
            case 'ScoresTable':
                await drawScoresTable(ctx, component, result, test);
                break;
            case 'BarChart':
                await drawBarChart(ctx, component, result, test);
                break;
            case 'RadarChart':
                await drawRadarChart(ctx, component, result, test);
                break;
            case 'RichText':
                // Use customInterpretation if the component is marked for it (future feature), for now just content
                const content = component.options.content;
                await drawRichText(ctx, { ...component, options: { ...component.options, content } });
                break;
        }
    }

    // Add Custom Interpretation if provided and not handled by RichText
    if (customInterpretation) {
        ctx.checkNewPage(40);
        const headerFont = await ctx.pdfDoc.embedFont(StandardFonts.HelveticaBold);
        ctx.page.drawText('Interpretacja Terapeuty', { x: 50, y: ctx.y, size: 14, font: headerFont });
        ctx.moveDown(25);
        await drawRichText(ctx, { id: 'cust-int', type: 'RichText', options: { content: customInterpretation } });
    }

    return pdfDoc.save();
}
