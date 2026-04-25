import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, LogOut, CheckCircle, ShieldCheck, MailCheck, LayoutDashboard, Chrome } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isAdminEmail } from '../constants';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const UserAuthModal: React.FC<UserAuthModalProps> = ({ isOpen, onClose, user }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const isAdminUser = isAdminEmail(user?.email);

  const syncUserToFirestore = async (authUser: any) => {
    try {
      const userRef = doc(db, 'users', authUser.uid);
      const userSnap = await getDoc(userRef);
      
      const userData = {
        uid: authUser.uid,
        displayName: authUser.displayName || name || 'Anonymous User',
        email: authUser.email,
        photoURL: authUser.photoURL || '',
        lastLogin: serverTimestamp(),
        role: isAdminEmail(authUser.email) ? 'admin' : 'user'
      };

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, userData, { merge: true });
      }
    } catch (err) {
      console.error("Error syncing user:", err);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUserToFirestore(result.user);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMsg('');

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await syncUserToFirestore(userCredential.user);

        await sendEmailVerification(userCredential.user);
        setMsg('Verification email sent! Please check your inbox.');
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await syncUserToFirestore(result.user);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Login method is disabled. Please enable "Email/Password" and "Google" in your Firebase Authentication Console.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. If you haven\'t created an account yet, please register first.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error (ইন্টারনেট সমস্যা)! Please check your internet or disable any Ad-blockers/VPN and try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    setMsg('');
    setError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setMsg('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#1a1a1a] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {user ? (
          <div className="p-10 text-center">
            <div className="relative inline-block mb-6">
              <div className="h-24 w-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary border-2 border-primary/20">
                <User size={48} />
              </div>
            </div>
            
            <h2 className="text-2xl font-black mb-1">{user.displayName || 'Welcome Back'}</h2>
            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="flex items-center justify-center gap-2">
                <p className="text-slate-400 text-sm">{user.email}</p>
                {user.emailVerified ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-bold">Unverified</span>
                )}
              </div>
              
              <button 
                onClick={() => {
                  onClose();
                  navigate('/dashboard?tab=profile');
                }}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                Edit Profile Settings
              </button>

              {!user.emailVerified && (
                <button 
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Resend Verification Email'}
                </button>
              )}
            </div>

            {msg && (
              <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl text-success text-[10px] font-bold flex items-center justify-center gap-2">
                <MailCheck size={14} /> {msg}
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Link 
                to="/dashboard" 
                onClick={onClose}
                className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 transition-all"
              >
                Go to Dashboard <LayoutDashboard size={16} />
              </Link>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
              >
                Sign Out <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Lock size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">{isRegistering ? 'Register' : 'Login'}</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Access your account</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold leading-relaxed">
                {error}
              </div>
            )}
            
            {msg && (
              <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl text-success text-xs font-bold flex items-center gap-2">
                <MailCheck size={16} /> {msg}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input 
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black text-white border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm placeholder:text-slate-600"
                      placeholder="Your Name"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input 
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black text-white border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm placeholder:text-slate-600"
                    placeholder="mail@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input 
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black text-white border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm placeholder:text-slate-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-secondary transition-all transform active:scale-95 disabled:opacity-50 mt-4"
              >
                {isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
              </button>

              {!isRegistering && (
                <>
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">OR</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 transition-all transform active:scale-95 mb-4 group"
                  >
                    <Chrome className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    Continue with Google
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-primary transition-colors py-2"
              >
                {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
              </button>

            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserAuthModal;
