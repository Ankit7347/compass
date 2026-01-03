"use client";
import Editor from '@monaco-editor/react';
import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  initialData: any;
  onSave: (data: any) => void;
  onClose: () => void;
  title: string;
}

export default function EditorModal({ isOpen, initialData, onSave, onClose, title }: Props) {
  // 1. Initialize with empty string or initialData
  const [value, setValue] = useState("");

  // 2. IMPORTANT: Update the editor value whenever initialData changes
  useEffect(() => {
    if (initialData) {
      setValue(JSON.stringify(initialData, null, 2));
    } else {
      setValue("{}");
    }
  }, [initialData, isOpen]); // Re-run when modal opens or doc changes

  if (!isOpen) return null;

  const handleSaveInternal = () => {
    try {
      const parsed = JSON.parse(value);
      onSave(parsed);
    } catch (e) {
      alert("Invalid JSON format. Please check your syntax.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-lg overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>
        
        <div className="h-[500px] bg-[#1e1e1e]">
          <Editor
            theme="vs-dark"
            defaultLanguage="json"
            value={value}
            onChange={(v) => setValue(v || "")}
            options={{ 
              minimap: { enabled: false }, 
              fontSize: 13,
              formatOnPaste: true,
              automaticLayout: true
            }}
          />
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            CANCEL
          </button>
          <button 
            onClick={handleSaveInternal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded text-xs font-bold shadow-lg transition-all"
          >
            SAVE DOCUMENT
          </button>
        </div>
      </div>
    </div>
  );
}