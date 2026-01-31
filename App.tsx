
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, reload } from 'firebase/auth';
import { auth } from './firebase';
import { UserProfile } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';

type AppState = 'landing' | 'auth' | 'dashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>('landing');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // We no longer block on emailVerified. 
        // User is allowed into the dashboard immediately.
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        setAppState('dashboard');
      } else {
        setUser(null);
        if (appState === 'dashboard') {
          setAppState('landing');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [appState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 animate-float">
          <div className="w-20 h-20 border-8 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter">ExamPro AI</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.6em] mt-2">Initializing Secure OS</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="liquid-glass border-b-0 sticky top-4 mx-4 z-50 ios-squircle px-6 py-4 mt-4 transition-all hover:translate-y-1">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => setAppState('landing')}
            className="flex items-center gap-4 group"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.25c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">ExamPro <span className="text-indigo-600">AI</span></span>
          </button>

          <div className="flex items-center gap-8">
            {!user && appState !== 'dashboard' ? (
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setAppState('auth')}
                  className="hidden md:block text-slate-500 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                  Enter Portal
                </button>
                <button 
                  onClick={() => setAppState('auth')}
                  className="px-8 py-3 bg-indigo-600 text-white font-black text-sm rounded-[1.25rem] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                >
                  Join Elite
                </button>
              </div>
            ) : (
              user && (
                <div className="flex items-center gap-5">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-black text-slate-900 leading-none tracking-tight">{user.displayName || user.email?.split('@')[0]}</p>
                    <p className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1.5">Authorized Operative</p>
                  </div>
                  <div className="w-12 h-12 rounded-[1.25rem] liquid-glass border-white/80 flex items-center justify-center text-indigo-600 font-black shadow-inner">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {appState === 'landing' && <Landing onGetStarted={() => setAppState('auth')} />}
        {appState === 'auth' && <Auth onBack={() => setAppState('landing')} />}
        {appState === 'dashboard' && user && <Dashboard user={user} />}
      </main>

      <footer className="bg-slate-900 py-24 border-t-0 mt-auto relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-16 text-center md:text-left relative z-10">
          <div className="col-span-2">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.25c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <span className="text-3xl font-black text-white tracking-tighter">ExamPro AI</span>
            </div>
            <p className="text-slate-500 font-bold max-w-sm leading-relaxed mb-8 mx-auto md:mx-0">
              Redefining academic excellence through specialized AI neural networks and adaptive study matrices.
            </p>
            <div className="inline-block px-6 py-3 liquid-glass bg-white/5 border-white/10 ios-squircle text-indigo-400 font-black text-xs uppercase tracking-[0.4em]">
              Architected by DamiTechs
            </div>
          </div>
          <div>
            <h4 className="text-white font-black text-lg mb-10 tracking-[0.1em] uppercase">Intelligence</h4>
            <ul className="space-y-6 text-slate-500 font-bold">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Neural Summary</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">CBT Matrix</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">OCR Shield</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black text-lg mb-10 tracking-[0.1em] uppercase">Protocols</h4>
            <ul className="space-y-6 text-slate-500 font-bold">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Command Hub</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Layer</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Data Ethics</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-24 pt-10 border-t border-white/5 text-center">
          <p className="text-slate-600 text-xs font-black uppercase tracking-[0.3em]">
            © 2024 EXAMPRO AI • SYSTEM STATUS: OPTIMAL • POWERED BY DAMITECHS
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
