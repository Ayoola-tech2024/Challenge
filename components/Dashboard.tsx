
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { sendEmailVerification, reload } from 'firebase/auth';
import { UserProfile, StudySession } from '../types';
import { analyzeStudyMaterial, ocrImage } from '../services/gemini';
import { saveStudySession, getStudyHistory } from '../services/dbService';
import { extractTextFromPDF, fileToBase64 } from '../utils';

export const Dashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'vault' | 'security'>('create');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [history, setHistory] = useState<StudySession[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  
  // Security specific states
  const [isVerified, setIsVerified] = useState(auth.currentUser?.emailVerified || false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  useEffect(() => {
    loadHistory();
    refreshVerification();
  }, [user.uid]);

  const loadHistory = async () => {
    const data = await getStudyHistory(user.uid);
    setHistory(data);
  };

  const refreshVerification = async () => {
    if (auth.currentUser) {
      try {
        await reload(auth.currentUser);
        setIsVerified(auth.currentUser.emailVerified);
      } catch (err) {
        console.error("Verification refresh failed", err);
      }
    }
  };

  const handleResendLink = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    setResendStatus('idle');
    try {
      await sendEmailVerification(auth.currentUser);
      setResendStatus('sent');
      setTimeout(() => setResendStatus('idle'), 5000);
    } catch (err) {
      setResendStatus('error');
    } finally {
      setResending(false);
    }
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = textInput.trim();
    if (cleanText.length < 50) {
      setError("Data Density Too Low: Provide more detailed notes for high-quality analysis.");
      return;
    }

    setProcessing(true);
    setProcessStep('Synchronizing with Intelligence Core...');
    setError(null);
    try {
      const result = await analyzeStudyMaterial(cleanText);
      setProcessStep('Storing results in Vault...');
      const newSession: StudySession = {
        userId: user.uid,
        sourceType: 'text',
        title: cleanText.substring(0, 35) + (cleanText.length > 35 ? "..." : ""),
        summary: result.summary,
        keyPoints: result.keyPoints,
        insights: result.insights,
        questions: result.questions,
        createdAt: Date.now()
      };
      const id = await saveStudySession(newSession);
      setSession({ ...newSession, id });
      setRevealedAnswers({});
    } catch (err: any) {
      console.error("Process Failure:", err);
      setError(err.message || "Intelligence Core Timeout. Please try again.");
    } finally {
      setProcessing(false);
      setProcessStep('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setProcessStep('Extracting data from file...');
    setError(null);
    try {
      let text = "";
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        text = await ocrImage(base64, file.type);
      } else {
        throw new Error("Invalid Format: Use PDF or Image files.");
      }

      const finalContent = text.trim();
      if (!finalContent || finalContent.length < 20) {
        throw new Error("Legibility Error: Not enough text extracted from document.");
      }

      setProcessStep('Distilling knowledge patterns...');
      const result = await analyzeStudyMaterial(finalContent);
      
      setProcessStep('Finalizing study report...');
      const newSession: StudySession = {
        userId: user.uid,
        sourceType: file.type === 'application/pdf' ? 'pdf' : 'image',
        title: file.name,
        summary: result.summary,
        keyPoints: result.keyPoints,
        insights: result.insights,
        questions: result.questions,
        createdAt: Date.now()
      };
      const id = await saveStudySession(newSession);
      setSession({ ...newSession, id });
      setRevealedAnswers({});
    } catch (err: any) {
      console.error("Deep Scan Error:", err);
      setError(err.message || "Neural extraction failed.");
    } finally {
      setProcessing(false);
      setProcessStep('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Command Center</h1>
          <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            Operational Intelligence System
          </p>
        </div>
        
        <div className="flex liquid-glass p-2 ios-squircle shadow-xl self-start md:self-center">
          <button 
            onClick={() => { setSession(null); setActiveTab('create'); setError(null); }}
            className={`px-8 py-3 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}`}
          >
            New Sync
          </button>
          <button 
            onClick={() => { setSession(null); setActiveTab('vault'); loadHistory(); setError(null); }}
            className={`px-8 py-3 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'vault' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}`}
          >
            Study Vault
          </button>
          <button 
            onClick={() => { setSession(null); setActiveTab('security'); refreshVerification(); setError(null); }}
            className={`px-8 py-3 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}`}
          >
            Security
          </button>
          <div className="w-px bg-slate-200/40 mx-2 self-stretch" />
          <button onClick={() => auth.signOut()} className="px-6 py-3 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-[1.5rem] transition-all">Terminate</button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-6 liquid-glass border-red-500/20 bg-red-500/5 rounded-[2rem] flex items-center justify-between animate-in slide-in-from-top-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
            </div>
            <span className="text-red-600 font-black text-sm uppercase tracking-widest">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-full transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
      )}

      {activeTab === 'create' && !session && (
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 liquid-glass p-12 ios-squircle shadow-2xl border-white/60">
            <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tight">Intelligence Input</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-12">
              <button 
                onClick={() => setInputMode('text')}
                className={`p-8 rounded-[2rem] border-2 transition-all text-left ${inputMode === 'text' ? 'border-indigo-600 bg-white/60 shadow-2xl' : 'border-white/40 bg-white/20 hover:border-white/60'}`}
              >
                <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mb-6"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg></div>
                <h3 className="font-black text-slate-800 text-xl">Transcribe</h3>
                <p className="text-xs text-slate-400 font-black mt-2 uppercase tracking-widest">Text Mode</p>
              </button>
              <button 
                onClick={() => setInputMode('file')}
                className={`p-8 rounded-[2rem] border-2 transition-all text-left ${inputMode === 'file' ? 'border-indigo-600 bg-white/60 shadow-2xl' : 'border-white/40 bg-white/20 hover:border-white/60'}`}
              >
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-6"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" /></svg></div>
                <h3 className="font-black text-slate-800 text-xl">Deep Scan</h3>
                <p className="text-xs text-slate-400 font-black mt-2 uppercase tracking-widest">Document Mode</p>
              </button>
            </div>

            {inputMode === 'text' ? (
              <form onSubmit={handleProcess} className="space-y-8">
                <textarea
                  className="w-full h-80 p-10 bg-white/50 rounded-[2.5rem] border border-white/60 focus:bg-white focus:ring-[12px] focus:ring-indigo-500/5 focus:border-indigo-500 outline-none resize-none transition-all text-slate-800 font-bold text-lg leading-relaxed shadow-inner"
                  placeholder="Paste your study materials or notes here (min 50 chars)..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={processing}
                />
                <button
                  type="submit"
                  disabled={processing || textInput.length < 50}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-indigo-300 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
                >
                  {processing ? processStep : 'Analyze Neural Matrix'}
                </button>
              </form>
            ) : (
              <div className="space-y-10">
                <div className="border-4 border-dashed border-white/60 bg-white/10 rounded-[3rem] p-24 text-center hover:border-indigo-400 hover:bg-white/30 transition-all cursor-pointer relative group">
                  <input type="file" accept="application/pdf,image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={processing} />
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl border border-white/60 flex items-center justify-center text-indigo-600 mb-8 group-hover:scale-110 transition-all">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">Uplink Source File</h3>
                    <p className="text-slate-400 font-black mt-4 uppercase text-xs tracking-[0.2em]">PDF / JPEG / PNG</p>
                  </div>
                </div>
                {processing && (
                  <div className="flex flex-col items-center justify-center gap-6 p-12 liquid-glass ios-squircle animate-pulse">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-indigo-600 font-black tracking-[0.4em] uppercase text-xs">{processStep}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-10">
             <div className="bg-slate-900 p-10 ios-squircle shadow-2xl text-white relative overflow-hidden">
                <h3 className="text-2xl font-black mb-8 tracking-tight">Active Protocol</h3>
                <div className="space-y-10">
                   {[
                     { step: "01", text: "Input study data or transcripts" },
                     { step: "02", text: "AI distillates core knowledge" },
                     { step: "03", text: "System generates practice logic" }
                   ].map((s, i) => (
                     <div key={i} className="flex gap-6 items-center">
                        <span className="text-indigo-500 font-black text-xs tracking-widest">{s.step}</span>
                        <p className="text-slate-400 font-bold text-sm">{s.text}</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {session && (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000">
           <div className="flex items-center justify-between">
              <button onClick={() => setSession(null)} className="w-16 h-16 flex items-center justify-center liquid-glass rounded-3xl shadow-2xl hover:scale-110 transition-all text-slate-500 hover:text-indigo-600">
                 <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8"><path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
              </button>
              <div className="text-right">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Sync Report</h2>
                <p className="text-indigo-600 font-black uppercase text-[10px] tracking-[0.6em] mt-3">Knowledge Verified</p>
              </div>
           </div>

           <div className="grid lg:grid-cols-12 gap-12">
             <div className="lg:col-span-7 space-y-12">
                <section className="liquid-glass p-12 ios-squircle shadow-2xl">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-10">Executive Summary</h3>
                   <p className="text-2xl text-slate-800 leading-relaxed font-black tracking-tight">{session.summary}</p>
                </section>

                <section className="liquid-glass p-12 ios-squircle shadow-2xl">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-12">Neural Keypoints</h3>
                   <div className="grid gap-10">
                     {session.keyPoints?.map((p, i) => (
                       <div key={i} className="flex gap-10 items-start group">
                         <div className="mt-1.5 w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 text-sm shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                           {i + 1}
                         </div>
                         <span className="text-2xl text-slate-700 font-bold leading-snug">{p}</span>
                       </div>
                     ))}
                   </div>
                </section>
             </div>

             <div className="lg:col-span-5 space-y-12">
                <section className="bg-slate-900 text-white p-12 ios-squircle shadow-2xl">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-12">Logic Assessment</h3>
                   <div className="space-y-16">
                     {session.questions.map((q, idx) => (
                       <div key={idx} className="space-y-8">
                         <p className="text-2xl font-black leading-tight tracking-tight">{idx + 1}. {q.question}</p>
                         <div className="grid gap-4">
                           {q.options.map((opt, oIdx) => (
                             <div 
                               key={oIdx} 
                               className={`p-6 rounded-[1.5rem] border-2 transition-all font-bold text-lg ${revealedAnswers[idx] ? (oIdx === q.correctIndex ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl' : 'border-white/5 opacity-30') : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                             >
                               {opt}
                             </div>
                           ))}
                         </div>
                         <div className="flex items-center justify-between pt-4">
                            <button 
                              onClick={() => setRevealedAnswers(p => ({...p, [idx]: !p[idx]}))}
                              className="px-6 py-3 liquid-glass bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-all"
                            >
                              {revealedAnswers[idx] ? 'Close Explainer' : 'Verify Correct Answer'}
                            </button>
                         </div>
                         {revealedAnswers[idx] && (
                           <div className="p-8 bg-indigo-600/10 rounded-[2rem] border border-indigo-500/20 text-slate-400 font-bold leading-relaxed italic animate-in slide-in-from-top-4">
                             {q.explanation}
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                </section>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'vault' && !session && (
        <div className="space-y-12">
           <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Study Vault</h2>
           {history.length === 0 ? (
             <div className="liquid-glass p-32 ios-squircle text-center shadow-2xl">
                <p className="text-slate-400 font-black text-2xl uppercase tracking-widest opacity-60">Archive records empty.</p>
             </div>
           ) : (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
               {history.map((item) => (
                 <div key={item.id} onClick={() => setSession(item)} className="liquid-glass p-10 ios-squircle shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer group">
                    <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.4em] mb-8 block">{new Date(item.createdAt).toLocaleDateString()}</span>
                    <h3 className="text-3xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight tracking-tight">{item.title}</h3>
                    <div className="mt-12 pt-10 border-t border-slate-200/50 flex justify-between items-center text-slate-400 font-black text-[10px] uppercase tracking-widest">
                       <span>{item.sourceType.toUpperCase()} Record</span>
                       <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="max-w-3xl mx-auto space-y-12">
           <h2 className="text-5xl font-black text-slate-900 tracking-tighter text-center">Security Hub</h2>
           
           <div className="liquid-glass p-12 ios-squircle shadow-2xl text-center space-y-10">
              <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner animate-float ${isVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {isVerified ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-16 h-16"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-16 h-16"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                )}
              </div>

              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{isVerified ? 'Identity Verified' : 'Identity Verification Pending'}</h3>
                <p className="text-slate-500 font-bold mt-4">Account: <span className="text-indigo-600">{user.email}</span></p>
              </div>

              <div className="grid gap-4 pt-6">
                {!isVerified && (
                  <button onClick={handleResendLink} disabled={resending || resendStatus === 'sent'} className="w-full py-5 bg-indigo-600 text-white font-black text-xl rounded-[2rem] hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-2xl shadow-indigo-100">
                    {resending ? 'Syncing...' : resendStatus === 'sent' ? 'Link Dispatched ✓' : 'Resend Identity Link'}
                  </button>
                )}
                <button onClick={refreshVerification} className="w-full py-5 liquid-glass bg-white/40 text-slate-800 font-black text-xl rounded-[2rem] hover:bg-white/60 transition-all shadow-xl">Neural Sync (Refresh Status)</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
