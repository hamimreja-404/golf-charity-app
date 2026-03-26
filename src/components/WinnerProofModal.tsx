'use client'

import { useState } from 'react'
// Using relative path to resolve the compilation error
import { createClient } from '../../utils/supabase/client'
import { X, Trophy, Upload, CheckCircle2, Loader2, Info } from 'lucide-react'

export default function WinnerProofModal({ isOpen, onClose, userId, pendingWins, onUploadSuccess }: any) {
  const [proofUrl, setProofUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  if (!isOpen) return null

  const handleUpload = async () => {
    if (!proofUrl) {
      alert("Please provide a proof URL or screenshot link to continue.")
      return
    }
    
    setLoading(true)

    // Update all pending wins for this user with the proof
    // According to PRD Section 09, winners must provide a screenshot of scores
    const { error } = await supabase
      .from('winners')
      .update({ 
        proof_image_url: proofUrl,
        status: 'pending' // Ensure it's in pending state for admin review
      })
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (!error) {
      alert("Success! Your proof has been submitted. Our administrators will review the scores and update your payment status shortly.")
      onUploadSuccess()
      onClose()
    } else {
      console.error("Supabase Error:", error)
      alert("Submission failed. There was an issue connecting to the verification server. Please try again.")
    }
    setLoading(false)
  }

  const totalAmount = pendingWins.reduce((acc: number, w: any) => acc + Number(w.prize_amount), 0)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-10 animate-in zoom-in-95 fade-in duration-300 border border-white/20">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-100 shadow-inner group transition-transform hover:scale-105 duration-300">
            <Trophy className="w-10 h-10 text-amber-500 drop-shadow-sm group-hover:rotate-12 transition-transform" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Verify Your Win</h2>
          <p className="text-gray-500 text-sm mt-3 font-medium px-4 leading-relaxed">
            Congratulations on your match! Please provide a link to your Stableford score screenshot for admin verification.
          </p>
        </div>

        <div className="space-y-6">
          {/* Amount Highlight */}
          <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-100 flex items-center justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="relative z-10">
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Pending Prize</p>
              <p className="text-3xl font-black text-white leading-none mt-2">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center relative z-10 border border-white/20 backdrop-blur-sm">
              <CheckCircle2 className="text-white w-6 h-6" />
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Proof URL / Image Link
              </label>
              <div className="group relative cursor-help">
                <Info className="w-3 h-3 text-gray-300" />
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  Upload your screenshot to a site like Imgur and paste the link here.
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <input 
                type="text" 
                placeholder="https://imgur.com/your-score-proof" 
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-5 px-6 text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all pr-14 shadow-sm"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                <Upload className="text-gray-300 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* Submission Button */}
          <button 
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-gray-200 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Submit Proof</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-gray-400 text-center uppercase font-black tracking-[0.1em]">
            Verified payouts are processed within 24 hours
          </p>
        </div>
      </div>
    </div>
  )
}