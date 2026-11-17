'use client';

import React from 'react';
import type { Test } from '../types';

export type HelpTopic = 'formula' | 'sections' | 'reversed' | 'auto-score' | null;

export const LIKERT_5_LABELS = [
    'Zdecydowanie nie zgadzam się',
    'Raczej się nie zgadzam',
    'Nie mam zdania/Średnio',
    'Raczej się zgadzam',
    'Zdecydowanie zgadzam się',
];

export const YES_NO_LABELS = ['Tak', 'Nie'];

export const validateTest = (test: Test): string[] => {
    const errors: string[] = [];
    if (!test.title || test.title.trim() === '') errors.push('Tytuł testu jest wymagany');
    if (test.sections.length === 0) errors.push('Test musi zawierać przynajmniej jedną sekcję');

    test.sections.forEach((section) => {
        if (section.questions.length === 0) errors.push(`Sekcja "${section.title}" nie zawiera pytań`);
        section.questions.forEach((q, qIndex) => {
            if (!q.text || q.text.trim() === '') errors.push(`Pytanie ${qIndex + 1} w sekcji "${section.title}" nie ma treści`);
        });
    });

    test.scales.forEach((scale, index) => {
        if (!scale.name || scale.name.trim() === '') errors.push(`Skala #${index + 1} nie ma nazwy`);
    });

    return errors;
};

export const TestEditorHelpModal: React.FC<{
    helpTopic: HelpTopic;
    onClose: () => void;
}> = ({ helpTopic, onClose }) => {
    if (!helpTopic) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-text">
                        {helpTopic === 'formula' && 'Jak tworzyć formuły obliczeniowe?'}
                        {helpTopic === 'sections' && 'Sekcje i Paginacja'}
                        {helpTopic === 'reversed' && 'Odwrócona Punktacja'}
                        {helpTopic === 'auto-score' && 'Automatyczne Przypisywanie Punktów'}
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4 text-sm text-text-muted">
                    {helpTopic === 'formula' && (
                        <>
                            <p>
                                Formuły pozwalają na automatyczne obliczanie wyników na podstawie innych skal.
                                Możesz używać standardowych operatorów matematycznych oraz funkcji.
                            </p>
                            <div className="bg-background/60 p-4 rounded-lg border border-border">
                                <h4 className="font-semibold text-text mb-2">Dostępne Operatory:</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><code>+</code> (Dodawanie)</li>
                                    <li><code>-</code> (Odejmowanie)</li>
                                    <li><code>*</code> (Mnożenie)</li>
                                    <li><code>/</code> (Dzielenie)</li>
                                    <li><code>( )</code> (Nawiasy do grupowania)</li>
                                </ul>
                            </div>
                            <div className="bg-background/60 p-4 rounded-lg border border-border">
                                <h4 className="font-semibold text-text mb-2">Zmienne (Skale):</h4>
                                <p className="mb-2">Aby użyć wyniku z innej skali, wstaw jej ID w nawiasach klamrowych, np. <code>{`{scale-123}`}</code>.</p>
                                <p className="text-xs text-text-muted">
                                    Użyj przycisków &quot;Wstaw ID skali&quot; pod polem formuły, aby szybko dodać odpowiedni identyfikator.
                                </p>
                            </div>
                            <div className="bg-background/60 p-4 rounded-lg border border-border">
                                <h4 className="font-semibold text-text mb-2">Przykłady:</h4>
                                <ul className="space-y-2 font-mono text-xs">
                                    <li className="bg-surface p-2 border border-border rounded text-text">
                                        <div className="text-text-muted">// Suma dwóch skal</div>
                                        {`{s-1234} + {s-5678}`}
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}

                    {helpTopic === 'sections' && (
                        <>
                            <p>
                                W edytorze testu <strong className="text-text">każda sekcja odpowiada jednej stronie</strong> w widoku dla klienta.
                            </p>
                            <p>
                                Ustawienie &quot;Maksymalna liczba pytań w sekcji&quot; służy jako wskazówka i pomaga kontrolować długość testu, ale ostateczny podział na strony zależy od liczby utworzonych sekcji.
                            </p>
                            <p className="mt-2 text-primary font-semibold">
                                Dobra praktyka: Twórz nowe sekcje tematycznie lub co 5-10 pytań, aby nie przytłoczyć użytkownika zbyt długą stroną.
                            </p>
                        </>
                    )}

                    {helpTopic === 'reversed' && (
                        <>
                            <p>
                                <strong className="text-text">Odwrócona punktacja</strong> jest używana w pytaniach, gdzie treść jest sformułowana negatywnie względem mierzonej cechy.
                            </p>
                            <p>
                                Gdy opcja jest zaznaczona:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Dla pytań <strong className="text-text">Tak/Nie</strong>: &quot;Tak&quot; = 0 pkt, &quot;Nie&quot; = 1 pkt.</li>
                                <li>Dla <strong className="text-text">Skali Likerta (1-5)</strong>: Najniższa ocena dostaje 5 pkt, a najwyższa 1 pkt.</li>
                                <li>Dla <strong className="text-text">Skali Numerycznej</strong>: Punkty są przydzielane odwrotnie do wartości liczbowej.</li>
                            </ul>
                            <p className="mt-4 text-xs text-text-muted">
                                Przełączenie tej opcji automatycznie przelicza punkty (np. 1→5 na 5→1) dla wszystkich skal przypisanych do danego pytania.
                            </p>
                        </>
                    )}

                    {helpTopic === 'auto-score' && (
                        <>
                            <p>
                                To narzędzie pozwala na <strong className="text-text">szybkie przypisanie pytania do jednej lub wielu skal</strong> jednocześnie.
                            </p>
                            <p>
                                Każde wybranie skali z listy <em>„+ Dodaj skalę do pytania...”</em> dopisuje ją do wszystkich opcji odpowiedzi w pytaniu (z uwzględnieniem przełącznika „Odwrócona punktacja”), nie kasując wcześniej przypisanych skal.
                            </p>
                            <div className="bg-blue-500/15 p-3 rounded border border-blue-500/30 text-blue-200 mt-2">
                                <strong>Wskazówka:</strong> Przypisane skale widoczne są jako niebieskie znaczniki pod wyborem typu pytania (oraz na pasku zwiniętego pytania) — kliknięcie <strong>&times;</strong> na znaczniku usuwa daną skalę ze wszystkich odpowiedzi pytania naraz.
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-primary text-background font-semibold rounded hover:bg-primary/90"
                    >
                        Rozumiem
                    </button>
                </div>
            </div>
        </div>
    );
};
