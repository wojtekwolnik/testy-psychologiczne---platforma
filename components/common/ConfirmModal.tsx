import React from 'react';

interface ConfirmModalProps {
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ onSave, onDiscard, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-border rounded-xl shadow-2xl p-8 w-full max-w-md text-text">
                <h2 className="text-2xl font-bold mb-4">Niezapisane zmiany</h2>
                <p className="text-text-muted mb-6">Masz niezapisane zmiany. Czy chcesz je zapisać przed opuszczeniem strony?</p>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onCancel} className="px-4 py-2 bg-background border border-border text-text hover:bg-surface rounded-lg font-semibold transition-colors">Anuluj</button>
                    <button onClick={onDiscard} className="px-4 py-2 bg-error/15 border border-error/30 text-error hover:bg-error/25 rounded-lg font-semibold transition-colors">Opuść bez zapisu</button>
                    <button onClick={onSave} className="px-4 py-2 bg-primary text-primary-contrast hover:opacity-90 rounded-lg font-bold transition-opacity">Zapisz i opuść</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
