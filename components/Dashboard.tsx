
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { UserProfile, StudyContent, TestAttempt } from '../types';
import { summarizeAndAnalyze, generateCBT, ocrImage } from '../services/gemini';
import { saveTestAttempt, getUserHistory } from '../services/dbService';
import { extractTextFromPDF, fileToBase64, formatTime } from '../utils';
import { CBTPlayer } from './CBTPlayer';

export const Dashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'study' | 'history'>('study');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studyResult, setStudyResult] = useState<StudyContent | null>(null);
  const [history, setHistory] = useState<TestAttempt[]>([]);
  const [viewingResult, setViewingResult] = useState<TestAttempt | null>(null);
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [qCount, setQCount] = useState(20);

  useEffect(() => {
    loadHistory();
  }, [user.uid]);

  const loadHistory = async () => {
    const data = await getUserHistory(user.uid);
    setHistory(data);
  };

  const clearError = () => setError(null);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.length < 50) {
      setError("Please provide at least 50 characters of context for deep analysis.");
      return;
    }

    setProcessing(true);
    clearError();
    try {
      const result = await summarizeAndAnalyze(textInput);
      setStudyResult({
        text: textInput,
        sourceType: 'text',
        ...result
      });
    } catch (err) {
      setError("Neural analysis interrupted. Please check your data connection.");
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum uplink capacity (10MB).");
      return;
    }

    setProcessing(true);
    clearError();
    try {
      let extractedText = "";
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        extractedText = await ocrImage(base64, file.type);
      } else {
        setError("Unsupported data format. Please utilize PDF or standard Images.");
        setProcessing(false);
        return;
      }

      if (!extractedText.trim() || extractedText.length < 50) {
        throw new Error("Insufficient data detected. Please ensure the document is legible.");
      }

      const analysis = await summarizeAndAnalyze(extractedText);
      setStudyResult({
        text: extractedText,
        sourceType: file.type === 'application/pdf' ? 'pdf' : 'image',
        ...analysis
      });
    } catch (err: any) {
      setError(err.message || "Failed to synchronize with document data.");
    } finally {
      setProcessing(false);
    }
  };

  const startTest = async () => {
    if (!studyResult) return;
    setProcessing(true);
    clearError();
    try {
      const data = await generateCBT(studyResult.text, qCount);
      if (!data?.questions?.length) throw new Error("CBT generation system failure. Insufficient source data.");
      setTestQuestions(data.questions);
      setIsTakingTest(true);
    } catch (err: any) {
      setError(err.message || "Assessment engine timed out. Re-initializing...");
    } finally {
      setProcessing(false);
    }
  };

  const finishTest = async (partialAttempt: Partial<TestAttempt>) => {
    if (!studyResult) return;
    const fullAttempt: TestAttempt = {
      userId: user.uid,
      sourceType: studyResult.sourceType,
      originalContentSnippet: studyResult.text.substring(0, 500),
      summary: studyResult.summary || "",
      keyPoints: studyResult.keyPoints || [],
      ...(partialAttempt as any),
      createdAt: Date.now()
    };
    
    try {
      const id = await saveTestAttempt(fullAttempt);
      setIsTakingTest(false);
      loadHistory();
      setViewingResult({ ...fullAttempt, id });
    } catch (err) {
      setViewingResult({ ...fullAttempt, id: 'local-' + Date.now() });
      setIsTakingTest(false);
    }
  };

  if (isTakingTest) {
    return (
      <div className="min-h-screen pt-12 animate-in zoom-in-95 duration-500">
        <CBTPlayer questions={testQuestions} timeLimit={qCount} onFinish={finishTest} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Command Center</h1>
          <p className="text-slate-500 font-bold text-sm mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Intelligence Active • User: {user.email?.split('@')[0]}
          </p>
        </div>
        <div className="flex liquid-glass p-2 ios-squircle shadow-xl self-start md:self-center">
          <button 
            onClick={() => { setStudyResult(null); setViewingResult(null); setActiveTab('study'); clearError(); }}
            className={`px-8 py-3 rounded-[1.5rem] font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'study' ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}`}
          >
            New Session
          </button>
          <button 
            onClick={() => { setStudyResult(null); setViewingResult(null); setActiveTab('history'); clearError(); }}
            className={`px-8 py-3 rounded-[1.5rem] font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}`}
          >
            Archive
          </button>
          <div className="w-px bg-slate-300/40 mx-2 self-stretch" />
          <button 
            onClick={() => auth.signOut()}
            className="px-8 py-3 text-red-500 font-black text-sm hover:bg-red-50/50 rounded-[1.5rem] transition-all"
          >
            Terminate
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-6 liquid-glass border-red-500/20 bg-red-50/50 rounded-[2rem] flex items-center justify-between gap-4 animate-in slide-in-from-top-8 duration-500">
          <div className="flex items-center gap-4 text-red-600 font-black">
            <div className="p-2 bg-red-100 rounded-xl">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
            </div>
            <span className="text-lg">{error}</span>
          </div>
          <button onClick={clearError} className="p-2 hover:bg-red-100 rounded-full transition-all text-red-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
      )}

      {activeTab === 'study' && !studyResult && !viewingResult && (
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 liquid-glass p-12 ios-squircle shadow-2xl animate-in fade-in duration-1000">
            <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tight">Intelligence Input</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-12">
              <button 
                onClick={() => setInputMode('text')}
                className={`p-8 rounded-[2rem] border-2 transition-all text-left ${inputMode === 'text' ? 'border-indigo-600 bg-white/60 shadow-xl scale-[1.02]' : 'border-white/40 bg-white/20 hover:border-white/60 hover:bg-white/30'}`}
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                </div>
                <h3 className="font-black text-slate-800 text-xl">Direct Transcription</h3>
                <p className="text-xs text-slate-400 font-black mt-2 uppercase tracking-widest">Type or Paste Material</p>
              </button>
              <button 
                onClick={() => setInputMode('file')}
                className={`p-8 rounded-[2rem] border-2 transition-all text-left ${inputMode === 'file' ? 'border-indigo-600 bg-white/60 shadow-xl scale-[1.02]' : 'border-white/40 bg-white/20 hover:border-white/60 hover:bg-white/30'}`}
              >
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 12 12m-12-12v15" /></svg>
                </div>
                <h3 className="font-black text-slate-800 text-xl">Deep Scanning</h3>
                <p className="text-xs text-slate-400 font-black mt-2 uppercase tracking-widest">PDF / JPG Sync</p>
              </button>
            </div>

            {inputMode === 'text' ? (
              <form onSubmit={handleProcess} className="space-y-8 animate-in slide-in-from-bottom-4">
                <textarea
                  className="w-full h-80 p-10 liquid-glass border-white/60 rounded-[2.5rem] focus:bg-white focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none transition-all text-slate-800 font-bold text-lg leading-relaxed shadow-inner"
                  placeholder="Insert your study material here. Deep learning requires at least 50 characters of context to generate accurate synthesis."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={processing}
                />
                <button
                  type="submit"
                  disabled={processing || textInput.length < 50}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-indigo-300 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
                >
                  {processing ? 'Synchronizing Neural Core...' : 'Initialize Analysis'}
                </button>
              </form>
            ) : (
              <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <div className="border-4 border-dashed border-white/60 bg-white/10 rounded-[3rem] p-24 text-center hover:border-indigo-400 hover:bg-white/30 transition-all cursor-pointer relative group">
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={processing}
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl border border-white/60 flex items-center justify-center text-indigo-600 mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">Select Source File</h3>
                    <p className="text-slate-400 font-black mt-4 uppercase text-xs tracking-[0.2em]">Automated Intelligence Extraction</p>
                  </div>
                </div>
                {processing && (
                  <div className="flex flex-col items-center justify-center gap-6 p-12 liquid-glass ios-squircle animate-pulse">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-indigo-600 font-black tracking-[0.4em] uppercase text-xs">Decrypting Knowledge...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="bg-slate-900 p-10 ios-squircle shadow-2xl relative overflow-hidden text-white">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[60px]" />
               <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-6 tracking-tight">System Status</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                       <span className="text-slate-400 font-bold">Neural Engine</span>
                       <span className="text-emerald-400 font-black uppercase text-xs">Online</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                       <span className="text-slate-400 font-bold">CBT Matrix</span>
                       <span className="text-indigo-400 font-black uppercase text-xs">Calibrated</span>
                    </div>
                  </div>
                  <p className="mt-10 text-slate-500 font-bold text-sm leading-relaxed">
                    Designed for iOS 26 High-Performance computing. Built by DamiTechs.
                  </p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Synthesis Result View */}
      {studyResult && !viewingResult && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => { setStudyResult(null); clearError(); }}
              className="w-16 h-16 flex items-center justify-center liquid-glass rounded-3xl shadow-xl hover:scale-110 active:scale-95 transition-all text-slate-500 hover:text-indigo-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8"><path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
            </button>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Knowledge Synthesis</h2>
              <p className="text-indigo-600 font-black uppercase text-[10px] tracking-[0.4em] mt-2">Source: {studyResult.sourceType} • AI Optimized</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-10">
              <section className="liquid-glass p-12 ios-squircle shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-8">Executive Briefing</h3>
                <p className="text-2xl text-slate-800 leading-relaxed font-black tracking-tight">{studyResult.summary}</p>
              </section>

              <section className="liquid-glass p-12 ios-squircle shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-10">Critical Logic Paths</h3>
                <div className="grid gap-8">
                  {studyResult.keyPoints?.map((p, i) => (
                    <div key={i} className="flex gap-8 items-start group">
                      <div className="mt-1.5 w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 text-sm shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {i + 1}
                      </div>
                      <span className="text-xl text-slate-700 font-bold leading-relaxed">{p}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-4 sticky top-28 h-fit">
              <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/20 blur-[60px]" />
                <h3 className="text-3xl font-black mb-6 tracking-tight">Initiate CBT</h3>
                <p className="text-slate-500 font-bold mb-12 leading-relaxed">Systematic randomized assessment generated from this neural sync.</p>
                
                <div className="space-y-8 mb-12">
                  <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Question Density</label>
                  <div className="flex gap-4">
                    {[20, 30, 40].map(count => (
                      <button
                        key={count}
                        onClick={() => setQCount(count)}
                        className={`flex-1 py-5 rounded-[1.5rem] font-black transition-all border-2 ${qCount === count ? 'border-indigo-500 bg-indigo-500 text-white shadow-2xl' : 'border-white/10 text-slate-500 hover:border-white/20'}`}
                      >
                        {count} Qs
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startTest}
                  disabled={processing}
                  className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-slate-100 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
                >
                  {processing ? 'Constructing...' : 'Launch Matrix'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive / History View */}
      {activeTab === 'history' && !viewingResult && (
        <div className="space-y-10 animate-in fade-in duration-1000">
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Secure Archive</h2>
            <div className="px-8 py-3 liquid-glass rounded-full font-black text-[10px] uppercase tracking-[0.4em] text-indigo-600">
              Synchronized
            </div>
          </div>
          {history.length === 0 ? (
            <div className="liquid-glass p-24 ios-squircle text-center shadow-xl">
              <div className="w-24 h-24 bg-slate-50/50 rounded-full flex items-center justify-center mx-auto mb-10 text-slate-200">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-12 h-12"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              <p className="text-slate-400 font-black text-2xl">Historical records empty.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {history.map((attempt) => (
                <div 
                  key={attempt.id} 
                  onClick={() => setViewingResult(attempt)}
                  className="liquid-glass p-10 ios-squircle shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${attempt.score / attempt.totalMarks >= 0.7 ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-amber-500 text-white shadow-amber-200'} shadow-lg`}>
                      {Math.round((attempt.score / attempt.totalMarks) * 100)}% Pass
                    </div>
                    <span className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">{new Date(attempt.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                    {attempt.sourceType.toUpperCase()} Record
                  </h3>
                  <div className="mt-10 pt-10 border-t border-slate-200/50 flex items-center justify-between">
                     <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em]">Analytics Report</span>
                     <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-all">
                       <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Review Report */}
      {viewingResult && (
        <div className="space-y-12 animate-in zoom-in-95 duration-700">
           <div className="flex items-center justify-between gap-8">
            <button 
              onClick={() => { setViewingResult(null); clearError(); }}
              className="flex items-center gap-4 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-[0.4em] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
              Archive Entry
            </button>
            <div className="px-6 py-2 liquid-glass rounded-full text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">Verified Evaluation</div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 bg-indigo-600 text-white p-16 rounded-[4rem] shadow-2xl flex flex-col items-center justify-center text-center">
              <div className="text-8xl font-black mb-4 tracking-tighter">{viewingResult.score}</div>
              <div className="text-indigo-200 font-black uppercase tracking-[0.4em] text-[10px] mb-12">Total Performance Marks</div>
              <div className="w-full bg-white/20 rounded-full h-4 mb-8">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-[2s] ease-out" 
                  style={{ width: `${(viewingResult.score / viewingResult.totalMarks) * 100}%` }}
                />
              </div>
              <p className="text-indigo-100 font-bold text-xl">
                Accuracy Level: <span className="font-black text-white">{Math.round((viewingResult.score / viewingResult.totalMarks) * 100)}%</span>
              </p>
            </div>

            <div className="lg:col-span-7 liquid-glass p-16 ios-squircle shadow-xl grid grid-cols-2 gap-12">
              <div>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] block mb-4">Total Time spent</span>
                <p className="text-4xl font-black text-slate-800">{formatTime(viewingResult.timeSpent)}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] block mb-4">System Core</span>
                <p className="text-4xl font-black text-indigo-600">CBT-v26</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] block mb-4">Question count</span>
                <p className="text-4xl font-black text-slate-800">{viewingResult.questionCount}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] block mb-4">Reliability</span>
                <p className="text-4xl font-black text-emerald-500">100%</p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Correction Matrix</h3>
            {viewingResult.questions.map((q, idx) => (
              <div key={idx} className="liquid-glass p-12 ios-squircle shadow-2xl group transition-all hover:scale-[1.01]">
                <div className="flex gap-10 items-start">
                  <span className="w-12 h-12 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center font-black shrink-0 text-sm shadow-xl">
                    {idx + 1}
                  </span>
                  <div className="space-y-10 flex-grow">
                    <h4 className="font-black text-slate-800 text-2xl leading-tight">{q.question}</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === q.correctIndex;
                        const isUserAnswer = oIdx === viewingResult.userAnswers[idx];
                        
                        return (
                          <div 
                            key={oIdx}
                            className={`p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all ${
                              isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-black shadow-lg shadow-emerald-100 scale-105' :
                              (isUserAnswer && !isCorrect) ? 'bg-red-50 border-red-500 text-red-900 font-black opacity-80 shadow-lg' : 'bg-white/40 border-white/60 text-slate-600'
                            }`}
                          >
                            <span className="text-lg">{opt}</span>
                            {isCorrect && <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white px-3 py-1 rounded-full">Marked Correct</span>}
                            {isUserAnswer && !isCorrect && <span className="text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-3 py-1 rounded-full">Your Pick</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-indigo-600/10 p-8 rounded-[2rem] border border-indigo-600/20 text-slate-800 font-bold text-lg italic leading-relaxed">
                      <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em] block mb-4">AI Feedback Loop:</span> 
                      {q.explanation}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
