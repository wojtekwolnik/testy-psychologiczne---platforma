
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { TestResult, Test, PdfTemplate, ReportComponent, BrandingSettings } from './types';

function safeText(str: string | undefined | null): string {
    if (!str) return '';
    return str;
}

function hexToRgb(hex: string) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const num = parseInt(hex, 16);
    return rgb((num >> 16) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

// Helper to manage page and y-position
class PdfContext {
    page: any;
    y: number;
    height: number;
    pdfDoc: PDFDocument;
    regularFont: any;
    boldFont: any;
    italicFont: any;
    boldItalicFont: any;

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


async function drawHeader(ctx: PdfContext, component: ReportComponent, branding: BrandingSettings, result: TestResult) {
    ctx.checkNewPage(80);
    const font = ctx.boldFont;
    const normalFont = ctx.regularFont;
    const pColor = branding.reportPrimaryColor ? hexToRgb(branding.reportPrimaryColor) : rgb(0, 0, 0);

    let maxLogoHeight = 0;

    // Draw logo if available
    const logoUrl = branding.reportLogoUrl || branding.logoUrl;
    if (logoUrl) {
        try {
            let image;
            const isPng = logoUrl.toLowerCase().startsWith('data:image/png') || logoUrl.toLowerCase().endsWith('.png');
            const isJpg = logoUrl.toLowerCase().startsWith('data:image/jpeg') || logoUrl.toLowerCase().startsWith('data:image/jpg') || logoUrl.toLowerCase().endsWith('.jpg') || logoUrl.toLowerCase().endsWith('.jpeg');
            const isSvg = logoUrl.toLowerCase().startsWith('data:image/svg') || logoUrl.toLowerCase().endsWith('.svg');

            if (isSvg) {
                console.warn('SVG logos are not natively supported in PDF generation yet.');
            } else if (isPng || isJpg) {
                const imageBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
                if (isPng) {
                    image = await ctx.pdfDoc.embedPng(imageBytes);
                } else {
                    image = await ctx.pdfDoc.embedJpg(imageBytes);
                }
                const imgDims = image.scaleToFit(180, 60);
                maxLogoHeight = imgDims.height;
                ctx.page.drawImage(image, {
                    x: 50,
                    y: ctx.y + 10 - imgDims.height,
                    width: imgDims.width,
                    height: imgDims.height,
                });
            }
        } catch (e) {
            console.error('Failed to embed logo', e);
        }
    }

    // Client Info
    ctx.page.drawText(safeText(`Kod klienta: ${result.clientIdentifier}`), {
        x: ctx.page.getWidth() - 200,
        y: ctx.y,
        size: 10,
        font: font
    });
    ctx.page.drawText(safeText(`Data badania: ${new Date(result.completedAt).toLocaleDateString()}`), {
        x: ctx.page.getWidth() - 200,
        y: ctx.y - 15,
        size: 10,
        font: normalFont
    });

    const dropAmount = Math.max(maxLogoHeight - 10, 30) + 20;
    ctx.moveDown(dropAmount);

    // Title
    ctx.page.drawText(safeText(component.options.text || 'Nagłówek'), {
        x: 50,
        y: ctx.y,
        size: component.options.fontSize || 18,
        font,
        color: pColor
    });
    
    // Primary Color line
    ctx.page.drawLine({
        start: { x: 50, y: ctx.y - 10 },
        end: { x: ctx.page.getWidth() - 50, y: ctx.y - 10 },
        thickness: 2,
        color: pColor
    });

    ctx.moveDown((component.options.fontSize || 18) + (component.options.marginBottom || 15));
}

async function drawScoresTable(ctx: PdfContext, component: ReportComponent, result: TestResult, test: Test, branding: BrandingSettings) {
    ctx.checkNewPage(50);
    const headerFont = ctx.boldFont;
    const bodyFont = ctx.regularFont;
    const pColor = branding.reportPrimaryColor ? hexToRgb(branding.reportPrimaryColor) : rgb(0, 0, 0);

    // Title for the table
    if (component.title) {
        ctx.page.drawText(safeText(component.title), { x: 50, y: ctx.y, size: 14, font: headerFont, color: pColor });
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
    ctx.page.drawText(safeText('Skala'), { x: 55, y: ctx.y, font: headerFont, size: 10 });
    ctx.page.drawText(safeText('Wynik'), { x: 320, y: ctx.y, font: headerFont, size: 10 });
    ctx.page.drawText(safeText('Poziom'), { x: 420, y: ctx.y, font: headerFont, size: 10 });
    ctx.moveDown(20);

    // Body
    for (const scaleId of scaleIds) {
        const score = result.scores[scaleId];
        const scaleInfo = test.scales.find(s => s.id === scaleId);
        if (score === undefined || !scaleInfo) continue;

        const levelText = getScoreLevel(score, scaleInfo);

        ctx.checkNewPage(20);
        ctx.page.drawText(safeText(scaleInfo.name), { x: 55, y: ctx.y, font: bodyFont, size: 10 });
        ctx.page.drawText(safeText(`${score}${scaleInfo.maxScore ? ` / ${scaleInfo.maxScore}` : ''}`), { x: 320, y: ctx.y, font: bodyFont, size: 10 });
        ctx.page.drawText(safeText(levelText), { x: 420, y: ctx.y, font: bodyFont, size: 10 });
        ctx.moveDown(20);
    }
    ctx.moveDown(10); // Margin after table
}

async function drawBarChart(ctx: PdfContext, component: ReportComponent, result: TestResult, test: Test, branding: BrandingSettings) {
    ctx.checkNewPage(150); // Reserve space for chart
    const headerFont = ctx.boldFont;
    const pColor = branding.reportPrimaryColor ? hexToRgb(branding.reportPrimaryColor) : rgb(0.2, 0.4, 0.8);

    if (component.title) {
        ctx.page.drawText(safeText(component.title), { x: 50, y: ctx.y, size: 14, font: headerFont, color: pColor });
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
            color: pColor
        });
        // Draw Label
        const label = safeText(scaleInfo.abbreviation || scaleInfo.name.substring(0, 1).toUpperCase());
        ctx.page.drawText(label, {
            x: currentX + 5,
            y: ctx.y - barHeight - 15,
            size: 8
        });
        currentX += barWidth + barSpacing;
    }
    ctx.moveDown(120 + 20); // Chart height + margin
}

async function drawRadarChart(ctx: PdfContext, component: ReportComponent, result: TestResult, test: Test, branding: BrandingSettings) {
    const size = 200; // Total width and height of the chart
    ctx.checkNewPage(size + 60);
    const headerFont = ctx.boldFont;
    const labelFont = ctx.regularFont;
    const pColor = branding.reportPrimaryColor ? hexToRgb(branding.reportPrimaryColor) : rgb(0.2, 0.4, 0.8);

    if (component.title) {
        ctx.page.drawText(safeText(component.title), { x: 50, y: ctx.y, size: 14, font: headerFont, color: pColor });
        ctx.moveDown(25);
    }

    const scaleIds = component.options.scaleIds || Object.keys(result.scores);
    const scalesToDraw = scaleIds.map((id: string) => test.scales.find((s: any) => s.id === id)).filter((s: any) => !!s) as typeof test.scales;

    if (scalesToDraw.length < 3) {
        ctx.page.drawText(safeText('Wykres radarowy wymaga co najmniej 3 skal.'), { x: 50, y: ctx.y, size: 10, font: labelFont });
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

        const label = safeText(scalesToDraw[i].abbreviation || scalesToDraw[i].name.substring(0, 15));
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
        color: pColor,
        opacity: 0.3,
        borderColor: pColor,
        borderWidth: 2,
    });

    ctx.moveDown(size + 20);
}

