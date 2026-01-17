"use client";
import { useEffect, useState } from 'react';
import { Database, Table, ChevronDown, ChevronRight, Plus, Trash2, AlertTriangle, X } from 'lucide-react';

export default function Sidebar({ onSelectCollection }: { onSelectCollection: (db: string, coll: string) => void }) {
  const [dbs, setDbs] = useState<any[]>([]);
  const [expandedDb, setExpandedDb] = useState<string | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  
  // Modal States
  const [modal, setModal] = useState<{ 
    type: 'createDb' | 'createColl' | 'dropColl' | 'dropDb', 
    db: string, 
    coll?: string 
  } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [inputValue2, setInputValue2] = useState(""); 

  const fetchDbs = () => fetch('/api/databases').then(res => res.json()).then(setDbs);
  useEffect(() => { fetchDbs(); }, []);

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

  const handleAction = async () => {
    if (!modal) return;

    let url = '/api/management/create';
    let method = 'POST';
    let body: any = {};

    switch (modal.type) {
      case 'createDb':
        body = { db: inputValue, collection: inputValue2 };
        break;
      case 'createColl':
        body = { db: modal.db, collection: inputValue };
        break;
      case 'dropColl':
        url = '/api/management/drop-collection';
        method = 'DELETE';
        body = { db: modal.db, collection: modal.coll };
        break;
      case 'dropDb':
        url = '/api/management/drop-database';
        method = 'DELETE';
        body = { db: modal.db };
        break;
    }

    try {
      const response = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, // Added headers
        body: JSON.stringify(body) 
      });

      if (!response.ok) throw new Error("Action failed");

      // Clean up and Refresh
      setModal(null);
      setInputValue("");
      setInputValue2("");
      await fetchDbs();
      
      if (modal.type === 'dropDb' && expandedDb === modal.db) {
        setExpandedDb(null);
      } else if (expandedDb) {
        // Force refresh collection list if within current expanded DB
        const res = await fetch(`/api/collections?db=${expandedDb}`);
        const data = await res.json();
        setCollections(data);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check console.");
    }
  };

  return (
    <div className="w-72 h-screen bg-slate-900 text-slate-300 p-4 border-r border-slate-800 flex flex-col relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database size={20} className="text-blue-500" /> Databases
        </h2>
        <button 
          onClick={() => setModal({ type: 'createDb', db: '' })} 
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
          title="New Database"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Database Tree */}
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
        {dbs.map(db => (
          <div key={db.name} className="group">
            <div 
              onClick={() => toggleDb(db.name)} 
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${expandedDb === db.name ? 'bg-slate-800/50 text-blue-400' : 'hover:bg-slate-800/30'}`}
            >
              <div className="flex items-center gap-2">
                {expandedDb === db.name ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-sm font-semibold truncate max-w-[140px]">{db.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); setModal({ type: 'createColl', db: db.name }); }} 
                  className="p-1 hover:text-blue-400 hover:bg-slate-700 rounded"
                  title="New Collection"
                >
                  <Plus size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setModal({ type: 'dropDb', db: db.name }); }} 
                  className="p-1 hover:text-red-500 hover:bg-slate-700 rounded"
                  title="Drop Database"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            {expandedDb === db.name && (
              <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2 animate-in fade-in slide-in-from-left-2 duration-200">
                {collections.map(coll => (
                  <div key={coll.name} className="group/coll flex items-center justify-between p-1.5 hover:text-white hover:bg-slate-800 rounded-md text-xs cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 flex-1 truncate" onClick={() => onSelectCollection(db.name, coll.name)}>
                      <Table size={12} className="text-slate-500 group-hover/coll:text-blue-400" />
                      <span className="truncate">{coll.name}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setModal({ type: 'dropColl', db: db.name, coll: coll.name }); }}
                      className="opacity-0 group-hover/coll:opacity-100 p-0.5 text-slate-500 hover:text-red-500 hover:bg-slate-700 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${modal.type.startsWith('drop') ? 'text-red-500' : 'text-white'}`}>
                  {modal.type.startsWith('drop') ? <AlertTriangle size={20} /> : <Database size={20} className="text-blue-500" />}
                  {modal.type === 'createDb' && 'New Database'}
                  {modal.type === 'createColl' && 'New Collection'}
                  {modal.type === 'dropColl' && 'Drop Collection'}
                  {modal.type === 'dropDb' && 'Drop Database'}
                </h3>
                <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-full">
                    <X size={18} />
                </button>
              </div>
              
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                {modal.type === 'dropDb' && `DANGER: You are about to delete "${modal.db}". All collections and data will be permanently lost.`}
                {modal.type === 'dropColl' && `Are you sure you want to delete the collection "${modal.coll}"?`}
                {(modal.type === 'createDb' || modal.type === 'createColl') && `Create a new resource by filling the details below.`}
              </p>

              {modal.type.startsWith('create') && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-1 tracking-wider">Name</label>
                    <input 
                      autoFocus 
                      autoComplete="off"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                      value={inputValue} 
                      onChange={(e) => setInputValue(e.target.value)} 
                    />
                  </div>
                  {modal.type === 'createDb' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-500 ml-1 tracking-wider">Initial Collection</label>
                      <input 
                        autoComplete="off"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                        value={inputValue2} 
                        onChange={(e) => setInputValue2(e.target.value)} 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex bg-slate-800/30 p-4 gap-3">
              <button 
                onClick={() => setModal(null)} 
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAction} 
                className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all active:scale-95 shadow-lg
                ${modal.type.startsWith('drop') ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                {modal.type.startsWith('drop') ? 'Confirm Drop' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}