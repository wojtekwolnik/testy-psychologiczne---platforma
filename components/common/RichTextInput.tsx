import React, { useRef } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, LinkIcon } from './Icons';
import DOMPurify from 'isomorphic-dompurify';

interface Tag {
    name: string;
    description: string;
}

interface RichTextInputProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    availableTags?: Tag[];
    rows?: number; // Kept for compatibility, though not used in div-mode
}

const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, label, placeholder, availableTags }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };

    const applyFormat = (command: string) => {
        document.execCommand(command, false);
        editorRef.current?.focus();
    };

    const applyLink = () => {
        const url = prompt("Wprowadź adres URL linku:", 'https://');
        if (url) {
            document.execCommand('createLink', false, url);
        }
        editorRef.current?.focus();
    };

    const insertTag = (tag: string) => {
        document.execCommand('insertText', false, `{${tag}}`);
        editorRef.current?.focus();
    };

    const FormatButton: React.FC<{ onClick: () => void; children: React.ReactNode, title: string }> = ({ onClick, children, title }) => (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
        >
            {children}
        </button>
    );

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

            <div className="border border-[var(--border-color)] rounded-lg bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[var(--primary-color)] focus-within:border-transparent transition-all">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--border-color)] bg-slate-50">
                    <FormatButton onClick={() => applyFormat('bold')} title="Pogrubienie"><BoldIcon className="w-4 h-4" /></FormatButton>
                    <FormatButton onClick={() => applyFormat('italic')} title="Kursywa"><ItalicIcon className="w-4 h-4" /></FormatButton>
                    <FormatButton onClick={() => applyFormat('underline')} title="Podkreślenie"><UnderlineIcon className="w-4 h-4" /></FormatButton>
                    <div className="h-4 w-px bg-slate-300 mx-1"></div>
                    <FormatButton onClick={applyLink} title="Wstaw link"><LinkIcon className="w-4 h-4" /></FormatButton>

                    {availableTags && availableTags.length > 0 && (
                        <>
                            <div className="h-6 w-px bg-slate-300 mx-2"></div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500">Tagi:</span>
                                {availableTags.map(tag => (
                                    <button
                                        key={tag.name}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); insertTag(tag.name); }}
                                        title={tag.description}
                                        className="px-2 py-0.5 text-xs font-mono bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-100 hover:text-blue-600 transition-colors"
                                    >
                                        {`{${tag.name}}`}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Editor Area */}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }}
                    data-placeholder={placeholder}
                    className="w-full p-4 min-h-[120px] max-h-[400px] overflow-y-auto text-[var(--input-text-color)] prose prose-sm max-w-none focus:outline-none bg-[var(--input-background-color)]"
                    style={{ minHeight: '120px' }}
                />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">Edytor tekstu bogatego (Legacy Mode)</p>
        </div>
    );
};

export default RichTextInput;
