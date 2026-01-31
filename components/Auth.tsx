
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError("Secure login failed. Please check browser permissions.");
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
      setError("Security protocol requires a minimum of 8 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Auth Failure:", err.code);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError("This identity already exists in our neural network.");
          break;
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          setError("Credential mismatch: The password provided is incorrect for this account.");
          break;
        case 'auth/user-not-found':
          setError("Account not detected. Please verify your email or create a new identity.");
          break;
        case 'auth/too-many-requests':
          setError("System locked due to excessive failed attempts. Please standby.");
          break;
        case 'auth/invalid-email':
          setError("Please provide a valid global identifier (email).");
          break;
        default:
          setError("Uplink failed. Please verify your data connection and Firebase configuration.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in slide-in-from-bottom-8">
      <div className="w-full max-w-md p-6 md:p-10 liquid-glass ios-squircle shadow-2xl relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 md:top-8 md:left-8 text-slate-400 hover:text-slate-800 transition-all p-2 rounded-2xl hover:bg-white/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
        )}
        
        <div className="text-center mb-10 pt-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tighter">
            {isLogin ? 'Sign In' : 'Create Identity'}
          </h2>
          <p className="text-slate-500 font-bold text-xs md:text-sm">
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Account Email</label>
            <input
              type="email"
              required
              className="w-full px-6 py-4 rounded-3xl bg-white/50 border border-white/60 focus:bg-white focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-bold shadow-inner"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Secret Code</label>
            <input
              type="password"
              required
              className="w-full px-6 py-4 rounded-3xl bg-white/50 border border-white/60 focus:bg-white focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-bold shadow-inner"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-[2rem] transition-all disabled:opacity-50 shadow-2xl shadow-indigo-300 active:scale-95"
          >
            {loading ? 'Initializing...' : (isLogin ? 'Authorize Entry' : 'Register Identity')}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/50"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase"><span className="liquid-glass px-4 py-1 rounded-full text-slate-400 font-black tracking-widest">Or Link With</span></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white/80 border border-white/80 hover:bg-white text-slate-700 font-bold rounded-3xl transition-all shadow-lg hover:-translate-y-1 active:scale-95 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google Identity
        </button>

        <div className="mt-10 text-center">
          <p className="text-slate-500 font-bold text-sm">
            {isLogin ? "No identity yet?" : "Existing operative?"}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-indigo-600 hover:text-indigo-800 underline underline-offset-8 decoration-2 font-black transition-all"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
