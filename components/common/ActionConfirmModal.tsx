import React from 'react';

interface ActionConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
}

const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({ 
    isOpen, 
    onConfirm, 
    onCancel, 
    title, 
    message, 
    confirmText = 'Potwierdź', 
    cancelText = 'Anuluj',
    confirmButtonClass = 'bg-error text-error-contrast hover:opacity-90'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-border rounded-xl shadow-2xl p-8 w-full max-w-md text-text">
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                <p className="text-text-muted mb-6">{message}</p>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onCancel} className="px-4 py-2 bg-background border border-border text-text hover:bg-surface rounded-lg font-semibold transition-colors">{cancelText}</button>
                    <button onClick={onConfirm} className={`px-4 py-2 rounded-lg font-bold transition-all ${confirmButtonClass}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ActionConfirmModal;