async function drawRichText(ctx: PdfContext, component: ReportComponent, result?: TestResult, test?: Test) {
    ctx.checkNewPage(30);
    const normalFont = ctx.regularFont;
    const boldFont = ctx.boldFont;
    const italicFont = ctx.italicFont;
    const boldItalicFont = ctx.boldItalicFont;

    let content = component.options.content || '';

    // Replace variables if result and test are provided
    if (result && test) {
        content = content.replace(/\{\{imie\}\}/g, result.clientIdentifier || 'Brak danych');
        content = content.replace(/\{\{data\}\}/g, new Date(result.completedAt).toLocaleDateString() || 'Brak danych');
        content = content.replace(/\{\{nazwa_testu\}\}/g, test.title || 'Brak danych');
        
        // Match {{wynik:ID}} and {{poziom:ID}}
        content = content.replace(/\{\{wynik:([^}]+)\}\}/g, (match: string, scaleId: string) => {
            return result.scores[scaleId] !== undefined ? String(result.scores[scaleId]) : '?';
        });
        
        content = content.replace(/\{\{poziom:([^}]+)\}\}/g, (match: string, scaleId: string) => {
            const score = result.scores[scaleId];
            const scale = test.scales.find(s => s.id === scaleId);
            if (score === undefined || !scale) return '?';
            if (scale.levels && scale.levels.length > 0) {
                const matched = scale.levels.find(l => score >= l.minScore && score <= l.maxScore) || scale.levels[scale.levels.length - 1];
                return matched.name;
            }
            return String(score);
        });
    }

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

            const cleanWord = safeText(word);
            const wordWidth = currentFont.widthOfTextAtSize(cleanWord, fontSize);
            
            if (currentX + wordWidth > marginX + maxWidth && word.trim() !== '') {
                ctx.moveDown(lineHeight);
                ctx.checkNewPage(lineHeight);
                currentX = marginX;
                if (isList) currentX += 20;
            }

            if (word.trim() !== '' || currentX !== marginX) {
                ctx.page.drawText(cleanWord, { x: currentX, y: ctx.y, size: fontSize, font: currentFont });
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

async function drawInterpretations(ctx: PdfContext, component: ReportComponent, result: TestResult, test: Test, branding: BrandingSettings) {
    ctx.checkNewPage(50);
    const headerFont = ctx.boldFont;
    const pColor = branding.reportPrimaryColor ? hexToRgb(branding.reportPrimaryColor) : rgb(0, 0, 0);
    
    if (component.title) {
        ctx.page.drawText(safeText(component.title), { x: 50, y: ctx.y, size: 14, font: headerFont, color: pColor });
        ctx.moveDown(25);
    }

    const scaleIds = component.options.scaleIds || Object.keys(result.scores);

    const getScoreLevel = (val: number, scale: any) => {
        if (!scale) return null;
        if (scale.levels && scale.levels.length > 0) {
            return scale.levels.find((l: any) => val >= l.minScore && val <= l.maxScore) || scale.levels[scale.levels.length - 1];
        }
        return null;
    };

    for (const scaleId of scaleIds) {
        const score = result.scores[scaleId];
        const scaleInfo = test.scales.find(s => s.id === scaleId);
        if (score === undefined || !scaleInfo) continue;

        let content = `<b>${scaleInfo.name}</b><br>`;
        if (scaleInfo.description) {
            content += `${scaleInfo.description}<br>`;
        }

        const levelInfo = getScoreLevel(score, scaleInfo);
        if (levelInfo && levelInfo.description) {
            content += `<b>Interpretacja wyniku (${levelInfo.name}):</b><br>${levelInfo.description}<br>`;
        }
        
        content += `<br>`;

        await drawRichText(ctx, { id: 'temp-rt', type: 'RichText', options: { content } }, result, test);
    }
}

async function drawTestDescription(ctx: PdfContext, component: ReportComponent, test: Test, branding: BrandingSettings) {
    ctx.checkNewPage(50);
    const headerFont = ctx.boldFont;
    const pColor = branding.reportPrimaryColor ? hexToRgb(branding.reportPrimaryColor) : rgb(0, 0, 0);
    
    const title = component.title || 'Opis testu';
    ctx.page.drawText(safeText(title), { x: 50, y: ctx.y, size: 14, font: headerFont, color: pColor });
    ctx.moveDown(25);

    let content = '';
    if (test.description) {
        content += `<b>Cel badania:</b><br>${test.description}<br><br>`;
    }
    if (test.instructions) {
        content += `<b>Instrukcja:</b><br>${test.instructions}<br>`;
    }
    
    if (content) {
        await drawRichText(ctx, { id: 'temp-desc', type: 'RichText', options: { content } });
    }
}

async function drawAnswersList(ctx: PdfContext, component: ReportComponent, result: TestResult, test: Test, branding: BrandingSettings) {
    ctx.checkNewPage(50);
    const headerFont = ctx.boldFont;
    const bodyFont = ctx.regularFont;
    const italicFont = ctx.italicFont;
    const pColor = branding.reportPrimaryColor ? hexToRgb(branding.reportPrimaryColor) : rgb(0, 0, 0);
    
    const title = component.title || 'Udzielone odpowiedzi';
    ctx.page.drawText(safeText(title), { x: 50, y: ctx.y, size: 14, font: headerFont, color: pColor });
    ctx.moveDown(25);

    let questionIndex = 1;
    for (const section of test.sections) {
        ctx.checkNewPage(40);
        ctx.page.drawText(safeText(section.title), { x: 50, y: ctx.y, size: 12, font: headerFont });
        ctx.moveDown(20);

        for (const question of section.questions) {
            ctx.checkNewPage(30);
            
            // Print question
            const qText = safeText(`${questionIndex}. ${question.text}`);
            ctx.page.drawText(qText, { x: 50, y: ctx.y, size: 10, font: bodyFont });
            ctx.moveDown(15);
            
            // Find answer
            const answerId = result.answers[question.id];
            let answerText = 'Brak odpowiedzi';
            if (answerId) {
                const option = question.options.find(o => o.id === answerId);
                if (option) answerText = option.text;
            }
            
            ctx.page.drawText(safeText(`➜ ${answerText}`), { x: 70, y: ctx.y, size: 10, font: italicFont });
            ctx.moveDown(20);
            questionIndex++;
        }
    }
}

async function drawAiInterpretation(ctx: PdfContext, component: ReportComponent, result: TestResult, branding: BrandingSettings) {
    if (!result.analysis) return; // Skip if no AI analysis exists

    ctx.checkNewPage(50);
    const headerFont = ctx.boldFont;
    const pColor = branding.reportPrimaryColor ? hexToRgb(branding.reportPrimaryColor) : rgb(0, 0, 0);
    
    const title = component.title || 'Opis zindywidualizowany';
    ctx.page.drawText(safeText(title), { x: 50, y: ctx.y, size: 14, font: headerFont, color: pColor });
    ctx.moveDown(25);

    // Format analysis to basic HTML if it uses markdown (simple replacement)
    let content = result.analysis
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/\n\n/g, '<p></p>')
        .replace(/\n/g, '<br>');

    await drawRichText(ctx, { id: 'temp-ai', type: 'RichText', options: { content } });
}

