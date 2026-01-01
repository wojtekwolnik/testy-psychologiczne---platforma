
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPdfTemplates, deletePdfTemplate, fetchTests, setDefaultTemplate } from '@/app/actions/testActions';
import { type PdfTemplate, type Test } from './types';
import { PlusIcon, EditIcon, TrashIcon, StarIcon, ChevronDownIcon, ChevronRightIcon, QuestionMarkCircleIcon } from './common/Icons';
import ActionConfirmModal from './common/ActionConfirmModal';
import { toast } from 'react-toastify';

// Helper to map component types to human-readable names
const componentTypeNames: { [key: string]: string } = {
    Header: 'Nagłówek',
    ScoresTable: 'Tabela wyników',
    BarChart: 'Wykres słupkowy',
    RadarChart: 'Wykres radarowy',
    RichText: 'Blok tekstowy',
};

// Tooltip helper
const InfoTooltip = ({ text }: { text: string }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block ml-2">
            <button
                onClick={() => setIsVisible(!isVisible)}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-slate-400 hover:text-[var(--primary-color)] transition-colors"
            >
                <QuestionMarkCircleIcon className="w-5 h-5" />
            </button>
            {isVisible && (
                <div className="absolute z-50 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl -left-28 bottom-full mb-2">
                    {text}
                    <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-slate-800 transform -translate-x-1/2 rotate-45"></div>
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

    // Grouping state: Record<testId, isOpen>
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
            return <div className="p-4 text-center text-sm opacity-60 bg-white border-t">Brak zdefiniowanych szablonów dla tego testu.</div>;
        }

        return (
            <div className="overflow-x-auto bg-white border-t border-gray-100">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                    <tbody className="divide-y divide-gray-100">
                        {testTemplates.map(template => {
                            const isDefault = test.defaultTemplateId === template.id;
                            return (
                                <tr key={template.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{template.name}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex flex-wrap gap-1">
                                            {template.components.map(comp => (
                                                <span key={comp.id} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded textxs border border-slate-200">
                                                    {componentTypeNames[comp.type] || comp.type}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isDefault ? (
                                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                                <StarIcon className="w-3 h-3" /> DOMYŚLNY
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(template, test.id)}
                                                className="text-xs text-slate-400 hover:text-[var(--primary-color)] transition-colors underline decoration-dotted underline-offset-2"
                                            >
                                                Ustaw jako domyślny
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/templates/edit/${template.id}`)}
                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Edytuj"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setTemplateToDelete(template.id)}
                                            className={`p-1.5 rounded transition-colors ${isDefault ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}`}
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
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                            Konfiguracja Raportów
                            <InfoTooltip text="Zarządzaj wyglądem raportów PDF generowanych dla pacientów. Możesz tworzyć różne warianty dla każdego testu." />
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">Twórz szablony i decyduj, jak prezentowane są wyniki.</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/templates/new')}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--primary-color)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        <PlusIcon />
                        Utwórz szablon
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-12"><div className="animate-pulse">Ładowanie szablonów...</div></div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
                ) : (
                    <div className="space-y-4">
                        {tests.map(test => {
                            const testTemplates = templates.filter(t => t.testCanonicalId === test.canonicalId);
                            const isExpanded = !!expandedGroups[test.id];

                            return (
                                <div key={test.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <button
                                        onClick={() => toggleGroup(test.id)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`p-1 rounded-md ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                                            </span>
                                            <span className="font-bold text-lg text-slate-700">{test.title}</span>
                                            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-medium">
                                                {testTemplates.length} {testTemplates.length === 1 ? 'szablon' : (testTemplates.length > 1 && testTemplates.length < 5) ? 'szablony' : 'szablonów'}
                                            </span>
                                        </div>

                                        {/* Status preview if collapsed */}
                                        {!isExpanded && testTemplates.length > 0 && (
                                            <div className="flex gap-2 mr-4">
                                                {test.defaultTemplateId && (
                                                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
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
                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                Brak zdefiniowanych testów w systemie.
                            </div>
                        )}
                    </div>
                )}

                <button onClick={() => router.push('/admin/dashboard')} className="mt-8 px-5 py-2 text-slate-500 hover:text-slate-800 font-medium transition-colors">
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
