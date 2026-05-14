'use client';

import React, { useContext, useState, useRef } from 'react';
import { BrandingContext } from '@/contexts/BrandingContext';
import { saveBrandingSettings } from '@/app/actions/brandingActions';
import { FaPalette, FaImage, FaAlignLeft, FaUpload, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function ReportSettings() {
    const { branding, setBranding } = useContext(BrandingContext);
    const [localSettings, setLocalSettings] = useState({
        reportLogoUrl: branding.reportLogoUrl || '',
        reportPrimaryColor: branding.reportPrimaryColor || branding.primaryColor || '#2563eb',
        reportFooterText: branding.reportFooterText || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = { ...branding, ...localSettings };
            await saveBrandingSettings(updated);
            setBranding(updated);
            toast.success('Ustawienia raportów zostały zapisane.');
        } catch (e) {
            console.error(e);
            toast.error('Wystąpił błąd podczas zapisywania.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Plik logo musi być mniejszy niż 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings(prev => ({ ...prev, reportLogoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setLocalSettings(prev => ({ ...prev, reportLogoUrl: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="border-b pb-4">
                <h1 className="text-3xl font-bold text-slate-800">Ustawienia Raportów PDF</h1>
                <p className="text-slate-500 mt-2">Dostosuj wygląd plików PDF generowanych przez platformę (logo, kolory, stopka).</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                
                {/* Logo */}
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><FaImage className="text-blue-500" /> Logo na raportach</h3>
                    <p className="text-sm text-slate-500 mb-4">Jeśli nie wgrasz osobnego logo dla raportów, system użyje domyślnego logo platformy.</p>
                    
                    <div className="flex items-center gap-6">
                        <div className="w-48 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-slate-50 relative overflow-hidden">
                            {localSettings.reportLogoUrl ? (
                                <img src={localSettings.reportLogoUrl} alt="Logo raportu" className="max-w-full max-h-full object-contain p-2" />
                            ) : (
                                <span className="text-slate-400 text-sm">Brak wybranego logo</span>
                            )}
                        </div>
                        <div className="space-y-3">
                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 font-medium transition-colors text-sm">
                                <FaUpload /> Wgraj logo
                            </button>
                            {localSettings.reportLogoUrl && (
                                <button onClick={removeLogo} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 font-medium transition-colors text-sm">
                                    <FaTrash /> Usuń logo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <hr />

                {/* Primary Color */}
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><FaPalette className="text-purple-500" /> Kolor wiodący</h3>
                    <p className="text-sm text-slate-500 mb-4">Ten kolor będzie używany jako akcent w nagłówkach i przy generowaniu wykresów w pliku PDF.</p>
                    
                    <div className="flex items-center gap-4">
                        <input 
                            type="color" 
                            value={localSettings.reportPrimaryColor} 
                            onChange={(e) => setLocalSettings(p => ({ ...p, reportPrimaryColor: e.target.value }))}
                            className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                        />
                        <input 
                            type="text" 
                            value={localSettings.reportPrimaryColor} 
                            onChange={(e) => setLocalSettings(p => ({ ...p, reportPrimaryColor: e.target.value }))}
                            className="p-2 border rounded-md font-mono text-sm uppercase w-28"
                        />
                    </div>
                </div>

                <hr />

                {/* Footer */}
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><FaAlignLeft className="text-green-500" /> Stopka strony</h3>
                    <p className="text-sm text-slate-500 mb-4">Tekst, który będzie drukowany na samym dole każdej strony raportu (np. nazwa placówki, adres). Paginacja (numer strony) dodawana jest automatycznie.</p>
                    
                    <textarea 
                        value={localSettings.reportFooterText}
                        onChange={(e) => setLocalSettings(p => ({ ...p, reportFooterText: e.target.value }))}
                        className="w-full p-3 border rounded-lg min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Platforma Testów Psychologicznych | www.twojastrona.pl"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? 'Zapisywanie...' : 'Zapisz Ustawienia Raportów'}
                </button>
            </div>
        </div>
    );
}
