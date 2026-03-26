'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function ScoreManager({ userId }: { userId: string }) {
  const [scores, setScores] = useState<any[]>([])
  const [newScore, setNewScore] = useState('')
  const [playedDate, setPlayedDate] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    // Fetches scores and orders them most recent first [cite: 50]
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('played_date', { ascending: false }) 
    
    if (data) setScores(data)
  }

  const handleAddScore = async () => {
    const scoreVal = parseInt(newScore)
    if (scoreVal < 1 || scoreVal > 45) {
      alert("Score must be between 1 and 45")
      return
    }
    if (!playedDate) {
      alert("Please select a date")
      return
    }

    const { error } = await supabase
      .from('scores')
      .insert([{ user_id: userId, score: scoreVal, played_date: playedDate }])

    if (!error) {
      setNewScore('')
      setPlayedDate('')
      fetchScores() // Refresh the list
    } else {
      alert("Error saving score")
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm mt-6">
      <h2 className="text-xl font-bold mb-4">Your Latest Scores</h2>
      
      {/* Input Area */}
      <div className="flex gap-4 mb-6">
        <input 
          type="number" 
          placeholder="Score (1-45)" 
          value={newScore}
          onChange={(e) => setNewScore(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input 
          type="date" 
          value={playedDate}
          onChange={(e) => setPlayedDate(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button onClick={handleAddScore} className="bg-black text-white px-6 py-2 rounded font-bold">
          Add
        </button>
      </div>

      {/* Display Area */}
      <div className="space-y-2">
        {scores.map((s) => (
          <div key={s.id} className="flex justify-between bg-gray-50 p-3 rounded border">
            <span className="font-medium">Score: {s.score} pts</span>
            <span className="text-gray-500">{s.played_date}</span>
          </div>
        ))}
        {scores.length === 0 && <p className="text-gray-500 text-sm">No scores added yet.</p>}
      </div>
    </div>
  )
}