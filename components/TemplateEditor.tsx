'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPdfTemplateById, savePdfTemplate, fetchTests } from '@/app/actions/testActions';
import { type PdfTemplate, type ReportComponent, type Test, type Scale } from './types';
import RichTextInput from './common/RichTextInput';
import { PlusIcon, TrashIcon, GripVerticalIcon, QuestionMarkCircleIcon } from './common/Icons';
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
    AiInterpretation: 'Opis zindywidualizowany (AI / Klucz)',
};

const availableComponentTypes: ReportComponent['type'][] = [
    'Header',
    'TestDescription',
    'ScoresTable',
    'BarChart',
    'RadarChart',
    'Interpretations',
    'AnswersList',
    'AiInterpretation',
    'RichText',
];

const InfoTooltip = ({ text }: { text: string }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block ml-2 align-middle">
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); setIsVisible(!isVisible); }}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-text-muted hover:text-primary transition-colors focus:outline-none"
                tabIndex={-1}
            >
                <QuestionMarkCircleIcon className="w-5 h-5" />
            </button>
            {isVisible && (
                <div className="absolute z-50 w-64 p-3 bg-surface border border-border text-text text-xs rounded-lg shadow-xl left-6 bottom-0 mb-2 font-normal leading-relaxed">
                    {text}
                </div>
            )}
        </div>
    );
};

