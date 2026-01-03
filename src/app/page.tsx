"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import DocumentRow from "@/components/DocumentRow";
import EditorModal from "@/components/EditorModal";
import SchemaTable from "@/components/SchemaTable"; // Ensure this component is created
import { Search, ChevronLeft, ChevronRight, Database, RefreshCw, LayoutList, Microscope } from "lucide-react";

export default function Home() {
  // State for Data
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeInfo, setActiveInfo] = useState<{ db: string; coll: string } | null>(null);
  
  // State for Query & Pagination
  const [filter, setFilter] = useState("{}");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // State for UI Tabs & Modals
  const [activeTab, setActiveTab] = useState<'documents' | 'schema'>('documents');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  // Fetch Documents Logic
  const fetchDocs = useCallback(async (db?: string, coll?: string, pageNum = 1) => {
    const targetDb = db || activeInfo?.db;
    const targetColl = coll || activeInfo?.coll;

    if (!targetDb || !targetColl) return;

    setLoading(true);
    try {
      let queryPath = "{}";
      try {
        queryPath = encodeURIComponent(filter || "{}");
      } catch (e) {
        queryPath = "{}";
      }

      const res = await fetch(
        `/api/documents?db=${targetDb}&collection=${targetColl}&filter=${queryPath}&page=${pageNum}&limit=20`
      );
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setDocuments(data.docs || []);
      setTotal(data.total || 0);
      setPage(pageNum);
      setActiveInfo({ db: targetDb, coll: targetColl });
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Query Error: Please ensure your filter is valid JSON (e.g. {\"key\": \"value\"})");
    } finally {
      setLoading(false);
    }
  }, [activeInfo, filter]);

  // Handle Save (Create/Update)
  const handleSave = async (data: any) => {
    if (!activeInfo) return;
    
    try {
      const isUpdate = !!data._id;
      const res = await fetch('/api/documents', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db: activeInfo.db,
          collection: activeInfo.coll,
          doc: data
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchDocs();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      alert("Failed to save document.");
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!activeInfo || !confirm("Delete this document forever?")) return;

    const res = await fetch(
      `/api/documents?db=${activeInfo.db}&collection=${activeInfo.coll}&id=${id}`,
      { method: 'DELETE' }
    );

    if (res.ok) fetchDocs();
  };

  return (
    <main className="flex h-screen bg-black text-slate-200 overflow-hidden">
      {/* 1. Left Sidebar */}
      <Sidebar onSelectCollection={(db, coll) => {
        setActiveTab('documents'); // Reset to documents view on collection change
        fetchDocs(db, coll, 1);
      }} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-14 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/20">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-blue-500" />
            <span className="text-sm font-medium tracking-tight">
              {activeInfo ? (
                <>
                  <span className="text-slate-500">{activeInfo.db}</span>
                  <span className="mx-2 text-slate-700">/</span>
                  <span className="text-slate-200 font-bold">{activeInfo.coll}</span>
                </>
              ) : "No collection selected"}
            </span>
          </div>
          <button 
            disabled={!activeInfo}
            onClick={() => { setEditingDoc({}); setIsModalOpen(true); }}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-bold transition-all shadow-lg"
          >
            + INSERT DOCUMENT
          </button>
        </header>

        {/* Query Bar (Only visible in Documents Tab) */}
        {activeTab === 'documents' && (
          <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex gap-2">
            <div className="flex-1 flex bg-slate-950 border border-slate-700 rounded items-center px-3 focus-within:border-blue-500 transition-colors shadow-inner">
              <Search size={14} className="text-slate-500 mr-2" />
              <span className="text-[10px] font-bold text-blue-500 mr-2 uppercase">Filter</span>
              <input 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDocs(undefined, undefined, 1)}
                placeholder='{ "key": "value" }'
                className="bg-transparent border-none outline-none text-xs font-mono w-full py-2 text-slate-300 placeholder:text-slate-700"
              />
            </div>
            <button 
              onClick={() => fetchDocs(undefined, undefined, 1)}
              className="bg-blue-600 hover:bg-blue-500 px-6 rounded text-xs font-bold transition-colors flex items-center gap-2 shadow-md"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : "APPLY"}
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/10 border-b border-slate-800 px-6">
          <button 
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-3 text-[11px] font-bold tracking-wider transition-all border-b-2 ${
              activeTab === 'documents' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutList size={14} /> DOCUMENTS
          </button>
          <button 
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-4 py-3 text-[11px] font-bold tracking-wider transition-all border-b-2 ${
              activeTab === 'schema' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Microscope size={14} /> SCHEMA
          </button>
        </div>

        {/* Content Section */}
        <section className="flex-1 overflow-y-auto p-4 bg-slate-950 custom-scrollbar">
          {loading && documents.length === 0 ? (
            <div className="flex flex-col justify-center items-center mt-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <p className="text-xs text-slate-500 font-mono">Fetching data...</p>
            </div>
          ) : activeTab === 'documents' ? (
            <div className="max-w-6xl mx-auto space-y-2">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <DocumentRow 
                    key={doc._id.toString()} 
                    doc={doc} 
                    onEdit={(d) => { setEditingDoc(d); setIsModalOpen(true); }}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="text-center mt-20 text-slate-600 border border-dashed border-slate-800 py-12 rounded-lg">
                  <p className="text-sm italic">No documents found. Select a collection or refine your filter.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
            <SchemaTable 
              documents={documents} 
              db={activeInfo?.db} 
              coll={activeInfo?.coll}
              onSchemaChange={() => fetchDocs()} // Re-fetch data after change
            />
          </div>
          )}
        </section>

        {/* Footer / Pagination (Only visible in Documents Tab) */}
        {activeTab === 'documents' && (
          <footer className="h-12 border-t border-slate-800 bg-slate-900/20 px-6 flex items-center justify-between">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              Results: {documents.length > 0 ? (page - 1) * 20 + 1 : 0} - {Math.min(page * 20, total)} of {total}
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                disabled={page === 1 || loading}
                onClick={() => fetchDocs(undefined, undefined, page - 1)}
                className="p-1 hover:bg-slate-800 rounded disabled:opacity-20 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-[11px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                {page}
              </span>
              <button 
                disabled={page >= Math.ceil(total / 20) || loading}
                onClick={() => fetchDocs(undefined, undefined, page + 1)}
                className="p-1 hover:bg-slate-800 rounded disabled:opacity-20 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </footer>
        )}
      </div>

      {/* Edit/Insert Modal */}
      <EditorModal 
        isOpen={isModalOpen}
        title={editingDoc?._id ? "Edit Document" : "Insert New Document"}
        initialData={editingDoc}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </main>
  );
}