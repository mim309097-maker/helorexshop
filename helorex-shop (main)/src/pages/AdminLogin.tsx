import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import { isAdminEmail } from '../constants';
import { LogIn, Lock, Mail, AlertCircle, Chrome, MailCheck } from 'lucide-react';
import { motion } from 'motion/react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Clear any existing session on mount to prevent "sticky" loading states
  useEffect(() => {
    signOut(auth).catch(() => {});
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMsg('');

    // STRICT ADMIN RESTRICTION
    if (!isAdminEmail(email)) {
      setIsLoading(false);
      setError('Unauthorized access! Only the designated store owners can access this portal.');
      return;
    }

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setMsg('Admin account verification email sent! Please check your inbox.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase Console. Please enable it in the Authentication tab.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid admin credentials. If this is a new admin account, please use the "Register" option below.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network Connection Failed (ইন্টারনেট কানেকশন সমস্যা)! Please check your internet, disable Ad-blockers, or try a different browser.');
      } else {
        setError('Authentication failed: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      if (!result.user.email) {
        throw new Error('No email found associated with this Google account.');
      }
      if (!isAdminEmail(result.user.email)) {
        await auth.signOut();
        setError('Unauthorized! This Google account is not a designated admin account.');
        setIsLoading(false);
        return;
      }
      
      navigate('/admin/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login window was closed. Please keep the Google popup open until login is finished. (যদি উইন্ডোটি নিজে থেকেই বন্ধ হয়ে যায়, তবে ব্রাউজারে পপআপ অ্যালাউ করুন)');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignore duplicate request errors
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup Blocked! Please allow popups for this site in your browser settings to use Google Sign-In.');
      } else {
        console.error("Google Login Error:", err);
        setError('Google Sign-In failed: ' + (err.message || 'Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#1a1a1a] p-10 rounded-3xl border border-slate-800 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            {isRegistering ? 'Create Admin' : 'Admin Portal'}
          </h1>
          <p className="text-slate-400">
            {isRegistering ? 'Setup your administrative account' : 'Please sign in to manage orders'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 text-xs font-bold leading-relaxed"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {msg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 flex items-center gap-3 bg-success/10 border border-success/20 p-4 rounded-xl text-success text-xs font-bold leading-relaxed"
          >
            <MailCheck className="h-5 w-5 shrink-0" />
            <span>{msg}</span>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Google Login - Recommended because it works out of box */}
          {!isRegistering && (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white text-slate-900 py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
              >
                <Chrome className="h-5 w-5" /> Sign in with Google
              </button>
              <div className="relative flex items-center gap-4 py-2">
                <div className="h-px bg-slate-700 flex-1"></div>
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">or email</span>
                <div className="h-px bg-slate-700 flex-1"></div>
              </div>
            </>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  className="w-full bg-black text-white border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600"
                  placeholder="admin@eflyer.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black text-white border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-50 ${
                isRegistering ? 'bg-success text-white hover:bg-success/80' : 'bg-primary text-white hover:bg-secondary'
              }`}
            >
              {isLoading ? (
                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>{isRegistering ? 'Create Admin Account' : 'Sign In to Admin'} <LogIn className="h-5 w-5" /></>
              )}
            </button>

            <div className="space-y-4 pt-4">
              <div className="h-px bg-slate-800" />
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full text-sm font-bold flex flex-col items-center gap-2 group"
              >
                <span className="text-slate-500 uppercase tracking-tighter text-[10px]">
                  {isRegistering ? 'Already have an account?' : 'First time using this email?'}
                </span>
                <span className="text-primary group-hover:underline">
                  {isRegistering ? 'Back to Login' : 'Click here to Register first'}
                </span>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-700 text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Authorized personnel only. All access is logged.
        </div>
      </motion.div>
    </div>
  );
};


export default AdminLogin;
