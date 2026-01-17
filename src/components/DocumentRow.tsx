"use client";
import { useState } from 'react';
import { Edit3, Trash2, ChevronRight, ChevronDown, Code } from 'lucide-react';

export default function DocumentRow({ doc, onEdit, onDelete }: { doc: any, onEdit: any, onDelete: any }) {
  // Set default to true for expanded view
  const [isExpanded, setIsExpanded] = useState(true); 
  const [viewMode, setViewMode] = useState<'kv' | 'json'>('kv');

  return (
    <div className="border border-slate-800 bg-slate-900/30 rounded-md mb-2 overflow-hidden hover:border-slate-700 transition-colors">
      {/* Header / Summary Line */}
      <div className="flex items-center justify-between p-3 bg-slate-900/50">
        <div 
          className="flex items-center gap-3 cursor-pointer flex-1" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="text-blue-400 font-mono text-xs font-bold">
            ID: {doc._id?.toString() || doc.id}
          </span>
          {/* Optional: Show a hint of the name if available */}
          {doc.name?.en && !isExpanded && (
            <span className="text-slate-400 text-xs ml-2 italic">({doc.name.en})</span>
          )}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode(viewMode === 'kv' ? 'json' : 'kv')} 
            className={`p-1 rounded transition-colors ${viewMode === 'json' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`} 
            title="Toggle View Mode"
          >
            <Code size={14} />
          </button>
          <button 
            onClick={() => onEdit(doc)}
            className="p-1 hover:bg-blue-900/40 rounded text-blue-400"
          >
            <Edit3 size={14} />
          </button>
          <button 
            onClick={() => onDelete(doc._id || doc.id)} 
            className="p-1 hover:bg-red-900/40 rounded text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content Body */}
      {isExpanded && (
        <div className="p-4 bg-black/20 font-mono text-xs border-t border-slate-800">
          {viewMode === 'json' ? (
            <pre className="text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(doc, null, 2)}
            </pre>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(doc).map(([key, value]) => (
                <div key={key} className="flex gap-4 border-b border-slate-800/30 py-1.5 hover:bg-slate-800/20 px-1">
                  <span className="text-slate-500 w-32 shrink-0 font-bold">{key}</span>
                  <span className="text-slate-200 break-all">
                    {typeof value === 'object' && value !== null 
                      ? <span className="text-orange-400/80">{JSON.stringify(value)}</span>
                      : String(value)
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}