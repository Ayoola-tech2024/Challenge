
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, reload } from 'firebase/auth';
import { auth } from './firebase';
import { UserProfile } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';

type AppState = 'landing' | 'auth' | 'dashboard' | 'verification_pending';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>('landing');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.emailVerified) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          });
          setAppState('dashboard');
        } else {
          setAppState('verification_pending');
          setUser(null);
        }
      } else {
        setUser(null);
        if (appState === 'dashboard' || appState === 'verification_pending') {
          setAppState('landing');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [appState]);

  const checkVerification = async () => {
    if (auth.currentUser) {
      try {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          setUser({
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
          });
          setAppState('dashboard');
        } else {
          alert("Verification logic not confirmed. Please check your inbox and verify the secure link provided.");
        }
      } catch (err) {
        alert("Session verification expired. Please log in again.");
        setAppState('auth');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 animate-float">
          <div className="w-20 h-20 border-8 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter">ExamPro AI</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.6em] mt-2">Loading Core System</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="liquid-glass border-b-0 sticky top-4 mx-4 z-50 ios-squircle px-6 py-4 mt-4 transition-all hover:top-5">
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
            {!user ? (
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
              <div className="flex items-center gap-5">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-black text-slate-900 leading-none tracking-tight">{user.displayName || user.email?.split('@')[0]}</p>
                  <p className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1.5">Authorized Operative</p>
                </div>
                <div className="w-12 h-12 rounded-[1.25rem] liquid-glass border-white/80 flex items-center justify-center text-indigo-600 font-black shadow-inner">
                  {(user.email?.[0] || 'U').toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {appState === 'landing' && <Landing onGetStarted={() => setAppState('auth')} />}
        {appState === 'auth' && <Auth onBack={() => setAppState('landing')} />}
        {appState === 'dashboard' && user && <Dashboard user={user} />}
        {appState === 'verification_pending' && (
          <div className="flex items-center justify-center py-20 px-4">
            <div className="max-w-md w-full liquid-glass p-12 ios-squircle shadow-2xl text-center animate-in zoom-in-95">
              <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 animate-float">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-6 tracking-tighter">Security Verification</h2>
              <p className="text-slate-500 mb-12 font-bold leading-relaxed">
                Identity synchronization pending. Please check your inbox and verify the secure link dispatched by ExamPro AI.
              </p>
              <div className="space-y-6">
                <button
                  onClick={checkVerification}
                  className="w-full py-5 bg-indigo-600 text-white font-black text-xl rounded-[2rem] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100"
                >
                  I've Verified My Email
                </button>
                <button
                  onClick={() => signOut(auth)}
                  className="w-full py-5 liquid-glass bg-white/20 text-slate-600 font-black text-xl rounded-[2rem] hover:bg-white/40 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 py-24 border-t-0 mt-auto relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-16 text-center md:text-left relative z-10">
          <div className="col-span-2">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-7 h-7"><path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052