export async function generatePdf(
    result: TestResult,
    test: Test,
    branding: BrandingSettings,
    template: PdfTemplate | undefined,
    customInterpretation: string
): Promise<Uint8Array> {

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fetchFont = async (filename: string) => {
        const response = await fetch(`/fonts/${filename}`);
        if (!response.ok) {
            console.error(`Failed to load font: ${filename}`);
            throw new Error(`Nie udało się załadować czcionki: ${filename}`);
        }
        return await response.arrayBuffer();
    };

    const regularFontBytes = await fetchFont('Roboto-Regular.ttf');
    const boldFontBytes = await fetchFont('Roboto-Bold.ttf');
    const italicFontBytes = await fetchFont('Roboto-Italic.ttf');
    const boldItalicFontBytes = await fetchFont('Roboto-BoldItalic.ttf');

    const regularFont = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);
    const italicFont = await pdfDoc.embedFont(italicFontBytes);
    const boldItalicFont = await pdfDoc.embedFont(boldItalicFontBytes);

    const ctx = new PdfContext(pdfDoc);
    ctx.regularFont = regularFont;
    ctx.boldFont = boldFont;
    ctx.italicFont = italicFont;
    ctx.boldItalicFont = boldItalicFont;

    const font = regularFont;

    const componentsToRender: ReportComponent[] = template && template.components && template.components.length > 0 ? template.components : [
        { id: 'def-h1', type: 'Header', options: { text: `Raport: ${test.title}` } },
        { id: 'def-st', type: 'ScoresTable', title: 'Wyniki surowe', options: {} },
        { id: 'def-barchart', type: 'BarChart', title: 'Profil podstawowy', options: { scaleIds: test.scales.filter(s => s.type === 'standard').map(s => s.id) } },
        { id: 'def-interp', type: 'Interpretations', title: 'Szczegółowa interpretacja', options: {} },
    ];

    for (const component of componentsToRender) {
        switch (component.type) {
            case 'Header':
                await drawHeader(ctx, component, branding, result);
                break;
            case 'ScoresTable':
                await drawScoresTable(ctx, component, result, test, branding);
                break;
            case 'BarChart':
                await drawBarChart(ctx, component, result, test, branding);
                break;
            case 'RadarChart':
                await drawRadarChart(ctx, component, result, test, branding);
                break;
            case 'RichText':
                await drawRichText(ctx, component, result, test);
                break;
            case 'Interpretations':
                await drawInterpretations(ctx, component, result, test, branding);
                break;
            case 'TestDescription':
                await drawTestDescription(ctx, component, test, branding);
                break;
            case 'AnswersList':
                await drawAnswersList(ctx, component, result, test, branding);
                break;
            case 'AiInterpretation':
                await drawAiInterpretation(ctx, component, result, branding);
                break;
        }
    }

    // Add Custom Interpretation if provided and not handled by RichText
    if (customInterpretation) {
        ctx.checkNewPage(40);
        const headerFont = ctx.boldFont;
        const pColor = branding.reportPrimaryColor ? hexToRgb(branding.reportPrimaryColor) : rgb(0, 0, 0);
        ctx.page.drawText(safeText('Interpretacja Terapeuty'), { x: 50, y: ctx.y, size: 14, font: headerFont, color: pColor });
        ctx.moveDown(25);
        await drawRichText(ctx, { id: 'cust-int', type: 'RichText', options: { content: customInterpretation } }, result, test);
    }

    // Draw Footer and Pagination on every page
    const pages = pdfDoc.getPages();
    const pageCount = pages.length;
    const footerText = branding.reportFooterText || '';
    
    for (let i = 0; i < pageCount; i++) {
        const p = pages[i];
        p.drawText(safeText(`Strona ${i + 1} z ${pageCount}`), {
            x: p.getWidth() - 100,
            y: 20,
            size: 9,
            font: font,
            color: rgb(0.5, 0.5, 0.5)
        });
        if (footerText) {
            p.drawText(safeText(footerText), {
                x: 50,
                y: 20,
                size: 9,
                font: font,
                color: rgb(0.5, 0.5, 0.5)
            });
        }
    }

    return pdfDoc.save();
}
