
import React, { useState, useEffect } from 'react';
import { UserProfile, StudySession } from '../types';
import { analyzeStudyMaterial, ocrImage } from '../services/gemini';
import { 
  saveStudySession, 
  getStudyHistory, 
  saveActiveSessionState, 
  getActiveSessionState, 
  clearUserVault,
  deleteStudySession
} from '../services/dbService';
import { extractTextFromPDF, fileToBase64, downloadSummaryPDF, downloadQuizPDF } from '../utils';

export const Dashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'vault'>('create');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [history, setHistory] = useState<StudySession[]>([]);
  
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [userChoices, setUserChoices] = useState<Record<number, number>>({});

  useEffect(() => {
    const restoredSession = getActiveSessionState(user.uid);
    if (restoredSession) {
      setSession(restoredSession);
      const savedProgress = localStorage.getItem(`exampro_progress_${user.uid}`);
      if (savedProgress) {
        try {
          const { sessionId, choices, revealed } = JSON.parse(savedProgress);
          if (sessionId === restoredSession.id) {
            setUserChoices(choices || {});
            setRevealedAnswers(revealed || {});
          }
        } catch (e) {}
      }
    }
    loadHistory();
  }, [user.uid]);

  useEffect(() => {
    if (session && session.id) {
      saveActiveSessionState(user.uid, session);
      localStorage.setItem(`exampro_progress_${user.uid}`, JSON.stringify({
        sessionId: session.id,
        choices: userChoices,
        revealed: revealedAnswers
      }));
    }
  }, [session, userChoices, revealedAnswers, user.uid]);

  const loadHistory = async () => {
    const data = await getStudyHistory(user.uid);
    setHistory(data);
  };

  const handleKeySelectionError = async () => {
    if (confirm("AI Core Identity Mismatch. Would you like to re-link your Project API Key?")) {
      await (window as any).aistudio?.openSelectKey();
      window.location.reload();
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm("Permanently delete this study record?")) {
      await deleteStudySession(user.uid, sessionId);
      if (session?.id === sessionId) setSession(null);
      loadHistory();
    }
  };

  const handleClearVault = () => {
    if (confirm("Terminate ALL local records? This cannot be undone.")) {
      clearUserVault(user.uid);
      setSession(null);
      setHistory([]);
      setUserChoices({});
      setRevealedAnswers({});
    }
  };

  const processText = async (text: string, title: string, type: 'text' | 'pdf' | 'image') => {
    setProcessing(true);
    setProcessStep('Connecting to Neural Core...');
    setError(null);
    try {
      const result = await analyzeStudyMaterial(text, questionCount);
      setProcessStep('Updating Study Vault...');
      const newSession: StudySession = {
        userId: user.uid,
        sourceType: type,
        title: title || text.substring(0, 35) + (text.length > 35 ? "..." : ""),
        summary: result.summary,
        keyPoints: result.keyPoints,
        insights: result.insights,
        questions: result.questions,
        createdAt: Date.now()
      };
      
      const id = await saveStudySession(newSession);
      setSession({ ...newSession, id });
      setRevealedAnswers({});
      setUserChoices({});
      loadHistory();
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("API Key") || msg.includes("entity was not found")) {
        setError("Neural connection rejected: Invalid or missing API Key.");
        handleKeySelectionError();
      } else {
        setError(msg || "Intelligence Core Timeout.");
      }
    } finally {
      setProcessing(false);
      setProcessStep('');
    }
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = textInput.trim();
    if (cleanText.length < 50) {
      setError("Notes too short for high-fidelity analysis (min 50 chars).");
      return;
    }
    await processText(cleanText, '', 'text');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setProcessStep('Initializing Extraction Protocol...');
    setError(null);
    try {
      let text = "";
      if (file.type === 'application/pdf') {
        setProcessStep('Scanning Document Layers...');
        text = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        setProcessStep('Performing OCR Deep Scan...');
        const base64 = await fileToBase64(file);
        text = await ocrImage(base64, file.type);
      } else {
        throw new Error("Unsupported format. Use PDF or Images.");
      }

      if (text.trim().length < 20) throw new Error("Extraction yielded insufficient data.");
      await processText(text, file.name, file.type === 'application/pdf' ? 'pdf' : 'image');
    } catch (err: any) {
      setError(err.message || "Neural extraction failed.");
      setProcessing(false);
    }
  };

  const handleOptionSelect = (questionIdx: number, optionIdx: number) => {
    if (revealedAnswers[questionIdx]) return;
    setUserChoices(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleCloseSession = () => {
    setSession(null);
    saveActiveSessionState(user.uid, null);
    localStorage.removeItem(`exampro_progress_${user.uid}`);
    setRevealedAnswers({});
    setUserChoices({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Command Center</h1>
          <p className="text-indigo-600 font-bold text-[10px] md:text-xs uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            Neural Dashboard Active
          </p>
        </div>
        
        <div className="flex liquid-glass p-1.5 md:p-2 ios-squircle shadow-xl self-start w-full md:w-auto">
          <button 
            onClick={() => { setSession(null); setActiveTab('create'); setError(null); }}
            className={`flex-1 md:flex-none px-6 md:px-8 py-2.5 md:py-3 rounded-[1.2rem] md:rounded-[1.5rem] font-black text-xs md:text-sm transition-all ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}`}
          >
            New Sync
          </button>
          <button 
            onClick={() => { setSession(null); setActiveTab('vault'); loadHistory(); setError(null); }}
            className={`flex-1 md:flex-none px-6 md:px-8 py-2.5 md:py-3 rounded-[1.2rem] md:rounded-[1.5rem] font-black text-xs md:text-sm transition-all ${activeTab === 'vault' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}`}
          >
            Study Vault
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 md:p-6 liquid-glass border-red-500/20 bg-red-500/5 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-between animate-in slide-in-from-top-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
            </div>
            <span className="text-red-600 font-black text-xs md:text-sm uppercase tracking-widest">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-full shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
      )}

      {activeTab === 'create' && !session && (
        <div className="grid lg:grid-cols-12 gap-8 md:gap-10">
          <div className="lg:col-span-8 liquid-glass p-6 md:p-12 ios-squircle shadow-2xl border-white/60">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-8 tracking-tight">Intelligence Input</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-10">
              <button 
                onClick={() => setInputMode('text')}
                className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all text-left ${inputMode === 'text' ? 'border-indigo-600 bg-white/60 shadow-2xl' : 'border-white/40 bg-white/20 hover:border-white/60'}`}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mb-6"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg></div>
                <h3 className="font-black text-slate-800 text-lg md:text-xl">Transcribe</h3>
                <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest">Manual Text Protocol</p>
              </button>
              <button 
                onClick={() => setInputMode('file')}
                className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all text-left ${inputMode === 'file' ? 'border-indigo-600 bg-white/60 shadow-2xl' : 'border-white/40 bg-white/20 hover:border-white/60'}`}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-6"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" /></svg></div>
                <h3 className="font-black text-slate-800 text-lg md:text-xl">Deep Scan</h3>
                <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest">Visual Document Protocol</p>
              </button>
            </div>

            <div className="mb-10 p-4 md:p-6 bg-slate-50/50 rounded-3xl border border-slate-200/50">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 px-2">Assessment Intensity</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
                {[10, 20, 30, 40, 50].map(count => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all ${questionCount === count ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300'}`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>

            {inputMode === 'text' ? (
              <form onSubmit={handleProcess} className="space-y-6 md:space-y-8">
                <textarea
                  className="w-full h-64 md:h-80 p-6 md:p-10 bg-white/50 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/60 focus:bg-white focus:ring-[12px] focus:ring-indigo-500/5 focus:border-indigo-500 outline-none resize-none transition-all text-slate-800 font-bold text-base md:text-lg leading-relaxed shadow-inner"
                  placeholder="Paste your study notes here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={processing}
                />
                <button
                  type="submit"
                  disabled={processing || textInput.length < 50}
                  className="w-full py-4 md:py-6 bg-indigo-600 text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-xl md:text-2xl shadow-2xl shadow-indigo-300 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
                >
                  {processing ? processStep : 'Analyze Neural Matrix'}
                </button>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="border-4 border-dashed border-white/60 bg-white/10 rounded-[2rem] md:rounded-[3rem] p-12 md:p-20 text-center hover:border-indigo-400 hover:bg-white/30 transition-all cursor-pointer relative group">
                  <input type="file" accept="application/pdf,image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={processing} />
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-[2rem] shadow-2xl border border-white/60 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-all">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-800">Uplink Source</h3>
                    <p className="text-slate-400 font-black mt-3 uppercase text-[10px] tracking-[0.2em]">PDF / JPEG / PNG</p>
                  </div>
                </div>
                {processing && (
                  <div className="flex flex-col items-center justify-center gap-4 p-8 md:p-12 liquid-glass ios-squircle animate-pulse">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-indigo-600 font-black tracking-[0.3em] uppercase text-[10px]">{processStep}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6 md:space-y-10">
             <div className="bg-slate-900 p-8 md:p-10 rounded-[2rem] md:ios-squircle shadow-2xl text-white relative overflow-hidden">
                <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 tracking-tight">Active Protocol</h3>
                <div className="space-y-8 md:space-y-10">
                   {[
                     { step: "01", text: "Select assessment intensity" },
                     { step: "02", text: "Upload document or paste notes" },
                     { step: "03", text: "AI distillates core knowledge" },
                     { step: "04", text: "Interactive CBT Matrix" }
                   ].map((s, i) => (
                     <div key={i} className="flex gap-4 md:gap-6 items-center">
                        <span className="text-indigo-500 font-black text-xs tracking-widest">{s.step}</span>
                        <p className="text-slate-400 font-bold text-xs md:text-sm">{s.text}</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {session && (
        <div className="space-y-12 md:space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <button onClick={handleCloseSession} className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center liquid-glass rounded-2xl md:rounded-3xl shadow-2xl hover:scale-110 transition-all text-slate-500 hover:text-indigo-600">
                 <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8"><path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
              </button>
              <div className="sm:text-right w-full">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter line-clamp-1">{session.title}</h2>
                <div className="flex sm:justify-end gap-3 mt-4">
                  <button onClick={() => downloadSummaryPDF(session)} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100">Export Summary</button>
                  <button onClick={() => downloadQuizPDF(session)} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100">Export Quiz</button>
                </div>
              </div>
           </div>

           <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
             <div className="lg:col-span-6 space-y-10 md:space-y-12">
                <section className="liquid-glass p-8 md:p-12 ios-squircle shadow-2xl">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-8 md:mb-10">Executive Summary</h3>
                   <p className="text-xl md:text-2xl text-slate-800 leading-relaxed font-black tracking-tight">{session.summary}</p>
                </section>

                <section className="liquid-glass p-8 md:p-12 ios-squircle shadow-2xl">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-10 md:mb-12">Neural Keypoints</h3>
                   <div className="grid gap-8 md:gap-10">
                     {session.keyPoints?.map((p, i) => (
                       <div key={i} className="flex gap-6 md:gap-10 items-start group">
                         <div className="mt-1.5 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 text-xs shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">{i + 1}</div>
                         <span className="text-xl md:text-2xl text-slate-700 font-bold leading-snug">{p}</span>
                       </div>
                     ))}
                   </div>
                </section>
             </div>

             <div className="lg:col-span-6 space-y-10 md:space-y-12">
                <section className="bg-slate-900 text-white p-8 md:p-12 ios-squircle shadow-2xl">
                   <div className="flex items-center justify-between mb-10 md:mb-12">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Logic Assessment</h3>
                   </div>
                   <div className="space-y-12">
                     {session.questions.map((q, idx) => {
                       const isRevealed = revealedAnswers[idx];
                       return (
                         <div key={idx} className="space-y-6">
                           <p className="text-xl md:text-2xl font-black leading-tight tracking-tight">{q.question}</p>
                           <div className="grid gap-3">
                             {q.options.map((opt, oIdx) => (
                               <button 
                                 key={oIdx} 
                                 disabled={isRevealed}
                                 onClick={() => handleOptionSelect(idx, oIdx)}
                                 className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-bold ${userChoices[idx] === oIdx ? (isRevealed ? (oIdx === q.correctIndex ? 'bg-emerald-500 border-emerald-500' : 'bg-red-500 border-red-500') : 'border-indigo-500 bg-indigo-500/10') : 'border-white/5 bg-white/5'}`}
                               >
                                 {opt}
                               </button>
                             ))}
                           </div>
                           {userChoices[idx] !== undefined && !isRevealed && (
                             <button onClick={() => setRevealedAnswers(p => ({...p, [idx]: true}))} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Validate</button>
                           )}
                           {isRevealed && <div className="p-4 bg-white/5 rounded-xl text-slate-400 italic text-sm">{q.explanation}</div>}
                         </div>
                       );
                     })}
                   </div>
                </section>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'vault' && !session && (
        <div className="space-y-8 md:space-y-12">
           <div className="flex items-center justify-between">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Study Vault</h2>
              <button onClick={handleClearVault} className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100">Clear Archive</button>
           </div>
           {history.length === 0 ? (
             <div className="liquid-glass p-20 text-center shadow-2xl ios-squircle">
                <p className="text-slate-400 font-black text-xl uppercase tracking-widest opacity-60">Archive records empty.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {history.map((item) => (
                 <div key={item.id} onClick={() => setSession(item)} className="liquid-glass p-8 ios-squircle shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group relative">
                    <button 
                      onClick={(e) => handleDeleteSession(e, item.id!)}
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                    <div className="flex justify-between mb-6">
                       <span className="text-indigo-600 text-[9px] font-black uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</span>
                       {item.id?.startsWith('local_') && <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-full uppercase">Local Cache</span>}
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 line-clamp-2 leading-tight tracking-tight mb-8">{item.title}</h3>
                    <div className="pt-6 border-t border-slate-200/50 flex justify-between items-center text-slate-400 text-[9px] font-black uppercase tracking-widest">
                       <span>{item.sourceType} • {item.questions?.length || 0} Qs</span>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};
