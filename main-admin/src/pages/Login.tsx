import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/auth';
import { Scissors, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const ok = await auth.login(email, password);
    setLoading(false);
    
    if (ok) {
      navigate('/');
    } else {
      setError('Invalid superadmin credentials');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] font-sans relative overflow-hidden">
      {/* Premium SaaS Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-500/5 blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-[420px] px-4 relative z-10"
      >
        <Card className="border-white/40 shadow-2xl bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[32px]">
          <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardContent className="p-8 sm:p-10">
            <div className="flex flex-col items-center mb-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-6"
              >
                <Scissors size={28} className="drop-shadow-sm" />
              </motion.div>
              <h1 className="m-0 text-2xl font-bold text-stone-900 tracking-tight text-center">Global Admin</h1>
              <p className="mt-2 text-stone-500 text-sm font-medium text-center">Sign in to manage the Glowup network.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-sm font-bold text-stone-700">
                Email
                <Input 
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="admin@glowup.com"
                  className="bg-white/80 border-stone-200 focus-visible:ring-indigo-600"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5 text-sm font-bold text-stone-700">
                Password
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="bg-white/80 border-stone-200 focus-visible:ring-indigo-600 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-red-600 text-xs font-bold bg-red-50/80 px-3 py-2.5 rounded-xl border border-red-100 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 block" />
                  {error}
                </motion.div>
              )}
              
              <Button 
                type="submit" 
                disabled={loading}
                className="mt-4 w-full h-[52px] rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all text-base"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign in to Dashboard"}
              </Button>
            </form>

            <div className="mt-8 text-xs text-stone-500 bg-stone-50/80 p-4 rounded-2xl font-medium border border-stone-100/80 text-center flex flex-col gap-1">
              <strong className="text-stone-700 block mb-1 uppercase tracking-wider text-[10px]">Demo Credentials</strong>
              <span>superadmin@glowup.test</span>
              <span>superadmin123</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}