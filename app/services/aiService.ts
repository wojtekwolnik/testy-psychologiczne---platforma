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
    // const answers = JSON.parse(result.answers as string); // Not used yet but available

    // Prepare prompt
    let promptContext = `Test: ${result.test.title}\n`;
    promptContext += `Description: ${result.test.description}\n\n`;
    promptContext += `Scores:\n`;

    result.test.scales.forEach(scale => {
        promptContext += `- ${scale.name}: ${scores[scale.id] ?? 0} (Range: 0-${scale.maxScore || 'N/A'})\n`;
    });

    const fullPrompt = systemPrompt + "\n\n" + promptContext;

    try {
        if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(apiKey);
            const aiModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' });

            const result = await aiModel.generateContent({
                contents: [
                    { role: 'user', parts: [{ text: fullPrompt }] }
                ]
            });
            return result.response.text();
        }
        else if (provider === 'openai') {
            const openai = new OpenAI({ apiKey: apiKey });
            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: promptContext }],
                model: model || "gpt-3.5-turbo",
            });
            return completion.choices[0].message.content;
        }
        else if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey: apiKey });
            const message = await anthropic.messages.create({
                max_tokens: 1024,
                messages: [{ role: 'user', content: fullPrompt }],
                model: model || 'claude-3-opus-20240229',
            });
            // Handle ContentBlock[] response
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
