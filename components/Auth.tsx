
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signOut,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthProps {
  onBack?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Auth state change is handled in App.tsx
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError("Secure login failed. Please ensure popups are enabled for verification.");
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
      setError("For your security, passwords must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setError("Your identity hasn't been verified. Please check your email inbox.");
          await signOut(auth);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // CRITICAL: Explicitly send verification link
        await sendEmailVerification(userCredential.user);
        setVerificationSent(true);
        // Important: Log them out so they must verify before entering
        await signOut(auth);
      }
    } catch (err: any) {
      console.error("Auth System Error:", err.code);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError("This account already exists. Would you like to sign in instead?");
          break;
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          setError("Invalid security credentials. Please verify your email and password.");
          break;
        case 'auth/too-many-requests':
          setError("Too many attempts. Account locked temporarily for your protection.");
          break;
        default:
          setError("A secure connection could not be established. Please check your internet.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 animate-in fade-in slide-in-from-bottom-8">
        <div className="w-full max-w-md p-10 liquid-glass ios-squircle text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Verification Link Sent</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            We've dispatched a secure verification link to <span className="font-bold text-indigo-600">{email}</span>. Please verify your account to unlock ExamPro AI.
          </p>
          <button
            onClick={() => { setVerificationSent(false); setIsLogin(true); }}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl transition-all shadow-xl shadow-indigo-200"
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in slide-in-from-bottom-8">
      <div className="w-full max-w-md p-10 liquid-glass ios-squircle shadow-2xl relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-8 left-8 text-slate-400 hover:text-slate-800 transition-all p-2 rounded-2xl hover:bg-white/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
        )}
        
        <div className="text-center mb-10 pt-4">
          <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-slate-500 font-semibold text-sm">
            {isLogin ? 'Enter your credentials to continue' : 'Join the elite tier of scholars today'}
          </p>
        </div>
        
        {error && (
          <div className="p-4 mb-8 text-sm font-bold text-red-600 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in shake duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.401 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Global ID / Email</label>
            <input
              type="email"
              required
              className="w-full px-6 py-5 rounded-3xl bg-white/40 border border-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-bold placeholder-slate-400 shadow-inner"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Secret Code</label>
            <input
              type="password"
              required
              className="w-full px-6 py-5 rounded-3xl bg-white/40 border border-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-bold placeholder-slate-400 shadow-inner"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-[2rem] transition-all disabled:opacity-50 shadow-2xl shadow-indigo-300 active:scale-95"
          >
            {loading ? 'Authenticating...' : (isLogin ? 'Enter Portal' : 'Register Identity')}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/50"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="liquid-glass px-4 py-1 rounded-full text-slate-400 font-black tracking-widest">Or Link With</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-5 px-4 bg-white/80 border border-white/80 hover:bg-white text-slate-700 font-bold rounded-3xl transition-all shadow-lg hover:-translate-y-1 active:scale-95 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google Identity Sync
        </button>

        <div className="mt-10 text-center">
          <p className="text-slate-500 font-bold text-sm">
            {isLogin ? "No identity yet?" : "Existing operative?"}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-indigo-600 hover:text-indigo-800 underline underline-offset-8 decoration-2"
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
      <p className="mt-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Engineered by DamiTechs</p>
    </div>
  );
};
