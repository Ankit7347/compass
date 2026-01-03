"use client";
import { FileJson, Edit3, Trash2 } from 'lucide-react';

interface Props {
  data: any[];
  onEdit: (doc: any) => void;
  onDelete: (id: string) => void;
}

export default function DocumentTable({ data, onEdit, onDelete }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-700 rounded-lg">
        <p className="text-slate-500 text-sm">No documents found in this collection.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 font-medium">_id</th>
            <th className="px-4 py-3 font-medium">Data (JSON)</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950">
          {data.map((doc) => (
            <tr key={doc._id.toString()} className="hover:bg-slate-900/50 transition-colors">
              <td className="px-4 py-3 font-mono text-blue-400 text-xs">
                {doc._id.toString()}
              </td>
              <td className="px-4 py-3 truncate max-w-md font-mono text-xs">
                {JSON.stringify(doc, null, 0).substring(0, 100)}...
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onEdit(doc)} className="p-1.5 hover:bg-slate-800 rounded">
                    <Edit3 size={16} className="text-slate-400 hover:text-white" />
                  </button>
                  <button onClick={() => onDelete(doc._id)} className="p-1.5 hover:bg-slate-800 rounded">
                    <Trash2 size={16} className="text-red-400 hover:text-red-300" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}