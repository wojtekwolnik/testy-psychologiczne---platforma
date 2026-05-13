
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPdfTemplateById, savePdfTemplate, fetchTests } from '@/app/actions/testActions';
import { type PdfTemplate, type ReportComponent, type Test, type Scale } from './types';
import RichTextInput from './common/RichTextInput';
import { PlusIcon, TrashIcon, GripVerticalIcon, QuestionMarkCircleIcon } from './common/Icons';
import { toast } from 'react-toastify';

// Maps component types to human-readable names
const componentTypeNames: { [key: string]: string } = {
    Header: 'Nagłówek',
    ScoresTable: 'Tabela wyników',
    BarChart: 'Wykres słupkowy',
    RadarChart: 'Wykres radarowy',
    RichText: 'Blok tekstowy',
};

const availableComponentTypes: ReportComponent['type'][] = ['Header', 'ScoresTable', 'BarChart', 'RadarChart', 'RichText'];

// Tooltip helper
const InfoTooltip = ({ text }: { text: string }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block ml-2 align-middle">
            <button
                onClick={(e) => { e.preventDefault(); setIsVisible(!isVisible); }}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-slate-400 hover:text-[var(--primary-color)] transition-colors focus:outline-none"
                tabIndex={-1}
            >
                <QuestionMarkCircleIcon className="w-5 h-5" />
            </button>
            {isVisible && (
                <div className="absolute z-50 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl left-6 bottom-0 mb-2 font-normal leading-relaxed">
                    {text}
                    {/* Arrow */}
                    <div className="absolute -left-1 bottom-4 w-2 h-2 bg-slate-800 transform rotate-45"></div>
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
                    // If editing, load the scales for the already associated test
                    if (fetchedTemplate?.testCanonicalId) {
                        const associatedTest = tests.find(t => t.canonicalId === fetchedTemplate.testCanonicalId);
                        if (associatedTest) setSelectedTestScales(associatedTest.scales);
                    }
                } else {
                    // Sensible defaults for a new template
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
        setTemplate(prev => ({ ...prev, testCanonicalId: newTestId, components: [] })); // Reset components when test changes
        setSelectedTestScales(selectedTest ? selectedTest.scales : []);
    }

    const addComponent = (type: ReportComponent['type']) => {
        const newComponent: ReportComponent = {
            id: `comp-${Date.now()}`,
            type,
            title: '',
            options: {},
        };
        // Set default options for chart types
        if (type === 'BarChart' || type === 'RadarChart') {
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

    if (isLoading) return <div className="p-8 text-center">Ładowanie edytora...</div>;

    // Renders the configuration UI for a single component
    const renderComponentConfig = (comp: ReportComponent) => {
        switch (comp.type) {
            case 'BarChart':
            case 'RadarChart':
                return (
                    <div className='mt-2 p-3 bg-slate-100 rounded-md'>
                        <div className="flex items-center mb-2">
                            <label className='block text-sm font-medium text-slate-700'>Skale do wyświetlenia</label>
                            <InfoTooltip text="Wybierz, które skale mają być widoczne na wykresie. Jeśli nie zaznaczysz żadnej, wykres może być pusty." />
                        </div>
                        <div className='grid grid-cols-2 gap-2 mt-1'>
                            {selectedTestScales.map(scale => (
                                <label key={scale.id} className='flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900'>
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
                                        className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-4 w-4"
                                    />
                                    {scale.name}
                                </label>
                            ))}
                        </div>
                        {selectedTestScales.length === 0 && <p className="text-xs text-red-500 mt-1">Brak skal w wybranym teście.</p>}
                    </div>
                );
            case 'RichText':
                return (
                    <div className='mt-2'>
                        <div className="flex items-center mb-1">
                            <label className='block text-sm font-medium text-slate-700'>Treść tekstowa</label>
                            <InfoTooltip text="Możesz używać sformatowanego tekstu. Ten blok jest idealny do opisów, interpretacji statycznych lub uwag końcowych." />
                        </div>
                        <RichTextInput value={comp.options.content || ''} onChange={val => updateComponentOptions(comp.id, { content: val })} />
                    </div>
                )
            default:
                return null;
        }
    }

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto pb-20">
            <h1 className="text-3xl font-bold mb-6 text-slate-800 flex items-center">
                {templateId ? 'Edycja szablonu' : 'Tworzenie szablonu'}
                <InfoTooltip text="W tym miejscu definiujesz strukturę pliku PDF. Dodawaj komponenty, zmieniaj ich kolejność i konfiguruj treść." />
            </h1>

            {/* Main Form */}
            <div className="space-y-6">
                {/* Metadata Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold mb-4 text-slate-700 border-b pb-2">Ustawienia podstawowe</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center">
                                Nazwa szablonu
                                <InfoTooltip text="Wewnętrzna nazwa szablonu, widoczna tylko dla administratora. Np. 'Wariant rozszerzony'." />
                            </label>
                            <input
                                type="text" placeholder="np. Raport standardowy"
                                value={template.name || ''}
                                onChange={(e) => setTemplate(p => ({ ...p, name: e.target.value }))}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center">
                                Powiązany test
                                <InfoTooltip text="Szablon musi być przypisany do konkretnego testu, aby mógł korzystać z jego skal i wyników." />
                            </label>
                            <div className="relative">
                                <select
                                    value={template.testCanonicalId || ''}
                                    onChange={handleTestSelectionChange}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent transition-all appearance-none"
                                    disabled={!!templateId}
                                >
                                    {allTests.map(test => (
                                        <option key={test.canonicalId} value={test.canonicalId}>{test.title}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            {templateId && <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <span className="inline-block w-1 h-1 bg-amber-600 rounded-full"></span>
                                Testu nie można zmienić po utworzeniu szablonu.
                            </p>}
                        </div>
                    </div>
                </div>

                {/* Components Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-semibold text-slate-700 flex items-center">
                            Komponenty raportu
                            <InfoTooltip text="Raport PDF jest budowany z listy komponentów ułożonych jeden pod drugim. Możesz je przesuwać (chwyć za ikonę kropek) i konfigurować." />
                        </h2>
                    </div>

                    <div className='space-y-4 min-h-[100px]'>
                        {template.components?.map((component, index) => (
                            <div key={component.id} className='group relative p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white hover:shadow-md transition-all'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-3'>
                                        <div className='p-1.5 bg-white rounded shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600'>
                                            <GripVerticalIcon className='w-5 h-5' />
                                        </div>
                                        <div>
                                            <h3 className='font-bold text-slate-700'>{componentTypeNames[component.type]}</h3>
                                            <p className="text-xs text-slate-400 font-mono">{component.type}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeComponent(component.id)}
                                        className='text-slate-400 hover:text-[var(--error-color)] p-2 rounded-md hover:bg-red-50 transition-colors'
                                        title="Usuń element"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-4 pl-10 border-l-2 border-slate-200 ml-3.5">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tytuł sekcji (opcjonalny)</label>
                                    <input
                                        type="text" placeholder="Np. Analiza Osobowości"
                                        value={component.title || ''}
                                        onChange={(e) => updateComponent(component.id, { title: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {renderComponentConfig(component)}
                                </div>
                            </div>
                        ))}
                        {template.components?.length === 0 && (
                            <div className='text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50'>
                                <div className="text-slate-300 mb-2">
                                    <PlusIcon className="w-12 h-12 mx-auto" />
                                </div>
                                <p className="text-slate-500 font-medium">Szablon jest pusty</p>
                                <p className="text-sm text-slate-400 mt-1">Użyj przycisku poniżej, aby dodać pierwszy element.</p>
                            </div>
                        )}
                    </div>

                    {/* Add Component Dropdown */}
                    <div className="mt-8 flex justify-center">
                        <div className="relative inline-block text-left group">
                            <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-bold rounded-full shadow-lg hover:bg-slate-700 hover:-translate-y-0.5 transition-all">
                                <PlusIcon className="w-5 h-5" />
                                Dodaj element do raportu
                            </button>
                            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-3 w-64 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 overflow-hidden">
                                <div className="p-2 bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Wybierz typ elementu</div>
                                <div className="py-1">
                                    {availableComponentTypes.map(type => (
                                        <button key={type} onClick={(e) => { e.preventDefault(); addComponent(type); }} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b last:border-0 border-slate-50">
                                            <span className="font-semibold block">{componentTypeNames[type]}</span>
                                            {/* Optional description for each type in dropdown could go here */}
                                        </button>
                                    ))}
                                </div>
                                <div className="absolute -bottom-2 left-1/2 w-4 h-4 bg-white transform -translate-x-1/2 rotate-45 shadow-sm border-b border-r border-slate-200 z-10"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pb-12">
                <button onClick={() => router.push('/admin/templates')} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Anuluj</button>
                <button onClick={handleSaveAndExit} disabled={isSaving} className="px-6 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg disabled:opacity-50 hover:opacity-90 transition-colors shadow-md flex items-center gap-2">
                    {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    {isSaving ? 'Zapisywanie...' : 'Zapisz i zakończ'}
                </button>
            </div>
        </div>
    );
};

export default TemplateEditor;
