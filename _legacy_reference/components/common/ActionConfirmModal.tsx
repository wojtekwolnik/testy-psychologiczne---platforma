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
    confirmButtonClass = 'bg-[var(--error-color)] text-white'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--secondary-color)] rounded-lg shadow-xl p-8 w-full max-w-md text-[var(--text-color)]">
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                <p className="opacity-80 mb-6">{message}</p>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold">{cancelText}</button>
                    <button onClick={onConfirm} className={`px-4 py-2 rounded-lg font-bold ${confirmButtonClass}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ActionConfirmModal;
