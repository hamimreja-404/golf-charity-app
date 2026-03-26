'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trophy, UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function WinnerVerification({ userId }: { userId: string }) {
  const [pendingWins, setPendingWins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null) // holds ID of win being submitted
  const [proofUrl, setProofUrl] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const supabase = createClient()

  useEffect(() => {
    if (userId) fetchPendingWins()
  }, [userId])

  const fetchPendingWins = async () => {
    // Fetch wins that belong to the user, are still pending, and don't have proof uploaded yet
    const { data } = await supabase
      .from('winners')
      .select('*, draws(draw_month)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .is('proof_image_url', null)

    if (data) setPendingWins(data)
    setLoading(false)
  }

  const handleSubmitProof = async (winId: string) => {
    if (!proofUrl) {
      alert("Please provide a link to your screenshot proof.")
      return
    }

    setSubmitting(winId)
    
    const { error } = await supabase
      .from('winners')
      .update({ proof_image_url: proofUrl })
      .eq('id', winId)

    if (!error) {
      setSuccessMsg("Proof submitted successfully! An admin will review it shortly.")
      setProofUrl('')
      await fetchPendingWins() // Refresh the list
    } else {
      alert("Failed to submit proof. Please try again.")
    }
    
    setSubmitting(null)
  }

  if (loading) return null; // Don't show anything while checking

  if (pendingWins.length === 0) {
    return null; // Don't clutter the dashboard if they don't have any action required
  }

  return (
    <div className="bg-linear-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg mb-8 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-amber-100 p-2 rounded-full">
          <Trophy className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-amber-900">Action Required: Claim Your Winnings!</h2>
          <p className="text-amber-700 text-sm">You have won in a recent draw. Upload your score proof to claim your prize.</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="space-y-4">
        {pendingWins.map(win => (
          <div key={win.id} className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900">
                {win.match_type}-Number Match 
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Draw: {new Date(win.draws.draw_month).toLocaleDateString()})
                </span>
              </p>
              <p className="text-2xl font-black text-amber-600">${win.prize_amount}</p>
            </div>
            
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
              <input 
                type="url" 
                placeholder="Paste image URL here..."
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="p-2 border rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <button 
                onClick={() => handleSubmitProof(win.id)}
                disabled={submitting === win.id}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting === win.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                Submit Proof
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}