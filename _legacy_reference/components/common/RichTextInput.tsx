import React, { useRef } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, LinkIcon } from './Icons';

interface Tag {
    name: string;
    description: string;
}

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  availableTags?: Tag[];
}

const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, placeholder, availableTags }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  };

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus(); // Keep focus after button click
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
        onMouseDown={(e) => { e.preventDefault(); onClick(); }} // onMouseDown to not lose selection
        title={title}
        className="p-2 rounded-md hover:bg-slate-200"
      >
        {children}
      </button>
  );

  return (
    <div className="border-2 border-[var(--border-color)] rounded-lg focus-within:ring-2 focus-within:ring-[var(--primary-color)] focus-within:border-[var(--primary-color)]">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b-2 border-[var(--border-color)] bg-slate-50 rounded-t-lg">
        <FormatButton onClick={() => applyFormat('bold')} title="Pogrubienie"><BoldIcon/></FormatButton>
        <FormatButton onClick={() => applyFormat('italic')} title="Kursywa"><ItalicIcon/></FormatButton>
        <FormatButton onClick={() => applyFormat('underline')} title="Podkreślenie"><UnderlineIcon/></FormatButton>
        <FormatButton onClick={applyLink} title="Wstaw link"><LinkIcon/></FormatButton>
        
        {availableTags && availableTags.length > 0 && (
            <>
            <div className="h-6 w-px bg-slate-300 mx-2"></div>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Wstaw tag:</span>
                {availableTags.map(tag => (
                     <button
                        key={tag.name}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); insertTag(tag.name); }}
                        title={tag.description}
                        className="px-2 py-1 text-xs font-mono bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                    >
                        {`{${tag.name}}`}
                    </button>
                ))}
            </div>
            </>
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        placeholder={placeholder}
        className="w-full p-3 min-h-[80px] text-[var(--input-text-color)] bg-[var(--input-background-color)] rounded-b-lg prose max-w-none focus:outline-none"
        style={{ direction: 'ltr' }}
      />
    </div>
  );
};

export default RichTextInput;