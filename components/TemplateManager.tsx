'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPdfTemplates, deletePdfTemplate, fetchTests, setDefaultTemplate } from '@/app/actions/testActions';
import { type PdfTemplate, type Test } from './types';
import { PlusIcon, EditIcon, TrashIcon, StarIcon, ChevronDownIcon, ChevronRightIcon, QuestionMarkCircleIcon } from './common/Icons';
import ActionConfirmModal from './common/ActionConfirmModal';
import { toast } from 'react-toastify';

const componentTypeNames: { [key: string]: string } = {
    Header: 'Nagłówek',
    ScoresTable: 'Tabela wyników',
    BarChart: 'Wykres słupkowy',
    RadarChart: 'Wykres radarowy',
    RichText: 'Blok tekstowy',
    Interpretations: 'Szczegółowa interpretacja',
    AnswersList: 'Udzielone odpowiedzi',
    TestDescription: 'Opis i instrukcja testu',
    AiInterpretation: 'Opis zindywidualizowany (AI)',
};

const InfoTooltip = ({ text }: { text: string }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block ml-2">
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-text-muted hover:text-primary transition-colors"
            >
                <QuestionMarkCircleIcon className="w-5 h-5" />
            </button>
            {isVisible && (
                <div className="absolute z-50 w-64 p-3 bg-surface border border-border text-text text-xs rounded-lg shadow-xl -left-28 bottom-full mb-2">
                    {text}
                </div>
            )}
        </div>
    );
};

