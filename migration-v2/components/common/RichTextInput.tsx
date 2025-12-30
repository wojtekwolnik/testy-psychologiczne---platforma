
'use client';

import React from 'react';

interface RichTextInputProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    rows?: number;
}

const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, label, placeholder, rows = 5 }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full p-2 border border-[var(--border-color)] rounded-md bg-[var(--input-background-color)] text-[var(--input-text-color)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">Obsługuje podstawowy HTML.</p>
        </div>
    );
};

export default RichTextInput;
