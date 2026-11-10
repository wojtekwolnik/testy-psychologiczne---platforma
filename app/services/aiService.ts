import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getInternalBrandingSettings } from './settingsService';
import { prisma } from '@/lib/prisma';
import { getNormalizedBigFiveScaleData, resolveScaleLevel } from '@/lib/interpretationBuilder';

export async function generateAnalysis(resultId: string): Promise<string | null> {
    const settings = await getInternalBrandingSettings();

    if (!settings?.aiSettings?.enabled || !settings.aiSettings.apiKey) {
        console.log('AI Analysis skipped: Disabled or missing API Key.');
        return null;
    }

    const { provider, apiKey, systemPrompt, model } = settings.aiSettings;

    // Fetch full result context
    const result = await prisma.testResult.findUnique({
        where: { id: resultId },
        include: { test: { include: { scales: true } } },
    });

    if (!result) return null;

    const scores = JSON.parse(result.scores as string) as Record<string, number>;
    const isBigFive = result.test.canonicalId === 'big-five-johnson-120';

    // Prepare prompt with dynamic N-level scale thresholds and key interpretations
    let promptContext = `Test: ${result.test.title}\n`;
    promptContext += `Opis testu: ${result.test.description}\n\n`;
    promptContext += `Wyniki badanego w poszczególnych skalach (wraz z dopasowanym progiem z klucza testu):\n`;

    result.test.scales.forEach(scale => {
        const val = scores[scale.id] ?? 0;
        let parsedLevels: any = scale.levels;
        let scaleDescription = scale.description || '';

        if (isBigFive) {
            const normalized = getNormalizedBigFiveScaleData({
                id: scale.id,
                name: scale.name,
                description: scaleDescription,
                levels: parsedLevels,
            });
            if (normalized) {
                scaleDescription = normalized.description;
                parsedLevels = normalized.levels;
            }
        }

        const resolved = resolveScaleLevel(val, {
            maxScore: scale.maxScore,
            levels: parsedLevels,
        });

        const rankInfo =
            resolved.totalLevels > 0
                ? ` (próg ${resolved.rankIndex + 1} z ${resolved.totalLevels})`
                : '';
        const rangeInfo =
            resolved.minScore !== undefined && resolved.maxScore !== undefined
                ? ` [przedział: ${resolved.minScore}-${resolved.maxScore} pkt]`
                : '';

        const cleanScaleDesc = scaleDescription
            ? `\n  Definicja skali: ${scaleDescription.replace(/<[^>]+>/g, ' ').trim()}`
            : '';
        const cleanLevelDesc = resolved.description
            ? `\n  Opis osiągniętego progu z klucza: ${resolved.description.replace(/<[^>]+>/g, ' ').trim()}`
            : '';

        promptContext += `- ${scale.name}: ${val}${scale.maxScore ? ` / ${scale.maxScore}` : ''} pkt | Osiągnięty poziom: ${resolved.label}${rankInfo}${rangeInfo}${cleanScaleDesc}${cleanLevelDesc}\n`;
    });

    const synthesisInstruction = `
WAŻNE WYTYCZNE DOTYCZĄCE STRUKTURY ODPOWIEDZI:
Podstawowe opisy pojedynczych skal z klucza testu są już wygenerowane w raporcie. Twoim zadaniem jako asystenta psychologa/terapeuty NIE JEST powtarzanie definicji pojedynczych skal, lecz przygotowanie pogłębionej SYNTEZY PROFILU:
1. **Synteza i interakcje między wymiarami**: Wskaż najważniejsze powiązania, synergie oraz potencjalne napięcia wewnętrzne wynikające z kombinacji uzyskanych poziomów w różnych skalach (jak te cechy wzajemnie na siebie wpływają w codziennym funkcjonowaniu, pracy i relacjach).
2. **Zasoby i obszary wrażliwości**: Wypunktuj główne mocne strony profilu oraz sytuacje, które mogą stanowić wyzwanie lub źródło stresu.
3. **Hipotezy i pytania pogłębiające na sesję (3–4 pytania)**: Zaproponuj konkretne, otwarte pytania kliniczne/rozwojowe dla terapeuty do omówienia z osobą badaną podczas sesji.
Sformatuj odpowiedź przejrzyście po polsku, używając prostych znaczników HTML (<p>, <strong>, <ul>, <li>) bez bloków kodu \`\`\`html.`;

    const effectiveSystemPrompt = `${systemPrompt}\n${synthesisInstruction}`;
    const fullPrompt = `${effectiveSystemPrompt}\n\n${promptContext}`;

    try {
        if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(apiKey);
            const resolvedModel =
                !model || model === 'gemini-1.5-flash' ? 'gemini-2.5-flash' : model;
            const aiModel = genAI.getGenerativeModel({ model: resolvedModel });

            const genResult = await aiModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            });
            return genResult.response.text();
        } else if (provider === 'openai') {
            const openai = new OpenAI({ apiKey });
            const resolvedModel =
                !model || model === 'gpt-3.5-turbo' || model.startsWith('gemini')
                    ? 'gpt-4o-mini'
                    : model;
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: 'system', content: effectiveSystemPrompt },
                    { role: 'user', content: promptContext },
                ],
                model: resolvedModel,
            });
            return completion.choices[0].message.content;
        } else if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey });
            const resolvedModel =
                !model || model === 'claude-3-opus-20240229' || model.startsWith('gemini')
                    ? 'claude-sonnet-4-20250514'
                    : model;
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
            return 'No text response from Claude.';
        }

        console.log(`AI Analysis skipped: Unknown provider ${provider}`);
        return null;
    } catch (error) {
        console.error('AI Generation Error:', error);
        return null;
    }
}