const TemplateManager: React.FC = () => {
    const router = useRouter();
    const [templates, setTemplates] = useState<PdfTemplate[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [fetchedTemplates, fetchedTests] = await Promise.all([
                fetchPdfTemplates(),
                fetchTests()
            ]);
            setTemplates(fetchedTemplates);
            setTests(fetchedTests);
        } catch (err) {
            setError("Nie udało się załadować danych.");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = async (templateId: string) => {
        try {
            await deletePdfTemplate(templateId);
            setTemplates(prev => prev.filter(t => t.id !== templateId));
            toast.success("Szablon usunięty pomyślnie.");
        } catch {
            toast.error("Nie udało się usunąć szablonu.");
        }
    };

    const handleSetDefault = async (template: PdfTemplate, testId: string) => {
        try {
            await setDefaultTemplate(testId, template.id);
            const updatedTests = await fetchTests();
            setTests(updatedTests);
            toast.success("Zmieniono domyślny szablon.");
        } catch (err) {
            toast.error("Wystąpił błąd podczas ustawiania domyślnego szablonu.");
        }
    };

    const toggleGroup = (testId: string) => {
        setExpandedGroups(prev => ({ ...prev, [testId]: !prev[testId] }));
    };

    const renderTemplateTable = (testTemplates: PdfTemplate[], test: Test) => {
        if (testTemplates.length === 0) {
            return <div className="p-4 text-center text-sm text-text-muted bg-background/60 border-t border-border">Brak zdefiniowanych szablonów dla tego testu.</div>;
        }

        return (
            <div className="overflow-x-auto bg-background/50 border-t border-border">
                <table className="w-full text-left">
                    <thead className="bg-surface/80 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border">
                        <tr>
                            <th className="px-6 py-3">Nazwa szablonu</th>
                            <th className="px-6 py-3 flex items-center">
                                Komponenty
                                <InfoTooltip text="Lista głównych elementów, z których składa się raport (np. wykresy, tabele)." />
                            </th>
                            <th className="px-6 py-3 text-center">
                                Status
                                <InfoTooltip text="Szablon oznaczony jako 'Domyślny' będzie używany automatycznie, gdy nie zostanie wybrany inny." />
                            </th>
                            <th className="px-6 py-3 text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {testTemplates.map(template => {
                            const isDefault = test.defaultTemplateId === template.id;
                            return (
                                <tr key={template.id} className="hover:bg-surface/60 transition-colors">
                                    <td className="px-6 py-4 font-medium text-text">{template.name}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex flex-wrap gap-1.5">
                                            {template.components.map(comp => (
                                                <span key={comp.id} className="bg-surface text-text-muted px-2.5 py-0.5 rounded text-xs border border-border">
                                                    {componentTypeNames[comp.type] || comp.type}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isDefault ? (
                                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-500/15 px-2.5 py-1 rounded border border-amber-500/30">
                                                <StarIcon className="w-3 h-3" /> DOMYŚLNY
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(template, test.id)}
                                                className="text-xs text-text-muted hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
                                            >
                                                Ustaw jako domyślny
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/templates/edit/${template.id}`)}
                                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/15 rounded transition-colors"
                                            title="Edytuj"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setTemplateToDelete(template.id)}
                                            className={`p-1.5 rounded transition-colors ${isDefault ? 'text-text-muted/30 cursor-not-allowed' : 'text-text-muted hover:text-error hover:bg-error/15'}`}
                                            disabled={isDefault}
                                            title={isDefault ? "Nie można usunąć domyślnego szablonu" : "Usuń"}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <>
            <div className="p-8 max-w-6xl mx-auto text-text">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text flex items-center">
                            Konfiguracja Raportów PDF
                            <InfoTooltip text="Zarządzaj wyglądem raportów PDF generowanych dla klientów. Możesz tworzyć różne warianty dla każdego testu." />
                        </h1>
                        <p className="text-text-muted mt-2 text-lg">Twórz szablony i decyduj, jak prezentowane są wyniki.</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/templates/new')}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-contrast font-bold rounded-xl shadow-lg hover:opacity-90 transition-all"
                    >
                        <PlusIcon />
                        Utwórz szablon
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-text-muted"><div className="animate-pulse">Ładowanie szablonów...</div></div>
                ) : error ? (
                    <div className="bg-error/15 text-error border border-error/30 p-4 rounded-lg">{error}</div>
                ) : (
                    <div className="space-y-4">
                        {tests.map(test => {
                            const testTemplates = templates.filter(t => t.testCanonicalId === test.canonicalId);
                            const isExpanded = !!expandedGroups[test.id];

                            return (
                                <div key={test.id} className="bg-surface/90 border border-border rounded-xl shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => toggleGroup(test.id)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-background/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`p-1 rounded-md ${isExpanded ? 'bg-primary/20 text-primary' : 'bg-background text-text-muted'}`}>
                                                {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                                            </span>
                                            <span className="font-bold text-lg text-text">{test.title}</span>
                                            <span className="bg-background text-text-muted border border-border text-xs px-2.5 py-1 rounded-full font-medium">
                                                {testTemplates.length} {testTemplates.length === 1 ? 'szablon' : (testTemplates.length > 1 && testTemplates.length < 5) ? 'szablony' : 'szablonów'}
                                            </span>
                                        </div>

                                        {!isExpanded && testTemplates.length > 0 && (
                                            <div className="flex gap-2 mr-4">
                                                {test.defaultTemplateId && (
                                                    <span className="text-xs text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded border border-amber-500/30 flex items-center gap-1">
                                                        <StarIcon className="w-3 h-3" /> Ustawiono domyślny
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>

                                    {isExpanded && renderTemplateTable(testTemplates, test)}
                                </div>
                            );
                        })}

                        {tests.length === 0 && (
                            <div className="text-center py-12 text-text-muted bg-surface/50 rounded-xl border border-dashed border-border">
                                Brak zdefiniowanych testów w systemie.
                            </div>
                        )}
                    </div>
                )}

                <button onClick={() => router.push('/admin/dashboard')} className="mt-8 px-5 py-2 text-text-muted hover:text-text font-medium transition-colors">
                    &larr; Powrót do panelu
                </button>
            </div>

            <ActionConfirmModal
                isOpen={!!templateToDelete}
                onCancel={() => setTemplateToDelete(null)}
                onConfirm={() => {
                    if (templateToDelete) confirmDelete(templateToDelete);
                    setTemplateToDelete(null);
                }}
                title="Potwierdź usunięcie szablonu"
                message="Czy na pewno chcesz trwale usunąć ten szablon? Tej operacji nie można cofnąć."
                confirmText="Usuń"
            />
        </>
    );
};

export default TemplateManager;
