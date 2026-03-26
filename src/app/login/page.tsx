'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Explicitly check for empty fields before calling Supabase
    if (!email || !password) {
      setMessage('Please enter both email and password.')
      return
    }
    
    setLoading(true)
    setMessage('') // Clear any old messages
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      setMessage(error.message)
    } else {
      // Create initial profile record
      if (data.user) {
         await supabase.from('profiles').insert([
           { id: data.user.id, role: 'public', subscription_status: 'inactive' }
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Join the Club</h1>
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
          <div className="flex space-x-4 pt-4">
            <button 
              type="button" 
              onClick={handleSignIn} 
              disabled={loading} 
              className="w-full p-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              Sign In
            </button>
            <button 
              type="button" 
              onClick={handleSignUp} 
              disabled={loading} 
              className="w-full p-3 bg-gray-200 text-black rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
          {message && <p className="text-sm text-center text-red-600 mt-4">{message}</p>}
        </form>
      </div>
    </div>
  )
}