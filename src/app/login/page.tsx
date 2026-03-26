'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Loader2, ArrowLeft, Mail, Lock, User, Shield, ChevronDown } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('public') // Default role
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Explicitly check for empty fields before calling Supabase
    if (!email || !password || !name) {
      setMessage('Please enter your name, email, and password.')
      return
    }
    
    setLoading(true)
    setMessage('') // Clear any old messages
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    })
    
    if (error) {
      setMessage(error.message)
    } else {
      // Create initial profile record with the name AND selected role
      if (data.user) {
         await supabase.from('profiles').insert([
           { 
             id: data.user.id, 
             role: role, // 'public', 'subscriber', or 'admin'
             subscription_status: 'inactive',
             full_name: name
           }
         ])
      }
      setMessage('Check your email for the confirmation link! (Or sign in if confirmation is disabled)')
    }
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Explicitly check for empty fields before calling Supabase
    if (!email || !password) {
      setMessage('Please enter both email and password.')
      return
    }
    
    setLoading(true)
    setMessage('') // Clear any old messages
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      router.push('/dashboard') 
    }
    setLoading(false)
  }

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 20 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-200 selection:text-rose-900 overflow-hidden flex items-center justify-center p-6 relative">
      
      {/* Soft Animated Mesh Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-rose-50 opacity-80" />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0], opacity: [0.4, 0.6, 0.4] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-125 h-125 bg-rose-200 rounded-full mix-blend-multiply filter blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 5, 0], opacity: [0.4, 0.6, 0.4] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-20 w-150 h-150 bg-indigo-200 rounded-full mix-blend-multiply filter blur-[100px]"
        />
      </div>

      {/* Glassmorphism Auth Card */}
      <motion.div 
        initial="hidden" animate="visible" variants={staggerContainer}
        className="relative z-10 w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white p-8 md:p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
      >
        <motion.div variants={fadeUp} className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-white border border-rose-100 shadow-sm rounded-2xl mb-6 hover:scale-105 transition-transform">
            <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
            {isSignUp ? 'Join the Club' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 font-medium">
            {isSignUp ? 'Create an account to start your impact.' : 'Enter your details to access your dashboard.'}
          </p>
        </motion.div>

        <form className="space-y-5">
          <AnimatePresence>
            {isSignUp && (
              <motion.div 
                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Account Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Shield className="w-5 h-5 text-slate-400" />
                    </div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-11 pr-10 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 appearance-none cursor-pointer"
                    >
                      <option value="public">Public (Default)</option>
                      <option value="subscriber">Subscriber</option>
                      <option value="admin">Admin</option>
                    </select>
                    {/* Custom Dropdown Arrow */}
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium placeholder:text-slate-400"
                required
              />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium placeholder:text-slate-400"
                required
              />
            </div>
          </motion.div>

          {message && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
              <p className={`text-sm text-center font-bold p-3 rounded-xl ${message.includes('Check your email') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                {message}
              </p>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="pt-4 space-y-3">
            <motion.button 
              type="button" 
              onClick={isSignUp ? handleSignUp : handleSignIn} 
              disabled={loading} 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-colors shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
            </motion.button>
            
            <motion.button 
              type="button" 
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage('')
              }} 
              disabled={loading} 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-colors flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create one'}
            </motion.button>
          </motion.div>
        </form>

        <motion.div variants={fadeUp} className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}