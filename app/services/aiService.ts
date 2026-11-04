import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getInternalBrandingSettings } from './settingsService';
import { prisma } from '@/lib/prisma';

export async function generateAnalysis(resultId: string): Promise<string | null> {
    const settings = await getInternalBrandingSettings();

    if (!settings?.aiSettings?.enabled || !settings.aiSettings.apiKey) {
        console.log("AI Analysis skipped: Disabled or missing API Key.");
        return null;
    }

    const { provider, apiKey, systemPrompt, model } = settings.aiSettings;

    // Fetch full result context
    const result = await prisma.testResult.findUnique({
        where: { id: resultId },
        include: { test: { include: { scales: true } } }
    });

    if (!result) return null;

    const scores = JSON.parse(result.scores as string) as Record<string, number>;

    // Prepare prompt with scale levels and psychometric norms
    let promptContext = `Test: ${result.test.title}\n`;
    promptContext += `Opis testu: ${result.test.description}\n\n`;
    promptContext += `Wyniki badanego w poszczególnych skalach:\n`;

    result.test.scales.forEach(scale => {
        const val = scores[scale.id] ?? 0;
        let levelStr = '';
        let levelDesc = '';

        if (scale.levels) {
            try {
                const parsedLevels = JSON.parse(scale.levels);
                if (Array.isArray(parsedLevels) && parsedLevels.length > 0) {
                    const matched = parsedLevels.find((l: any) => val >= l.minScore && val <= l.maxScore);
                    if (matched) {
                        levelStr = ` | Poziom wg norm testu: ${matched.name} (${matched.minScore}-${matched.maxScore} pkt)`;
                        if (matched.description) {
                            levelDesc = `\n  Interpretacja normatywna poziomu: ${String(matched.description).replace(/<[^>]+>/g, ' ').trim()}`;
                        }
                    }
                }
            } catch {
                // ignore malformed levels JSON
            }
        }

        const cleanScaleDesc = scale.description ? `\n  Opis skali: ${scale.description.replace(/<[^>]+>/g, ' ').trim()}` : '';
        promptContext += `- ${scale.name}: ${val} pkt (Zakres: 0-${scale.maxScore || 'N/A'})${levelStr}${levelDesc}${cleanScaleDesc}\n`;
    });

    const fullPrompt = systemPrompt + "\n\n" + promptContext;

    try {
        if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(apiKey);
            const resolvedModel = (!model || model === 'gemini-1.5-flash') ? 'gemini-2.5-flash' : model;
            const aiModel = genAI.getGenerativeModel({ model: resolvedModel });

            const genResult = await aiModel.generateContent({
                contents: [
                    { role: 'user', parts: [{ text: fullPrompt }] }
                ]
            });
            return genResult.response.text();
        }
        else if (provider === 'openai') {
            const openai = new OpenAI({ apiKey: apiKey });
            const resolvedModel = (!model || model === 'gpt-3.5-turbo' || model.startsWith('gemini')) ? 'gpt-4o-mini' : model;
            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: promptContext }],
                model: resolvedModel,
            });
            return completion.choices[0].message.content;
        }
        else if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey: apiKey });
            const resolvedModel = (!model || model === 'claude-3-opus-20240229' || model.startsWith('gemini')) ? 'claude-sonnet-4-20250514' : model;
            const message = await anthropic.messages.create({
                max_tokens: 1536,
                messages: [{ role: 'user', content: fullPrompt }],
                model: resolvedModel,
            });
            if (message.content && message.content.length > 0) {
                const block = message.content[0];
                if (block.type === 'text') {
                    return block.text;
                }
            }
            return "No text response from Claude.";
        }

        console.log(`AI Analysis skipped: Unknown provider ${provider}`);
        return null;

    } catch (error) {
        console.error("AI Generation Error:", error);
        return null;
    }
}
