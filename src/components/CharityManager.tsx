'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Heart, CheckCircle2, Loader2, Info } from 'lucide-react'

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
      // Reset local state to match props when opened
      setSelectedId(currentCharityId)
      setPercent(currentPercent || 10)
    }
  }, [isOpen, currentCharityId, currentPercent])

  const fetchCharities = async () => {
    setLoading(true)
    const { data } = await supabase.from('charities').select('id, name, description')
    if (data) setCharities(data)
    
    // Auto-select first charity if none is selected
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
      onSaveSuccess() // Triggers the dashboard to refresh
      onClose()
    } else {
      alert("Failed to update settings")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Blurred Background Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-linear-to-r from-rose-50 to-pink-50 p-6 sm:p-8 border-b border-rose-100 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              Manage Your Impact
            </h2>
            <p className="text-gray-600 mt-2 text-sm">Select a cause and choose what percentage of your subscription goes directly to them.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/50 hover:bg-white rounded-full text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8">
          
          {/* Slider Section */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Contribution Amount</h3>
                <p className="text-sm text-gray-500">PRD Rule: Minimum 10%</p>
              </div>
              <span className="text-3xl font-black text-rose-600">{percent}%</span>
            </div>
            
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="5"
              value={percent}
              onChange={(e) => setPercent(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-bold">
              <span>10% (Min)</span>
              <span>100% (Max)</span>
            </div>
          </div>

          {/* Charity Selection Section */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Choose a Cause</h3>
            
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
            ) : (
              <div className="grid gap-3">
                {charities.map((charity) => (
                  <div 
                    key={charity.id}
                    onClick={() => setSelectedId(charity.id)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                      selectedId === charity.id 
                        ? 'border-rose-500 bg-rose-50/50 shadow-sm' 
                        : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`mt-1 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedId === charity.id ? 'border-rose-500 bg-rose-500' : 'border-gray-300'
                    }`}>
                      {selectedId === charity.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <h4 className={`font-bold ${selectedId === charity.id ? 'text-rose-900' : 'text-gray-900'}`}>
                        {charity.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{charity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || !selectedId}
            className="px-8 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-md transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Settings
          </button>
        </div>

      </div>
    </div>
  )
}