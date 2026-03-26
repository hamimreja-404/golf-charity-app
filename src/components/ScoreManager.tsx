'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2, Trophy, CalendarDays, Award, Trash2 } from 'lucide-react'

interface Score {
  id: string;
  score: number;
  played_date: string;
}

export default function ScoreManager({ userId }: { userId: string }) {
  const [scores, setScores] = useState<Score[]>([])
  const [newScore, setNewScore] = useState('')
  const [playedDate, setPlayedDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('played_date', { ascending: false }) 
      .limit(5) // Ensure we only ever start with 5
    
    if (data) setScores(data)
  }

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const scoreVal = parseInt(newScore)
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) return alert("Score 1-45 only");
    if (!playedDate) return alert("Select a date");

    setIsSubmitting(true)

    // 1. Save to Backend FIRST
    const { data, error } = await supabase
      .from('scores')
      .insert([{ user_id: userId, score: scoreVal, played_date: playedDate }])
      .select()
      .single()

    if (error) {
      alert("Error saving score")
      setIsSubmitting(false)
      return
    }

    // 2. Only after backend confirmation, update the UI
    if (data) {
      setScores(prev => {
        // Add new score to the top
        const updated = [data, ...prev];
        // If more than 5, remove the oldest (the last one in the array)
        return updated.slice(0, 5);
      });
      
      // Reset inputs
      setNewScore('')
      setPlayedDate('')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="p-2 w-full">
      {/* Header & Form remain the same as previous response */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <Trophy className="w-6 h-6 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent 5 Scores</h2>
      </div>

      <form onSubmit={handleAddScore} className="flex flex-col md:flex-row gap-4 mb-8">
        <input 
          type="number" 
          value={newScore}
          onChange={(e) => setNewScore(e.target.value)}
          placeholder="Score"
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
        />
        <input 
          type="date" 
          value={playedDate}
          onChange={(e) => setPlayedDate(e.target.value)}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
        />
        <button 
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 min-w-30"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
        </button>
      </form>

      {/* List Area */}
      <div className="space-y-3">
        <AnimatePresence mode='popLayout'>
          {scores.map((s) => (
            <motion.div 
              key={s.id} 
              layout // This makes other items slide smoothly when one is removed
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }} // Oldest slides out to the right
              transition={{ type: "spring", stiffness: 500, damping: 30, opacity: { duration: 0.2 } }}
              className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                  <Award className="w-5 h-5" />
                </div>
                <span className="font-black text-lg text-slate-900">{s.score} pts</span>
              </div>
              <div className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
                {s.played_date}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}