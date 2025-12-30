
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPdfTemplateById, savePdfTemplate, fetchTests } from '@/app/actions/testActions';
import { type PdfTemplate, type ReportComponent, type Test, type Scale } from './types';
import RichTextInput from './common/RichTextInput';
import { PlusIcon, TrashIcon, GripVerticalIcon } from './common/Icons';
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
                        <label className='block text-sm font-medium text-slate-700'>Skale do wyświetlenia:</label>
                        <div className='grid grid-cols-2 gap-2 mt-1'>
                            {selectedTestScales.map(scale => (
                                <label key={scale.id} className='flex items-center gap-2 text-sm text-slate-600 cursor-pointer'>
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
                                        className="rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
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
                        <RichTextInput value={comp.options.content || ''} onChange={val => updateComponentOptions(comp.id, { content: val })} />
                    </div>
                )
            default:
                return <p className='text-xs text-slate-500 mt-1 italic'>Ten komponent nie wymaga dodatkowej konfiguracji.</p>;
        }
    }

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">{templateId ? 'Edytuj szablon raportu' : 'Utwórz nowy szablon'}</h1>

            {/* Main Form */}
            <div className="space-y-8">
                {/* Metadata Section */}
                <div className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-lg font-semibold mb-2">Nazwa szablonu</label>
                            <input
                                type="text" placeholder="np. Raport standardowy"
                                value={template.name || ''}
                                onChange={(e) => setTemplate(p => ({ ...p, name: e.target.value }))}
                                className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg bg-[var(--input-background-color)] text-[var(--input-text-color)]"
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-semibold mb-2">Powiązany test</label>
                            <select
                                value={template.testCanonicalId || ''}
                                onChange={handleTestSelectionChange}
                                className="w-full p-3 border-2 border-[var(--border-color)] rounded-lg bg-[var(--input-background-color)] text-[var(--input-text-color)]"
                                disabled={!!templateId} // Prevent changing the test for existing templates to avoid component mismatch
                            >
                                {allTests.map(test => (
                                    <option key={test.canonicalId} value={test.canonicalId}>{test.title}</option>
                                ))}
                            </select>
                            {templateId && <p className="text-xs text-slate-500 mt-1">Nie można zmienić testu dla istniejącego szablonu.</p>}
                        </div>
                    </div>
                </div>

                {/* Components Section */}
                <div className="bg-[var(--secondary-color)] p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Komponenty raportu</h2>
                    <div className='space-y-4'>
                        {template.components?.map((component, index) => (
                            <div key={component.id} className='p-4 border border-[var(--border-color)] rounded-lg bg-[var(--background-color)]'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <GripVerticalIcon className='cursor-grab text-slate-400' />
                                        <h3 className='text-lg font-semibold'>{componentTypeNames[component.type]}</h3>
                                    </div>
                                    <button onClick={() => removeComponent(component.id)} className='text-[var(--error-color)] p-1 rounded-md hover:bg-red-50 transition-colors'><TrashIcon /></button>
                                </div>
                                <input
                                    type="text" placeholder="Opcjonalny tytuł (np. Profil podstawowy)"
                                    value={component.title || ''}
                                    onChange={(e) => updateComponent(component.id, { title: e.target.value })}
                                    className="w-full p-2 mt-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-sm"
                                />
                                {renderComponentConfig(component)}
                            </div>
                        ))}
                        {template.components?.length === 0 && <p className='text-center text-slate-500 py-6'>Brak komponentów. Dodaj nowy element, aby rozpocząć.</p>}
                    </div>

                    {/* Add Component Dropdown */}
                    <div className="mt-6">
                        <div className="relative inline-block text-left group">
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                                <PlusIcon /> Dodaj element
                            </button>
                            <div className="absolute left-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <div className="py-1">
                                    {availableComponentTypes.map(type => (
                                        <button key={type} onClick={(e) => { e.preventDefault(); addComponent(type); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            {componentTypeNames[type]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pb-12">
                <button onClick={() => router.push('/admin/templates')} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Anuluj</button>
                <button onClick={handleSaveAndExit} disabled={isSaving} className="px-6 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg disabled:opacity-50 hover:opacity-90 transition-colors shadow-md">
                    {isSaving ? 'Zapisywanie...' : 'Zapisz i zakończ'}
                </button>
            </div>
        </div>
    );
};

export default TemplateEditor;