interface TemplateEditorProps {
    templateId?: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ templateId }) => {
    const router = useRouter();

    const [template, setTemplate] = useState<Partial<PdfTemplate>>({});
    const [allTests, setAllTests] = useState<Test[]>([]);
    const [selectedTestScales, setSelectedTestScales] = useState<Scale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const tests = await fetchTests();
                setAllTests(tests);

                if (templateId) {
                    const fetchedTemplate = await fetchPdfTemplateById(templateId);
                    setTemplate(fetchedTemplate || {});
                    if (fetchedTemplate?.testCanonicalId) {
                        const associatedTest = tests.find(t => t.canonicalId === fetchedTemplate.testCanonicalId);
                        if (associatedTest) setSelectedTestScales(associatedTest.scales);
                    }
                } else {
                    setTemplate({
                        id: `tpl-${Date.now()}`,
                        name: 'Nowy szablon',
                        components: [],
                        testCanonicalId: tests.length > 0 ? tests[0].canonicalId : undefined
                    });
                    if (tests.length > 0) {
                        setSelectedTestScales(tests[0].scales);
                    }
                }
            } catch (error) {
                console.error("Failed to load data", error);
                toast.error("Błąd ładowania danych.");
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [templateId]);

    const handleTestSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTestId = e.target.value;
        const selectedTest = allTests.find(t => t.canonicalId === newTestId);
        setTemplate(prev => ({ ...prev, testCanonicalId: newTestId, components: [] }));
        setSelectedTestScales(selectedTest ? selectedTest.scales : []);
    };

    const addComponent = (type: ReportComponent['type']) => {
        const newComponent: ReportComponent = {
            id: `comp-${Date.now()}`,
            type,
            title: '',
            options: {},
        };
        if (type === 'BarChart' || type === 'RadarChart' || type === 'ScoresTable' || type === 'Interpretations') {
            newComponent.options = { scaleIds: [] };
        }
        if (type === 'RichText') {
            newComponent.options = { content: '' };
        }
        setTemplate(prev => ({ ...prev, components: [...(prev.components || []), newComponent] }));
    };

    const removeComponent = (id: string) => {
        setTemplate(prev => ({ ...prev, components: prev.components?.filter(c => c.id !== id) }));
    };

    const updateComponent = (id: string, newConfig: Partial<ReportComponent>) => {
        setTemplate(prev => ({
            ...prev,
            components: prev.components?.map(c => c.id === id ? { ...c, ...newConfig } : c)
        }));
    };

    const updateComponentOptions = (id: string, newOptions: any) => {
        setTemplate(prev => ({
            ...prev,
            components: prev.components?.map(c => c.id === id ? { ...c, options: { ...c.options, ...newOptions } } : c)
        }));
    };

    const handleSaveAndExit = useCallback(async () => {
        if (!template.name || !template.testCanonicalId || !template.components) {
            toast.warn("Nazwa szablonu i powiązany test są wymagane.");
            return;
        }
        setIsSaving(true);
        try {
            await savePdfTemplate(template as PdfTemplate);
            toast.success("Szablon zapisany pomyślnie.");
            router.push('/admin/templates');
        } catch (e) {
            console.error(e);
            toast.error("Błąd zapisu szablonu.");
        } finally {
            setIsSaving(false);
        }
    }, [template, router]);

    if (isLoading) return <div className="p-8 text-center text-text-muted">Ładowanie edytora...</div>;

    const renderComponentConfig = (comp: ReportComponent) => {
        switch (comp.type) {
            case 'BarChart':
            case 'RadarChart':
            case 'ScoresTable':
            case 'Interpretations':
                return (
                    <div className="mt-2 p-3 bg-surface/80 border border-border rounded-md">
                        <div className="flex items-center mb-2">
                            <label className="block text-sm font-medium text-text">Skale do uwzględnienia</label>
                            <InfoTooltip text="Wybierz, które skale mają być widoczne. Jeśli nie zaznaczysz żadnej, komponent uwzględni wszystkie skale." />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {selectedTestScales.map(scale => (
                                <label key={scale.id} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer hover:text-text">
                                    <input
                                        type="checkbox"
                                        checked={comp.options.scaleIds?.includes(scale.id) || false}
                                        onChange={(e) => {
                                            const currentIds = comp.options.scaleIds || [];
                                            const newIds = e.target.checked
                                                ? [...currentIds, scale.id]
                                                : currentIds.filter((id: string) => id !== scale.id);
                                            updateComponentOptions(comp.id, { scaleIds: newIds });
                                        }}
                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                    />
                                    {scale.name}
                                </label>
                            ))}
                        </div>
                        {selectedTestScales.length === 0 && <p className="text-xs text-error mt-1">Brak skal w wybranym teście.</p>}
                    </div>
                );
            case 'RichText':
                return (
                    <div className="mt-2">
                        <div className="flex flex-col mb-2">
                            <div className="flex items-center">
                                <label className="block text-sm font-medium text-text">Treść tekstowa</label>
                                <InfoTooltip text="Możesz używać sformatowanego tekstu oraz dynamicznych zmiennych wstawiających dane z testu." />
                            </div>
                            <div className="mt-1 p-2.5 bg-primary/15 border border-primary/30 rounded text-xs text-text">
                                <strong>Dostępne zmienne:</strong> <code>{`{{imie}}`}</code> (Identyfikator klienta), <code>{`{{data}}`}</code> (Data wypełnienia), <code>{`{{nazwa_testu}}`}</code><br />
                                <strong>Zmienne skal (użyj ID skali widocznego w edytorze):</strong> <code>{`{{wynik:ID}}`}</code> (Zdobyte punkty), <code>{`{{poziom:ID}}`}</code> (Słowny poziom, np. Wysoki)
                            </div>
                        </div>
                        <RichTextInput value={comp.options.content || ''} onChange={val => updateComponentOptions(comp.id, { content: val })} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto pb-20 text-text">
            <h1 className="text-3xl font-bold mb-6 text-text flex items-center">
                {templateId ? 'Edycja szablonu PDF' : 'Tworzenie szablonu PDF'}
                <InfoTooltip text="W tym miejscu definiujesz strukturę pliku PDF. Dodawaj komponenty, zmieniaj ich kolejność i konfiguruj treść." />
            </h1>

            <div className="space-y-6">
                <div className="bg-surface/90 border border-border p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-text border-b border-border pb-2">Ustawienia podstawowe</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-text mb-1 flex items-center">
                                Nazwa szablonu
                                <InfoTooltip text="Wewnętrzna nazwa szablonu, widoczna na liście wyboru. Np. 'Wariant rozszerzony'." />
                            </label>
                            <input
                                type="text"
                                placeholder="np. Raport standardowy"
                                value={template.name || ''}
                                onChange={(e) => setTemplate(p => ({ ...p, name: e.target.value }))}
                                className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text mb-1 flex items-center">
                                Powiązany test
                                <InfoTooltip text="Szablon musi być przypisany do konkretnego testu, aby mógł korzystać z jego skal i wyników." />
                            </label>
                            <div className="relative">
                                <select
                                    value={template.testCanonicalId || ''}
                                    onChange={handleTestSelectionChange}
                                    className="w-full p-2.5 border border-border rounded-lg bg-input-bg text-input-text focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none disabled:opacity-60"
                                    disabled={!!templateId}
                                >
                                    {allTests.map(test => (
                                        <option key={test.canonicalId} value={test.canonicalId}>{test.title}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            {templateId && <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                Testu nie można zmienić po utworzeniu szablonu.
                            </p>}
                        </div>
                    </div>
                </div>

                <div className="bg-surface/90 border border-border p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                        <h2 className="text-lg font-semibold text-text flex items-center">
                            Komponenty raportu
                            <InfoTooltip text="Raport PDF jest budowany z listy komponentów ułożonych jeden pod drugim." />
                        </h2>
                    </div>

                    <div className="space-y-4 min-h-[100px]">
                        {template.components?.map((component) => (
                            <div key={component.id} className="group relative p-4 border border-border rounded-lg bg-background/60 hover:bg-background/90 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-surface rounded shadow-sm border border-border cursor-grab active:cursor-grabbing text-text-muted hover:text-text">
                                            <GripVerticalIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text">{componentTypeNames[component.type]}</h3>
                                            <p className="text-xs text-text-muted font-mono">{component.type}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeComponent(component.id)}
                                        className="text-text-muted hover:text-error p-2 rounded-md hover:bg-error/15 transition-colors"
                                        title="Usuń element"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-4 pl-10 border-l-2 border-border ml-3.5">
                                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Tytuł sekcji (opcjonalny)</label>
                                    <input
                                        type="text"
                                        placeholder="Np. Analiza Osobowości"
                                        value={component.title || ''}
                                        onChange={(e) => updateComponent(component.id, { title: e.target.value })}
                                        className="w-full p-2 border border-border rounded-md bg-input-bg text-input-text text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                                    />
                                    {renderComponentConfig(component)}
                                </div>
                            </div>
                        ))}
                        {template.components?.length === 0 && (
                            <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-lg bg-background/40">
                                <div className="text-text-muted mb-2">
                                    <PlusIcon className="w-12 h-12 mx-auto" />
                                </div>
                                <p className="text-text font-medium">Szablon jest pusty</p>
                                <p className="text-sm text-text-muted mt-1">Użyj przycisku poniżej, aby dodać pierwszy element.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-center">
                        <div className="relative inline-block text-left group">
                            <button type="button" className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-contrast font-bold rounded-full shadow-lg hover:opacity-90 transition-all">
                                <PlusIcon className="w-5 h-5" />
                                Dodaj element do raportu
                            </button>
                            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-3 w-64 rounded-xl shadow-2xl bg-surface border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 overflow-hidden">
                                <div className="p-2 bg-background border-b border-border text-xs font-bold text-text-muted uppercase tracking-wider text-center">Wybierz typ elementu</div>
                                <div className="py-1">
                                    {availableComponentTypes.map(type => (
                                        <button key={type} onClick={(e) => { e.preventDefault(); addComponent(type); }} className="block w-full text-left px-4 py-2.5 text-sm text-text hover:bg-primary/15 hover:text-primary transition-colors border-b last:border-0 border-border/50">
                                            <span className="font-semibold block">{componentTypeNames[type]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pb-12">
                <button onClick={() => router.push('/admin/templates')} className="px-6 py-2 bg-surface border border-border text-text font-semibold rounded-lg hover:bg-background transition-colors">Anuluj</button>
                <button onClick={handleSaveAndExit} disabled={isSaving} className="px-6 py-3 bg-primary text-primary-contrast font-bold rounded-lg disabled:opacity-50 hover:opacity-90 transition-colors shadow-md flex items-center gap-2">
                    {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    {isSaving ? 'Zapisywanie...' : 'Zapisz i zakończ'}
                </button>
            </div>
        </div>
    );
};

export default TemplateEditor;
