"use client";
import { Plus, Edit2, Trash2, Hash, Type, Calendar, Braces, List, ShieldCheck } from 'lucide-react';

export default function SchemaTable({ documents, db, coll, onSchemaChange }: any) {
  
  // 1. ANALYSIS LOGIC: Define schemaMap before it is used below
  if (!documents || documents.length === 0) {
    return <div className="text-slate-500 text-sm p-8 text-center border border-dashed border-slate-800 rounded-lg">
      No data available to analyze schema. Insert a document first.
    </div>;
  }

  const schemaMap: Record<string, Set<string>> = {};
  
  documents.forEach((doc: any) => {
    Object.keys(doc).forEach(key => {
      const val = doc[key];
      let type = typeof val;
      
      if (val === null) type = 'null';
      else if (Array.isArray(val)) type = 'array';
      else if (val instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)) && val.includes('T'))) type = 'date';
      else if (key === '_id') type = 'ObjectId';

      if (!schemaMap[key]) schemaMap[key] = new Set();
      schemaMap[key].add(type);
    });
  });

  // 2. HELPER: Icons for types
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'number': return <Hash size={14} className="text-orange-400" />;
      case 'string': return <Type size={14} className="text-green-400" />;
      case 'date': return <Calendar size={14} className="text-pink-400" />;
      case 'object': return <Braces size={14} className="text-blue-400" />;
      case 'array': return <List size={14} className="text-yellow-400" />;
      default: return <ShieldCheck size={14} className="text-slate-400" />;
    }
  };

  // 3. ACTION LOGIC: Bulk updates
  const handleAction = async (action: string, fieldName?: string) => {
    let payload: any = { db, collection: coll, action };

    if (action === 'ADD_FIELD') {
      const name = prompt("Enter new field name:");
      const val = prompt("Enter default value (string):");
      if (!name) return;
      payload = { ...payload, fieldName: name, defaultValue: val };
    } else if (action === 'RENAME_FIELD') {
      const newName = prompt(`Rename "${fieldName}" to:`);
      if (!newName) return;
      payload = { ...payload, fieldName, newFieldName: newName };
    } else if (action === 'REMOVE_FIELD') {
      if (!confirm(`Delete field "${fieldName}" from ALL documents in this collection?`)) return;
      payload = { ...payload, fieldName };
    }

    try {
      const res = await fetch('/api/management/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Schema updated successfully!");
        onSchemaChange(); // This calls fetchDocs() in page.tsx
      }
    } catch (err) {
      alert("Failed to update schema.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Schema Analysis (Based on current results)</h3>
        <button 
          onClick={() => handleAction('ADD_FIELD')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-[10px] font-bold transition-all"
        >
          <Plus size={14} /> ADD FIELD TO ALL DOCUMENTS
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/20 overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
            <tr>
              <th className="px-6 py-3">Field Name</th>
              <th className="px-6 py-3">Types Detected</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {Object.entries(schemaMap).map(([field, types]) => (
              <tr key={field} className="hover:bg-slate-800/30 group transition-colors">
                <td className="px-6 py-4 text-slate-200 font-bold">{field}</td>
                <td className="px-6 py-4 flex gap-2 flex-wrap">
                  {Array.from(types).map((type: any) => (
                    <span key={type} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[9px] uppercase text-slate-300">
                      {getTypeIcon(type)}
                      {type}
                    </span>
                  ))}
                </td>
                <td className="px-6 py-4 text-right">
                  {field !== '_id' && (
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleAction('RENAME_FIELD', field)} 
                        className="p-1.5 hover:bg-blue-900/40 rounded text-blue-400 transition-colors"
                        title="Rename across all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleAction('REMOVE_FIELD', field)} 
                        className="p-1.5 hover:bg-red-900/40 rounded text-red-400 transition-colors"
                        title="Delete from all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}