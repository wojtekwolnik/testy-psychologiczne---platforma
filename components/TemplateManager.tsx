
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPdfTemplates, deletePdfTemplate } from '../services/apiClient';
import { type PdfTemplate } from './types';
import { PlusIcon, EditIcon, TrashIcon } from './common/Icons';
import ActionConfirmModal from './common/ActionConfirmModal';

const TemplateManager: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const fetchedTemplates = await fetchPdfTemplates();
      setTemplates(fetchedTemplates);
    } catch (err) {
      setError("Nie udało się załadować szablonów.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async (templateId: string) => {
    try {
        await deletePdfTemplate(templateId);
        setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch {
        setError("Nie udało się usunąć szablonu.");
    }
  };

  return (
    <>
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Zarządzanie szablonami raportów PDF</h1>
          <p className="opacity-80 mt-1">Twórz i edytuj szablony, aby dostosować wygląd generowanych raportów.</p>
        </div>
        <button
          onClick={() => navigate('/admin/template/new')} // Updated navigation
          className="flex items-center gap-2 px-5 py-3 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 transition-colors"
        >
          <PlusIcon />
          Utwórz szablon
        </button>
      </div>

      <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--background-color)] text-sm font-semibold opacity-70">
              <tr className="text-[var(--text-color)]">
                <th className="p-4">Nazwa szablonu</th>
                <th className="p-4">Elementy raportu</th>
                <th className="p-4">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (<tr><td colSpan={3} className="p-8 text-center">Ładowanie...</td></tr>) 
              : error ? (<tr><td colSpan={3} className="p-8 text-center text-[var(--error-color)]">{error}</td></tr>)
              : templates.map(template => (
                <tr key={template.id} className="border-b border-[var(--border-color)] hover:bg-[var(--background-color)]">
                  <td className="p-4 font-medium">{template.name}</td>
                  <td className="p-4 text-sm">
                    <ul className="list-disc list-inside space-y-1">
                        {template.includeHeader && <li>Nagłówek (logo, tytuł)</li>}
                        {template.includeClientInfo && <li>Dane klienta</li>}
                        {template.includeScoresTable && <li>Tabela wyników</li>}
                        {template.includeBarChart && <li>Wykres słupkowy</li>}
                        {template.includePieChart && <li>Wykres kołowy</li>}
                        {template.includeDetailedAnswers && <li>Szczegółowe odpowiedzi</li>}
                    </ul>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => navigate(`/admin/template/edit/${template.id}`)} className="p-2 opacity-70 hover:opacity-100"><EditIcon/></button> // Updated navigation
                    <button onClick={() => setTemplateToDelete(template.id)} className="p-2 text-[var(--error-color)] hover:opacity-80"><TrashIcon/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
       <button onClick={() => navigate('/admin/dashboard')} className="mt-8 px-5 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">
            &larr; Powrót do panelu
        </button>
    </div>

    <ActionConfirmModal 
      isOpen={!!templateToDelete}
      onCancel={() => setTemplateToDelete(null)}
      onConfirm={() => {
        if(templateToDelete) confirmDelete(templateToDelete);
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
