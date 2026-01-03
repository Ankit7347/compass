"use client";
import { useEffect, useState } from 'react';
import { Database, Table, ChevronDown, ChevronRight, Plus } from 'lucide-react';

export default function Sidebar({ onSelectCollection }: { onSelectCollection: (db: string, coll: string) => void }) {
  const [dbs, setDbs] = useState<any[]>([]);
  const [expandedDb, setExpandedDb] = useState<string | null>(null);
  const [collections, setCollections] = useState<any[]>([]);

  const fetchDbs = () => fetch('/api/databases').then(res => res.json()).then(setDbs);

  useEffect(() => { fetchDbs(); }, []);

  const handleCreateDb = async () => {
    const name = prompt("Enter new Database name:");
    if (!name) return;
    const coll = prompt("Enter initial Collection name:");
    if (!coll) return;

    await fetch('/api/management/create', {
      method: 'POST',
      body: JSON.stringify({ db: name, collection: coll })
    });
    fetchDbs();
  };

  const handleCreateCollection = async (e: React.MouseEvent, dbName: string) => {
    e.stopPropagation(); // Prevent toggling the accordion
    const name = prompt(`Add new collection to ${dbName}:`);
    if (!name) return;

    await fetch('/api/management/create', {
      method: 'POST',
      body: JSON.stringify({ db: dbName, collection: name })
    });
    // Refresh collections for the current DB
    toggleDb(dbName);
  };

  const toggleDb = async (dbName: string) => {
    if (expandedDb === dbName && collections.length > 0) {
      setExpandedDb(null);
      return;
    }
    setExpandedDb(dbName);
    const res = await fetch(`/api/collections?db=${dbName}`);
    const data = await res.json();
    setCollections(data);
  };

  return (
    <div className="w-72 h-screen bg-slate-900 text-slate-300 p-4 border-r border-slate-800 flex flex-col">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database size={20} className="text-blue-500" /> Databases
        </h2>
        <button 
          onClick={handleCreateDb}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          title="Create Database"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {dbs.map(db => (
          <div key={db.name} className="group">
            <div 
              onClick={() => toggleDb(db.name)}
              className="flex items-center justify-between p-2 hover:bg-slate-800 rounded cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedDb === db.name ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-sm font-semibold">{db.name}</span>
              </div>
              <button 
                onClick={(e) => handleCreateCollection(e, db.name)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-blue-400 transition-all"
                title="Create Collection"
              >
                <Plus size={14} />
              </button>
            </div>
            
            {expandedDb === db.name && (
              <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2">
                {collections.map(coll => (
                  <div 
                    key={coll.name}
                    onClick={() => onSelectCollection(db.name, coll.name)}
                    className="flex items-center gap-2 p-1.5 hover:text-white hover:bg-slate-800 rounded text-xs cursor-pointer"
                  >
                    <Table size={12} className="text-slate-500" />
                    {coll.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}