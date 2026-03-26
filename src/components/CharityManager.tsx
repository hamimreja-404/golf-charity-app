'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, HeartHandshake, CheckCircle2, Loader2 } from 'lucide-react'

interface Charity {
  id: string;
  name: string;
  description: string;
}

interface CharityManagerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentPercent: number;
  currentCharityId: string | null;
  onSaveSuccess: () => void;
}

export default function CharityManager({ 
  isOpen, 
  onClose, 
  userId, 
  currentPercent, 
  currentCharityId,
  onSaveSuccess
}: CharityManagerProps) {
  const [charities, setCharities] = useState<Charity[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(currentCharityId)
  const [percent, setPercent] = useState<number>(currentPercent || 10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchCharities()
      setSelectedId(currentCharityId)
      setPercent(currentPercent || 10)
    }
  }, [isOpen, currentCharityId, currentPercent])

  const fetchCharities = async () => {
    setLoading(true)
    const { data } = await supabase.from('charities').select('id, name, description')
    if (data) setCharities(data)
    
    if (!currentCharityId && data && data.length > 0) {
      setSelectedId(data[0].id)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ 
        selected_charity_id: selectedId,
        charity_contribution_percent: percent 
      })
      .eq('id', userId)

    setSaving(false)
    if (!error) {
      onSaveSuccess() 
      onClose()
    } else {
      alert("Failed to update settings")
    }
  }

  // Added 'hex' values so we can use them in our inline gradient style
  const getReaction = (p: number) => {
    if (p <= 20) return { emoji: "🙂", text: "Every bit helps!", color: "text-rose-400", hex: "#fb7185" };
    if (p <= 40) return { emoji: "😊", text: "That's generous!", color: "text-rose-500", hex: "#f43f5e" };
    if (p <= 60) return { emoji: "😄", text: "Amazing impact!", color: "text-rose-600", hex: "#e11d48" };
    if (p <= 80) return { emoji: "😍", text: "You're a superstar!", color: "text-rose-700", hex: "#be123c" };
    return { emoji: "💖", text: "Absolute legend!", color: "text-rose-800", hex: "#9f1239" };
  }

  const currentReaction = getReaction(percent);
  
  // Calculate exactly how far along the track the thumb is (0% to 100%)
  // Since our min is 10 and max is 100, we have to adjust the math slightly
  const min = 10;
  const max = 100;
  const fillPercentage = ((percent - min) / (max - min)) * 100;

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-linear-to-r from-rose-50 to-pink-50 p-6 sm:p-8 border-b border-rose-100 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
              <HeartHandshake className="w-8 h-8 text-rose-500" />
              Manage Your Impact
            </h2>
            <p className="text-gray-600 mt-2 text-sm">Select a cause and choose what percentage of your subscription goes directly to them.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/50 hover:bg-white rounded-full text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8">
          
          {/* Slider Section */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner transition-all duration-300">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Contribution Amount</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span key={currentReaction.emoji} className="text-2xl animate-in zoom-in spin-in-12 duration-300">
                    {currentReaction.emoji}
                  </span>
                  <span className={`text-sm font-bold transition-colors duration-300 ${currentReaction.color}`}>
                    {currentReaction.text}
                  </span>
                </div>
              </div>
              <span className={`text-5xl font-black transition-colors duration-300 tracking-tighter ${currentReaction.color}`}>
                {percent}%
              </span>
            </div>
            
            <div className="relative pt-2 pb-2">
              <input 
                type="range" 
                min={min} 
                max={max} 
                step="5"
                value={percent}
                onChange={(e) => setPercent(parseInt(e.target.value))}
                // We use complex Tailwind arbitrary variants here to completely style the thumb across all browsers!
                className="w-full h-3 rounded-full appearance-none cursor-pointer transition-all duration-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-current [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-colors [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-current [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-colors"
                style={{
                  // This gradient draws the dynamic color up to the fillPercentage, and gray for the rest
                  background: `linear-gradient(to right, ${currentReaction.hex} ${fillPercentage}%, #e5e7eb ${fillPercentage}%)`,
                  // Setting the color here allows 'border-current' in the Tailwind classes to match the thumb border to the track!
                  color: currentReaction.hex 
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-bold uppercase tracking-wider">
              <span>10% Min</span>
              <span>100% Max</span>
            </div>
          </div>

          {/* Charity Selection Section */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Choose a Cause</h3>
            
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
            ) : (
              <div className="grid gap-3">
                {charities.map((charity) => (
                  <div 
                    key={charity.id}
                    onClick={() => setSelectedId(charity.id)}
                    className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                      selectedId === charity.id 
                        ? 'border-rose-500 bg-rose-50/50 shadow-md transform scale-[1.01]' 
                        : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`mt-1 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedId === charity.id ? 'border-rose-500 bg-rose-500' : 'border-gray-300'
                    }`}>
                      {selectedId === charity.id && <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in duration-200" />}
                    </div>
                    <div>
                      <h4 className={`font-black text-lg ${selectedId === charity.id ? 'text-rose-900' : 'text-gray-900'}`}>
                        {charity.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{charity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-3xl">
          <button 
            onClick={onClose}
            className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || !selectedId}
            className="px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-[0_8px_16px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Impact Settings
          </button>
        </div>

      </div>
    </div>
  )
}