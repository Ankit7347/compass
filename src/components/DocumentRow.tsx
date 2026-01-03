"use client";
import { useState } from 'react';
import { Edit3, Trash2, ChevronRight, ChevronDown, Code } from 'lucide-react';

export default function DocumentRow({ doc, onEdit, onDelete }: { doc: any, onEdit: any, onDelete: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'kv' | 'json'>('kv');

  return (
    <div className="border border-slate-800 bg-slate-900/30 rounded-md mb-2 overflow-hidden hover:border-slate-700 transition-colors">
      {/* Header / Summary Line */}
      <div className="flex items-center justify-between p-3 bg-slate-900/50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="text-blue-400 font-mono text-xs font-bold">ID: {doc._id.toString()}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode(viewMode === 'kv' ? 'json' : 'kv')} className="p-1 hover:bg-slate-700 rounded text-slate-400" title="Toggle View Mode">
            <Code size={14} />
          </button>
          <button onClick={() => onEdit(doc)} // Pass the full 'doc' object
            className="p-1 hover:bg-blue-900/40 rounded text-blue-400">
            <Edit3 size={14} />
            </button>
          <button onClick={() => onDelete(doc._id)} className="p-1 hover:bg-red-900/40 rounded text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content Body */}
      {isExpanded && (
        <div className="p-4 bg-black/20 font-mono text-xs">
          {viewMode === 'json' ? (
            <pre className="text-green-400 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(doc, null, 2)}
            </pre>
          ) : (
            <div className="space-y-1">
              {Object.entries(doc).map(([key, value]) => (
                <div key={key} className="flex gap-4 border-b border-slate-800/50 py-1">
                  <span className="text-slate-500 min-w-[120px]">{key}:</span>
                  <span className="text-slate-200">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}