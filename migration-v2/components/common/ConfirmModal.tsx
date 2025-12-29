import React from 'react';

interface ConfirmModalProps {
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ onSave, onDiscard, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-[var(--secondary-color)] rounded-lg shadow-xl p-8 w-full max-w-md text-[var(--text-color)]">
                <h2 className="text-2xl font-bold mb-4">Niezapisane zmiany</h2>
                <p className="opacity-80 mb-6">Masz niezapisane zmiany. Czy chcesz je zapisać przed opuszczeniem strony?</p>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold">Anuluj</button>
                    <button onClick={onDiscard} className="px-4 py-2 bg-red-100 text-[var(--error-color)] rounded-lg font-semibold">Opuść bez zapisu</button>
                    <button onClick={onSave} className="px-4 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] rounded-lg font-bold">Zapisz i opuść</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
